"""
Agent Analyse Technique — Gemini
"""
import os
import json
import time
import logging
import google.generativeai as genai

log = logging.getLogger(__name__)

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

SYSTEM_PROMPT = """Tu es un agent d'analyse technique financière expert.
Tu reçois les données de marché d'une action et tu dois analyser la tendance.

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après, sans balises markdown, avec exactement cette structure :
{
  "ticker": "AAPL",
  "trend": "bullish",
  "strength": 65,
  "signals": ["signal1", "signal2"],
  "summary": "résumé court en français"
}

trend doit être : bullish, bearish, ou neutral
strength : 0 à 100
signals : liste de signaux détectés
summary : 1-2 phrases en français"""


class AgentAnalyse:
    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=SYSTEM_PROMPT,
        )

    def run(self, ticker: str, price_data: dict, indicators: dict) -> dict | None:
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
- Tendance calculée : {indicators.get('trend', 'N/A')}"""

        try:
            response = self.model.generate_content(user_msg)
            raw = response.text.strip()
            raw = raw.replace("```json", "").replace("```", "").strip()
            result = json.loads(raw)
            result["duration_ms"] = int((time.time() - start) * 1000)
            return result
        except json.JSONDecodeError as e:
            log.error(f"AgentAnalyse JSON invalide pour {ticker}: {e}\nRaw: {raw}")
            return None
        except Exception as e:
            log.error(f"AgentAnalyse erreur pour {ticker}: {e}")
            return None
