"""
Agent Décision — Gemini
"""
import os
import json
import time
import logging
import google.generativeai as genai

log = logging.getLogger(__name__)

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

SYSTEM_PROMPT = """Tu es un agent de décision d'investissement dans un simulateur financier.

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après, sans balises markdown :
{
  "ticker": "AAPL",
  "action": "BUY",
  "confidence": 72,
  "amount_pct": 15,
  "horizon": "court",
  "reason": "justification en français",
  "risk_level": "modéré"
}

action : BUY, SELL, ou HOLD
confidence : 0 à 100
amount_pct : 0 à 25 (% du capital, max 25%)
horizon : court, moyen, ou long
risk_level : faible, modéré, ou élevé
En cas de doute préférer HOLD."""


class AgentDecision:
    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name="gemini-3.1-flash-lite",
            system_instruction=SYSTEM_PROMPT,
        )

    def run(self, ticker, analyse, news, portfolio, position) -> dict | None:
        start = time.time()

        position_info = "Aucune position ouverte."
        if position:
            position_info = (
                f"Position ouverte : {position['quantity']} actions "
                f"à {position['avg_price']}$ (P&L: {position.get('pnl_pct', 0):+.2f}%)"
            )

        user_msg = f"""Décision pour {ticker} :

ANALYSE TECHNIQUE :
Tendance : {analyse.get('trend')} (force : {analyse.get('strength')}/100)
Signaux : {', '.join(analyse.get('signals', []))}
Résumé : {analyse.get('summary')}

ACTUALITÉS :
Sentiment : {news.get('sentiment')} (impact : {news.get('impact_score')}/10)
Résumé : {news.get('summary')}

PORTEFEUILLE :
Capital disponible : {portfolio.get('capital_usdt')}$
Performance globale : {portfolio.get('performance', 0):+.2f}%
{position_info}"""

        try:
            response = self.model.generate_content(user_msg)
            raw = response.text.strip().replace("```json", "").replace("```", "").strip()
            result = json.loads(raw)
            result["duration_ms"] = int((time.time() - start) * 1000)
            return result
        except json.JSONDecodeError as e:
            log.error(f"AgentDecision JSON invalide pour {ticker}: {e}")
            return None
        except Exception as e:
            log.error(f"AgentDecision erreur pour {ticker}: {e}")
            return None
