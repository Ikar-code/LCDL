"""
Agent News — Gemini
"""
import os
import json
import time
import logging
import google.generativeai as genai

log = logging.getLogger(__name__)

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

SYSTEM_PROMPT = """Tu es un agent spécialisé dans l'analyse de sentiment des actualités financières.

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après, sans balises markdown :
{
  "ticker": "AAPL",
  "sentiment": "positive",
  "impact_score": 6,
  "key_news": ["résumé news 1", "résumé news 2"],
  "summary": "résumé en français"
}

sentiment : positive, negative, ou neutral
impact_score : 0 à 10"""


class AgentNews:
    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction=SYSTEM_PROMPT,
        )

    def run(self, ticker: str, articles: list[dict]) -> dict | None:
        if not articles:
            return {
                "ticker": ticker, "sentiment": "neutral", "impact_score": 0,
                "key_news": [], "summary": "Aucune actualité récente.", "duration_ms": 0,
            }

        start = time.time()
        news_text = "\n".join([
            f"- [{a.get('source','?')}] {a.get('title','')} : {a.get('summary','')[:150]}"
            for a in articles[:10]
        ])

        try:
            response = self.model.generate_content(
                f"Analyse les actualités pour {ticker} :\n\n{news_text}"
            )
            raw = response.text.strip().replace("```json", "").replace("```", "").strip()
            result = json.loads(raw)
            result["duration_ms"] = int((time.time() - start) * 1000)
            return result
        except json.JSONDecodeError as e:
            log.error(f"AgentNews JSON invalide pour {ticker}: {e}")
            return None
        except Exception as e:
            log.error(f"AgentNews erreur pour {ticker}: {e}")
            return None
