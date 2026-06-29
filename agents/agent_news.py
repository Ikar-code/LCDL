"""
Agent News
Reçoit les articles RSS récents d'un ticker
Retourne un score de sentiment et l'impact estimé sur le prix
"""

import os
import json
import time
import logging
from groq import Groq

log = logging.getLogger(__name__)

SYSTEM_PROMPT = """Tu es un agent spécialisé dans l'analyse de sentiment des actualités financières.
Tu reçois des titres d'articles récents concernant une action et tu dois évaluer leur impact.

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après, avec exactement cette structure :
{
  "ticker": "AAPL",
  "sentiment": "positive" | "negative" | "neutral",
  "impact_score": 0-10,
  "key_news": ["titre résumé 1", "titre résumé 2"],
  "summary": "résumé de l'actualité en français"
}

Règles :
- impact_score : 0=aucun impact, 10=impact majeur sur le prix
- key_news : les 1-3 articles les plus importants, résumés en 5-10 mots
- summary : 1-2 phrases en français expliquant le contexte news
- Sois objectif et factuel, pas d'exagération
"""


class AgentNews:
    def __init__(self):
        self.client = Groq(api_key=os.environ["GROQ_API_KEY"])
        self.model  = "qwen/qwen3-32b"

    def run(self, ticker: str, articles: list[dict]) -> dict | None:
        """
        articles : liste de { title, summary, source, published_at }
        """
        if not articles:
            return {
                "ticker":       ticker,
                "sentiment":    "neutral",
                "impact_score": 0,
                "key_news":     [],
                "summary":      "Aucune actualité récente trouvée.",
                "duration_ms":  0,
            }

        start = time.time()

        # Construire le contexte news (max 10 articles)
        news_text = "\n".join([
            f"- [{a.get('source', '?')}] {a.get('title', '')} : {a.get('summary', '')[:150]}"
            for a in articles[:10]
        ])

        user_msg = f"""Analyse les actualités récentes pour l'action {ticker} :

{news_text}

Donne ton analyse de sentiment et d'impact."""

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
            if "<think>" in raw:
                raw = raw.split("</think>")[-1].strip()

            result = json.loads(raw)
            result["duration_ms"] = int((time.time() - start) * 1000)
            return result

        except json.JSONDecodeError as e:
            log.error(f"AgentNews JSON invalide pour {ticker}: {e}\nRaw: {raw}")
            return None
        except Exception as e:
            log.error(f"AgentNews erreur pour {ticker}: {e}")
            return None
