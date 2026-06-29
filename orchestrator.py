"""
LCDL — Orchestrateur des agents IA
Tourne après le Data Collector (GitHub Actions séparé ou enchaîné)

Pipeline par ticker :
  AgentAnalyse → AgentNews → AgentDecision → AgentRisque → Execution simulation
"""

import os
import logging
import time
from datetime import datetime, timezone
from supabase import create_client, Client
from dotenv import load_dotenv

from agents.agent_analyse   import AgentAnalyse
from agents.agent_news      import AgentNews
from agents.agent_decision  import AgentDecision
from agents.agent_risque    import AgentRisque

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
TICKERS      = ["AAPL", "TSLA", "MSFT", "GOOGL", "NVDA"]


# ── Helpers Supabase ──────────────────────────────────────────────────────────

def get_latest_price(sb: Client, ticker: str) -> dict | None:
    res = sb.table("prices").select("*").eq("ticker", ticker)\
            .order("fetched_at", desc=True).limit(1).execute()
    return res.data[0] if res.data else None

def get_indicators(sb: Client, ticker: str) -> dict | None:
    res = sb.table("indicators").select("*").eq("ticker", ticker).execute()
    return res.data[0] if res.data else None

def get_recent_news(sb: Client, ticker: str, limit: int = 10) -> list[dict]:
    res = sb.table("news").select("*")\
            .eq("ticker", ticker)\
            .order("fetched_at", desc=True).limit(limit).execute()
    return res.data or []

def get_portfolio(sb: Client) -> dict | None:
    res = sb.table("portfolio").select("*").order("id").limit(1).execute()
    return res.data[0] if res.data else None

def get_position(sb: Client, ticker: str) -> dict | None:
    res = sb.table("positions").select("*").eq("ticker", ticker).execute()
    return res.data[0] if res.data else None

def get_all_positions(sb: Client) -> list[dict]:
    res = sb.table("positions").select("*").execute()
    return res.data or []

def log_agent(sb: Client, agent_name: str, ticker: str, input_data: dict, output_data: dict, duration_ms: int):
    sb.table("agent_logs").insert({
        "agent_name":  agent_name,
        "ticker":      ticker,
        "input_data":  input_data,
        "output_data": output_data,
        "duration_ms": duration_ms,
        "created_at":  datetime.now(timezone.utc).isoformat(),
    }).execute()


# ── Simulation du trade ───────────────────────────────────────────────────────

def execute_trade(sb: Client, ticker: str, action: str, decision: dict, risque: dict, price: float, portfolio: dict):
    """Simule l'exécution d'un trade : met à jour portfolio, positions, trades."""

    if action == "HOLD":
        log.info(f"{ticker}: HOLD — aucune action")
        return

    capital_dispo = float(portfolio["capital_usdt"])
    amount_pct    = float(risque["adjusted_amount_pct"]) / 100
    amount_usdt   = round(capital_dispo * amount_pct, 2)

    if action == "BUY":
        if amount_usdt < 10:
            log.warning(f"{ticker}: montant trop faible ({amount_usdt}$), HOLD")
            return

        quantity = round(amount_usdt / price, 6)

        # Insérer ou mettre à jour la position
        existing = get_position(sb, ticker)
        if existing:
            # Moyenne d'achat
            total_qty   = float(existing["quantity"]) + quantity
            avg_price   = round(
                (float(existing["quantity"]) * float(existing["avg_price"]) + amount_usdt) / total_qty, 4
            )
            sb.table("positions").update({
                "quantity":      total_qty,
                "avg_price":     avg_price,
                "current_price": price,
                "updated_at":    datetime.now(timezone.utc).isoformat(),
            }).eq("ticker", ticker).execute()
        else:
            sb.table("positions").insert({
                "ticker":        ticker,
                "quantity":      quantity,
                "avg_price":     price,
                "current_price": price,
                "pnl_value":     0,
                "pnl_pct":       0,
                "opened_at":     datetime.now(timezone.utc).isoformat(),
                "updated_at":    datetime.now(timezone.utc).isoformat(),
            }).execute()

        # Déduire du capital
        new_capital = round(capital_dispo - amount_usdt, 2)
        sb.table("portfolio").update({
            "capital_usdt": new_capital,
            "updated_at":   datetime.now(timezone.utc).isoformat(),
        }).eq("id", portfolio["id"]).execute()

        log.info(f"{ticker}: BUY {quantity} actions à {price}$ ({amount_usdt}$)")

    elif action == "SELL":
        position = get_position(sb, ticker)
        if not position:
            log.warning(f"{ticker}: SELL demandé mais aucune position ouverte")
            return

        quantity    = float(position["quantity"])
        sell_value  = round(quantity * price, 2)
        pnl         = round(sell_value - (quantity * float(position["avg_price"])), 2)

        # Supprimer la position
        sb.table("positions").delete().eq("ticker", ticker).execute()

        # Recréditer le capital
        new_capital = round(capital_dispo + sell_value, 2)
        sb.table("portfolio").update({
            "capital_usdt": new_capital,
            "updated_at":   datetime.now(timezone.utc).isoformat(),
        }).eq("id", portfolio["id"]).execute()

        amount_usdt = sell_value
        log.info(f"{ticker}: SELL {quantity} actions à {price}$ → P&L {pnl:+.2f}$")

    # Enregistrer le trade
    sb.table("trades").insert({
        "ticker":         ticker,
        "action":         action,
        "quantity":       quantity if action == "BUY" else float(get_position(sb, ticker)["quantity"]) if action == "SELL" else 0,
        "price":          price,
        "amount_usdt":    amount_usdt,
        "confidence":     decision.get("confidence"),
        "reason":         decision.get("reason"),
        "rsi_at_trade":   None,
        "trend_at_trade": decision.get("horizon"),
        "executed_at":    datetime.now(timezone.utc).isoformat(),
    }).execute()


# ── Pipeline principal ────────────────────────────────────────────────────────

def run():
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)

    agent_analyse  = AgentAnalyse()
    agent_news     = AgentNews()
    agent_decision = AgentDecision()
    agent_risque   = AgentRisque()

    portfolio  = get_portfolio(sb)
    positions  = get_all_positions(sb)

    if not portfolio:
        log.error("Aucun portefeuille trouvé en base — exécute le SQL d'init Supabase")
        return

    log.info(f"Portefeuille : {portfolio['capital_usdt']}$ dispo / {portfolio['total_value']}$ total")

    for ticker in TICKERS:
        log.info(f"\n{'='*40}\nAnalyse de {ticker}...")

        # 1. Récupérer les données
        price_data = get_latest_price(sb, ticker)
        indicators = get_indicators(sb, ticker)
        news_list  = get_recent_news(sb, ticker)
        position   = get_position(sb, ticker)

        if not price_data or not indicators:
            log.warning(f"{ticker}: données manquantes, on passe")
            continue

        # 2. Agent Analyse Technique
        analyse = agent_analyse.run(ticker, price_data, indicators)
        if not analyse:
            continue
        log_agent(sb, "analyse", ticker, {"price": price_data, "indicators": indicators}, analyse, analyse.get("duration_ms", 0))
        log.info(f"{ticker} → Analyse: {analyse['trend']} (force: {analyse['strength']})")

        time.sleep(1)

        # 3. Agent News
        news = agent_news.run(ticker, news_list)
        if not news:
            continue
        log_agent(sb, "news", ticker, {"articles_count": len(news_list)}, news, news.get("duration_ms", 0))
        log.info(f"{ticker} → News: {news['sentiment']} (impact: {news['impact_score']}/10)")

        time.sleep(1)

        # 4. Agent Décision
        decision = agent_decision.run(ticker, analyse, news, portfolio, position)
        if not decision:
            continue
        log_agent(sb, "decision", ticker, {"analyse": analyse, "news": news}, decision, decision.get("duration_ms", 0))
        log.info(f"{ticker} → Décision: {decision['action']} (confiance: {decision['confidence']}%)")

        time.sleep(1)

        # 5. Agent Risque
        risque = agent_risque.run(decision, analyse, news, portfolio, positions)
        if not risque:
            continue
        log_agent(sb, "risque", ticker, {"decision": decision}, risque, risque.get("duration_ms", 0))
        log.info(f"{ticker} → Risque: {'✅ APPROUVÉ' if risque['approved'] else '❌ BLOQUÉ'} — {risque['verdict']}")

        # 6. Exécuter le trade si approuvé
        if risque["approved"] and decision["action"] != "HOLD":
            execute_trade(sb, ticker, decision["action"], decision, risque, float(price_data["close"]), portfolio)
            # Recharger le portfolio après chaque trade
            portfolio = get_portfolio(sb)
            positions = get_all_positions(sb)

        time.sleep(2)  # Pause entre chaque ticker pour les rate limits Groq

    log.info("\nOrchestration terminée ✓")


if __name__ == "__main__":
    run()
