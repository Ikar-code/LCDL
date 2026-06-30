"""
LCDL — Orchestrateur Crypto avec stop-loss et circuit breaker
"""

import os
import logging
import time
from datetime import datetime, timezone
from supabase import create_client, Client
from dotenv import load_dotenv

from agents.agent_analyse  import AgentAnalyse
from agents.agent_news     import AgentNews
from agents.agent_decision import AgentDecision
from agents.agent_risque   import AgentRisque

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]

TICKERS = ["BTC", "ETH", "SOL", "BNB", "XRP"]

# ── Paramètres de risque ──────────────────────────────────────────────────────
STOP_LOSS_PCT      = 8.0   # Vente forcée si position perd > 8%
CIRCUIT_BREAKER_PCT = 20.0  # Pause totale si portefeuille perd > 20%
MAX_POSITION_PCT   = 20.0  # Max 20% du capital par position

EMPTY_INDICATORS = {
    "rsi": None, "macd": None, "macd_signal": None,
    "sma_20": None, "sma_50": None, "trend": "neutral"
}

# ── Helpers Supabase ──────────────────────────────────────────────────────────

def get_latest_price(sb, ticker):
    res = sb.table("prices").select("*").eq("ticker", ticker)\
            .order("fetched_at", desc=True).limit(1).execute()
    return res.data[0] if res.data else None

def get_indicators(sb, ticker):
    res = sb.table("indicators").select("*").eq("ticker", ticker).execute()
    return res.data[0] if res.data else None

def get_recent_news(sb, ticker, limit=10):
    res = sb.table("news").select("*").eq("ticker", ticker)\
            .order("fetched_at", desc=True).limit(limit).execute()
    return res.data or []

def get_portfolio(sb):
    res = sb.table("portfolio").select("*").order("id").limit(1).execute()
    return res.data[0] if res.data else None

def get_position(sb, ticker):
    res = sb.table("positions").select("*").eq("ticker", ticker).execute()
    return res.data[0] if res.data else None

def get_all_positions(sb):
    res = sb.table("positions").select("*").execute()
    return res.data or []

def log_agent(sb, agent_name, ticker, input_data, output_data, duration_ms):
    sb.table("agent_logs").insert({
        "agent_name":  agent_name,
        "ticker":      ticker,
        "input_data":  input_data,
        "output_data": output_data,
        "duration_ms": duration_ms,
        "created_at":  datetime.now(timezone.utc).isoformat(),
    }).execute()

# ── Stop-loss automatique ─────────────────────────────────────────────────────

def check_stop_losses(sb, positions, prices_map, portfolio):
    """Vend automatiquement toute position en perte > STOP_LOSS_PCT."""
    sold_any = False
    for pos in positions:
        ticker     = pos["ticker"]
        avg_price  = float(pos["avg_price"])
        current    = prices_map.get(ticker)
        if not current:
            continue

        current_price = float(current["close"])
        pnl_pct = ((current_price - avg_price) / avg_price) * 100

        if pnl_pct <= -STOP_LOSS_PCT:
            log.warning(f"🛑 STOP-LOSS déclenché pour {ticker} : {pnl_pct:.2f}%")
            _force_sell(sb, ticker, pos, current_price, portfolio, reason="stop_loss")
            sold_any = True

    return sold_any

def _force_sell(sb, ticker, position, price, portfolio, reason="stop_loss"):
    quantity   = float(position["quantity"])
    sell_value = round(quantity * price, 2)
    pnl        = round(sell_value - (quantity * float(position["avg_price"])), 2)

    sb.table("positions").delete().eq("ticker", ticker).execute()

    new_capital = round(float(portfolio["capital_usdt"]) + sell_value, 2)
    sb.table("portfolio").update({
        "capital_usdt": new_capital,
        "updated_at":   datetime.now(timezone.utc).isoformat(),
    }).eq("id", portfolio["id"]).execute()

    sb.table("trades").insert({
        "ticker":       ticker,
        "action":       "SELL",
        "quantity":     quantity,
        "price":        price,
        "amount_usdt":  sell_value,
        "confidence":   100,
        "reason":       f"Vente automatique ({reason}) — P&L: {pnl:+.2f}$",
        "executed_at":  datetime.now(timezone.utc).isoformat(),
    }).execute()

    log.info(f"{ticker}: SELL forcé {quantity} à {price}$ → P&L {pnl:+.2f}$")

# ── Exécution trade ───────────────────────────────────────────────────────────

def execute_trade(sb, ticker, action, decision, risque, price, portfolio):
    if action == "HOLD":
        return

    capital_dispo = float(portfolio["capital_usdt"])
    amount_pct    = min(float(risque["adjusted_amount_pct"]) / 100, MAX_POSITION_PCT / 100)
    amount_usdt   = round(capital_dispo * amount_pct, 2)
    quantity      = 0

    if action == "BUY":
        if amount_usdt < 5:
            log.warning(f"{ticker}: montant trop faible ({amount_usdt}$)")
            return

        quantity = round(amount_usdt / price, 8)
        existing = get_position(sb, ticker)

        if existing:
            total_qty = float(existing["quantity"]) + quantity
            avg_price = round(
                (float(existing["quantity"]) * float(existing["avg_price"]) + amount_usdt) / total_qty, 8
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

        sb.table("portfolio").update({
            "capital_usdt": round(capital_dispo - amount_usdt, 2),
            "updated_at":   datetime.now(timezone.utc).isoformat(),
        }).eq("id", portfolio["id"]).execute()

        log.info(f"{ticker}: BUY {quantity} à {price}$ ({amount_usdt}$)")

    elif action == "SELL":
        position = get_position(sb, ticker)
        if not position:
            log.warning(f"{ticker}: SELL demandé mais aucune position")
            return
        _force_sell(sb, ticker, position, price, portfolio, reason="decision_ia")
        return

    sb.table("trades").insert({
        "ticker":       ticker,
        "action":       action,
        "quantity":     quantity,
        "price":        price,
        "amount_usdt":  amount_usdt,
        "confidence":   decision.get("confidence"),
        "reason":       decision.get("reason"),
        "executed_at":  datetime.now(timezone.utc).isoformat(),
    }).execute()

# ── Pipeline principal ────────────────────────────────────────────────────────

def run():
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)

    agent_analyse  = AgentAnalyse()
    agent_news     = AgentNews()
    agent_decision = AgentDecision()
    agent_risque   = AgentRisque()

    portfolio = get_portfolio(sb)
    positions = get_all_positions(sb)

    if not portfolio:
        log.error("Aucun portefeuille trouvé")
        return

    # ── Circuit breaker ───────────────────────────────────────────────────────
    perf = float(portfolio.get("performance", 0))
    if perf <= -CIRCUIT_BREAKER_PCT:
        log.error(f"🚨 CIRCUIT BREAKER : portefeuille à {perf:.2f}% — trading suspendu")
        return

    log.info(f"Portefeuille : {portfolio['capital_usdt']}$ dispo | Perf: {perf:+.2f}%")

    # ── Stop-loss sur positions existantes ────────────────────────────────────
    prices_map = {}
    for ticker in TICKERS:
        p = get_latest_price(sb, ticker)
        if p:
            prices_map[ticker] = p

    if positions:
        check_stop_losses(sb, positions, prices_map, portfolio)
        portfolio = get_portfolio(sb)
        positions = get_all_positions(sb)

    # ── Analyse par ticker ────────────────────────────────────────────────────
    for ticker in TICKERS:
        log.info(f"\n{'='*40}\nAnalyse de {ticker}...")

        price_data = prices_map.get(ticker)
        indicators = get_indicators(sb, ticker)
        news_list  = get_recent_news(sb, ticker)
        position   = get_position(sb, ticker)

        if not price_data:
            log.warning(f"{ticker}: prix manquant")
            continue

        if not indicators:
            log.warning(f"{ticker}: indicateurs absents, valeurs neutres")
            indicators = EMPTY_INDICATORS

        # Agent Analyse
        analyse = agent_analyse.run(ticker, price_data, indicators)
        if not analyse:
            continue
        log_agent(sb, "analyse", ticker, {}, analyse, analyse.get("duration_ms", 0))
        log.info(f"{ticker} → {analyse['trend']} (force: {analyse['strength']})")
        time.sleep(4)  # Rate limit Gemini 15 RPM

        # Agent News
        news = agent_news.run(ticker, news_list)
        if not news:
            continue
        log_agent(sb, "news", ticker, {}, news, news.get("duration_ms", 0))
        log.info(f"{ticker} → News: {news['sentiment']} (impact: {news['impact_score']}/10)")
        time.sleep(4)

        # Agent Décision
        decision = agent_decision.run(ticker, analyse, news, portfolio, position)
        if not decision:
            continue
        log_agent(sb, "decision", ticker, {}, decision, decision.get("duration_ms", 0))
        log.info(f"{ticker} → {decision['action']} (confiance: {decision['confidence']}%)")
        time.sleep(4)

        # Agent Risque
        risque = agent_risque.run(decision, analyse, news, portfolio, positions)
        if not risque:
            continue
        log_agent(sb, "risque", ticker, {}, risque, risque.get("duration_ms", 0))
        log.info(f"{ticker} → {'✅ APPROUVÉ' if risque['approved'] else '❌ BLOQUÉ'} — {risque['verdict']}")
        time.sleep(4)

        # Exécution
        if risque["approved"] and decision["action"] != "HOLD":
            execute_trade(sb, ticker, decision["action"], decision, risque,
                         float(price_data["close"]), portfolio)
            portfolio = get_portfolio(sb)
            positions = get_all_positions(sb)

        time.sleep(2)

    # ── Mise à jour performance globale ──────────────────────────────────────
    positions = get_all_positions(sb)
    total_positions_value = sum(
        float(p["quantity"]) * float(prices_map.get(p["ticker"], {}).get("close", p["avg_price"]))
        for p in positions
    )
    total_value  = float(portfolio["capital_usdt"]) + total_positions_value
    CAPITAL_DEPART = 100
    performance  = round(((total_value - CAPITAL_DEPART) / CAPITAL_DEPART) * 100, 4)

    sb.table("portfolio").update({
        "total_value": round(total_value, 2),
        "performance": performance,
        "updated_at":  datetime.now(timezone.utc).isoformat(),
    }).eq("id", portfolio["id"]).execute()

    log.info(f"\nPortefeuille : {total_value:.2f}$ | Perf: {performance:+.2f}%")
    log.info("Orchestration terminée ✓")


if __name__ == "__main__":
    run()
