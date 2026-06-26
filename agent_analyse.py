"""
Agent Analyse Technique
Reçoit les données de prix + indicateurs d'un ticker
Retourne une analyse de la tendance en JSON
"""

import os
import json
import time
import logging
from groq import Groq

log = logging.getLogger(__name__)

SYSTEM_PROMPT = """Tu es un agent d'analyse technique financière expert.
Tu reçois les données de marché d'une action et tu dois analyser la tendance.

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après, avec exactement cette structure :
{
  "ticker": "AAPL",
  "trend": "bullish" | "bearish" | "neutral",
  "strength": 0-100,
  "signals": ["signal1", "signal2"],
  "summary": "résumé court en français"
}

Règles :
- strength = force de la tendance (0=très faible, 100=très forte)
- signals = liste des signaux détectés (ex: "RSI suracheté", "Croisement MACD haussier")
- summary = 1-2 phrases max en français
"""


class AgentAnalyse:
    def __init__(self):
        self.client = Groq(api_key=os.environ["GROQ_API_KEY"])
        self.model  = "qwen/qwen3-32b"

    def run(self, ticker: str, price_data: dict, indicators: dict) -> dict | None:
        """
        price_data : { close, change_pct, volume }
        indicators : { rsi, macd, macd_signal, sma_20, sma_50, trend }
        """
        start = time.time()

        user_msg = f"""Analyse l'action {ticker} :

Prix actuel : {price_data.get('close')}$
Variation du jour : {price_data.get('change_pct', 0):+.2f}%
Volume : {price_data.get('volume', 'N/A')}

Indicateurs techniques :
- RSI (14) : {indicators.get('rsi', 'N/A')}
- MACD : {indicators.get('macd', 'N/A')}
- Signal MACD : {indicators.get('macd_signal', 'N/A')}
- SMA 20 : {indicators.get('sma_20', 'N/A')}
- SMA 50 : {indicators.get('sma_50', 'N/A')}
- Tendance calculée : {indicators.get('trend', 'N/A')}

Donne ton analyse technique."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user",   "content": user_msg},
                ],
                temperature=0.2,
                max_tokens=512,
            )

            raw = response.choices[0].message.content.strip()
            # Nettoyer les balises <think> de Qwen si présentes
            if "<think>" in raw:
                raw = raw.split("</think>")[-1].strip()

            result = json.loads(raw)
            result["duration_ms"] = int((time.time() - start) * 1000)
            return result

        except json.JSONDecodeError as e:
            log.error(f"AgentAnalyse JSON invalide pour {ticker}: {e}\nRaw: {raw}")
            return None
        except Exception as e:
            log.error(f"AgentAnalyse erreur pour {ticker}: {e}")
            return None
