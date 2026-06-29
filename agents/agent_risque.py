"""
Agent Risque
Reçoit la décision de l'Agent Décision + état du portefeuille
Valide, réduit ou bloque le trade selon le niveau de risque
"""

import os
import json
import time
import logging
from groq import Groq

log = logging.getLogger(__name__)

SYSTEM_PROMPT = """Tu es un agent de gestion des risques dans un simulateur financier.
Tu reçois une décision de trading et tu dois valider ou bloquer cette décision selon le risque.

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après, avec exactement cette structure :
{
  "approved": true | false,
  "adjusted_amount_pct": 0-25,
  "stop_loss_pct": 5-15,
  "take_profit_pct": 5-30,
  "risk_flags": ["flag1", "flag2"],
  "verdict": "explication courte en français"
}

Règles STRICTES de gestion du risque :
- approved false si : confidence < 40, ou risk_level="élevé" avec impact_score news > 7
- approved false si : le portefeuille est déjà en perte > 15%
- adjusted_amount_pct : peut réduire le montant proposé si risque trop élevé (jamais augmenter)
- stop_loss_pct : % de perte max avant vente automatique (entre 5% et 15%)
- take_profit_pct : % de gain cible avant prise de bénéfice (entre 5% et 30%)
- risk_flags : liste des alertes détectées (ex: "RSI suracheté", "Forte volatilité", "News négatives récentes")
- verdict : 1 phrase expliquant la décision en français
- En cas de doute, réduire le montant plutôt que bloquer
"""


class AgentRisque:
    def __init__(self):
        self.client = Groq(api_key=os.environ["GROQ_API_KEY"])
        self.model  = "qwen/qwen3-32b"

    def run(
        self,
        decision: dict,
        analyse: dict,
        news: dict,
        portfolio: dict,
        positions: list[dict],
    ) -> dict | None:
        """
        decision  : résultat de AgentDecision
        analyse   : résultat de AgentAnalyse
        news      : résultat de AgentNews
        portfolio : { capital_usdt, total_value, performance }
        positions : liste de toutes les positions ouvertes
        """
        start = time.time()

        nb_positions    = len(positions)
        capital_total   = portfolio.get("total_value", 10000)
        capital_dispo   = portfolio.get("capital_usdt", 0)
        perf_globale    = portfolio.get("performance", 0)
        exposition_pct  = round(((capital_total - capital_dispo) / capital_total) * 100, 2) if capital_total else 0

        user_msg = f"""Évalue le risque de ce trade simulé.

=== DÉCISION PROPOSÉE ===
Action : {decision.get('action')}
Ticker : {decision.get('ticker')}
Confiance : {decision.get('confidence')}%
Montant proposé : {decision.get('amount_pct')}% du capital
Niveau de risque évalué : {decision.get('risk_level')}
Horizon : {decision.get('horizon')}
Raison : {decision.get('reason')}

=== CONTEXTE MARCHÉ ===
Tendance technique : {analyse.get('trend')} (force: {analyse.get('strength')}/100)
Sentiment news : {news.get('sentiment')} (impact: {news.get('impact_score')}/10)
Signaux détectés : {', '.join(analyse.get('signals', []))}

=== ÉTAT DU PORTEFEUILLE ===
Capital disponible : {capital_dispo}$
Valeur totale : {capital_total}$
Performance globale : {perf_globale:+.2f}%
Positions ouvertes : {nb_positions}
Exposition actuelle : {exposition_pct}% du capital

Valide ou bloque ce trade."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user",   "content": user_msg},
                ],
                temperature=0.1,
                max_tokens=512,
            )

            raw = response.choices[0].message.content.strip()
            if "<think>" in raw:
                raw = raw.split("</think>")[-1].strip()

            result = json.loads(raw)
            result["duration_ms"] = int((time.time() - start) * 1000)
            return result

        except json.JSONDecodeError as e:
            log.error(f"AgentRisque JSON invalide: {e}\nRaw: {raw}")
            return None
        except Exception as e:
            log.error(f"AgentRisque erreur: {e}")
            return None
