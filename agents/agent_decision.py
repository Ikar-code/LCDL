"""
Agent Décision
Reçoit l'analyse technique + l'analyse news
Retourne la décision finale : BUY / SELL / HOLD + justification
"""

import os
import json
import time
import logging
from groq import Groq

log = logging.getLogger(__name__)

SYSTEM_PROMPT = """Tu es un agent de décision d'investissement dans un simulateur financier.
Tu reçois une analyse technique et une analyse des actualités pour une action.
Tu dois prendre une décision de trading simulée (SANS argent réel).

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après, avec exactement cette structure :
{
  "ticker": "AAPL",
  "action": "BUY" | "SELL" | "HOLD",
  "confidence": 0-100,
  "amount_pct": 0-25,
  "horizon": "court" | "moyen" | "long",
  "reason": "justification détaillée en français",
  "risk_level": "faible" | "modéré" | "élevé"
}

Règles STRICTES :
- action BUY : tendance haussière + news positives ou neutres, RSI < 70
- action SELL : tendance baissière + news négatives, ou RSI > 75 (suracheté)
- action HOLD : signal ambigu, attendre confirmation
- confidence : ta certitude dans la décision (0=incertain, 100=très sûr)
- amount_pct : % du capital disponible à investir (max 25% par trade pour limiter le risque)
- horizon : court (<1 semaine), moyen (1-4 semaines), long (>1 mois)
- risk_level : évaluation du risque de ce trade
- Ne jamais mettre plus de 25% du capital sur une seule position
- En cas de doute, préférer HOLD
"""


class AgentDecision:
    def __init__(self):
        self.client = Groq(api_key=os.environ["GROQ_API_KEY"])
        self.model  = "qwen/qwen3-32b"

    def run(
        self,
        ticker: str,
        analyse: dict,
        news: dict,
        portfolio: dict,
        position: dict | None,
    ) -> dict | None:
        """
        analyse   : résultat de AgentAnalyse
        news      : résultat de AgentNews
        portfolio : { capital_usdt, total_value, performance }
        position  : position actuelle sur ce ticker (None si pas de position)
        """
        start = time.time()

        position_info = "Aucune position ouverte sur ce ticker."
        if position:
            position_info = (
                f"Position ouverte : {position['quantity']} actions "
                f"à {position['avg_price']}$ (P&L: {position.get('pnl_pct', 0):+.2f}%)"
            )

        user_msg = f"""Prends une décision de trading simulée pour {ticker}.

=== ANALYSE TECHNIQUE ===
Tendance : {analyse.get('trend')} (force : {analyse.get('strength')}/100)
Signaux : {', '.join(analyse.get('signals', []))}
Résumé : {analyse.get('summary')}

=== ACTUALITÉS ===
Sentiment : {news.get('sentiment')} (impact : {news.get('impact_score')}/10)
News clés : {', '.join(news.get('key_news', []))}
Résumé : {news.get('summary')}

=== PORTEFEUILLE VIRTUEL ===
Capital disponible : {portfolio.get('capital_usdt')}$
Valeur totale : {portfolio.get('total_value')}$
Performance globale : {portfolio.get('performance', 0):+.2f}%
{position_info}

Quelle est ta décision ?"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user",   "content": user_msg},
                ],
                temperature=0.3,
                max_tokens=600,
            )

            raw = response.choices[0].message.content.strip()
            if "<think>" in raw:
                raw = raw.split("</think>")[-1].strip()

            result = json.loads(raw)
            result["duration_ms"] = int((time.time() - start) * 1000)
            return result

        except json.JSONDecodeError as e:
            log.error(f"AgentDecision JSON invalide pour {ticker}: {e}\nRaw: {raw}")
            return None
        except Exception as e:
            log.error(f"AgentDecision erreur pour {ticker}: {e}")
            return None
