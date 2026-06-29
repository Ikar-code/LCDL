"""
Agent Risque — Gemini
"""
import os
import json
import time
import logging
import google.generativeai as genai

log = logging.getLogger(__name__)

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

SYSTEM_PROMPT = """Tu es un agent de gestion des risques dans un simulateur financier.

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après, sans balises markdown :
{
  "approved": true,
  "adjusted_amount_pct": 15,
  "stop_loss_pct": 8,
  "take_profit_pct": 15,
  "risk_flags": ["flag1"],
  "verdict": "explication courte en français"
}

approved : true ou false
adjusted_amount_pct : 0 à 25 (ne jamais augmenter le montant proposé)
stop_loss_pct : 5 à 15
take_profit_pct : 5 à 30
Bloquer si confidence < 40 ou risk_level élevé avec news très négatives."""


class AgentRisque:
    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name="gemini-3.1-flash-lite",
            system_instruction=SYSTEM_PROMPT,
        )

    def run(self, decision, analyse, news, portfolio, positions) -> dict | None:
        start = time.time()

        capital_total  = portfolio.get("total_value", 10000)
        capital_dispo  = portfolio.get("capital_usdt", 0)
        exposition_pct = round(((capital_total - capital_dispo) / capital_total) * 100, 2) if capital_total else 0

        user_msg = f"""Évalue le risque :

DÉCISION : {decision.get('action')} {decision.get('ticker')}
Confiance : {decision.get('confidence')}%
Montant proposé : {decision.get('amount_pct')}%
Risque évalué : {decision.get('risk_level')}

MARCHÉ :
Tendance : {analyse.get('trend')} (force: {analyse.get('strength')}/100)
Sentiment news : {news.get('sentiment')} (impact: {news.get('impact_score')}/10)

PORTEFEUILLE :
Capital dispo : {capital_dispo}$ / total : {capital_total}$
Exposition actuelle : {exposition_pct}%
Positions ouvertes : {len(positions)}"""

        try:
            response = self.model.generate_content(user_msg)
            raw = response.text.strip().replace("```json", "").replace("```", "").strip()
            result = json.loads(raw)
            result["duration_ms"] = int((time.time() - start) * 1000)
            return result
        except json.JSONDecodeError as e:
            log.error(f"AgentRisque JSON invalide: {e}")
            return None
        except Exception as e:
            log.error(f"AgentRisque erreur: {e}")
            return None
