"""
News Collector — scrape des flux RSS financiers gratuits.
Pas de clé API requise.
"""

import logging
import hashlib
from datetime import datetime, timezone
import feedparser

log = logging.getLogger(__name__)

# Flux RSS financiers gratuits
RSS_FEEDS = [
    # Yahoo Finance (par ticker — insérer le ticker dans l'URL)
    "https://finance.yahoo.com/rss/headline?s={ticker}",
    # Seeking Alpha (public)
    "https://seekingalpha.com/api/sa/combined/{ticker}.xml",
]

# Flux généraux marchés (pas liés à un ticker spécifique)
RSS_GENERAL = [
    "https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC&region=US&lang=en-US",
    "https://www.cnbc.com/id/100003114/device/rss/rss.html",  # CNBC Markets
    "https://feeds.bloomberg.com/markets/news.rss",            # Bloomberg Markets
]


class NewsCollector:
    def __init__(self, tickers: list[str]):
        self.tickers = tickers

    def fetch_all(self) -> list[dict]:
        """Récupère les news pour tous les tickers + news générales."""
        articles = []

        # News par ticker
        for ticker in self.tickers:
            for feed_url in RSS_FEEDS:
                url = feed_url.format(ticker=ticker)
                articles.extend(self._parse_feed(url, ticker=ticker))

        # News générales marché
        for url in RSS_GENERAL:
            articles.extend(self._parse_feed(url, ticker=None))

        # Déduplication par hash du titre
        seen = set()
        unique = []
        for a in articles:
            if a["hash"] not in seen:
                seen.add(a["hash"])
                unique.append(a)

        return unique

    def _parse_feed(self, url: str, ticker: str | None) -> list[dict]:
        results = []
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:10]:  # Max 10 articles par feed
                title   = entry.get("title", "").strip()
                summary = entry.get("summary", "").strip()
                link    = entry.get("link", "")

                if not title:
                    continue

                # Hash pour déduplication
                h = hashlib.md5(title.encode()).hexdigest()

                # Date de publication
                published = datetime.now(timezone.utc).isoformat()
                if hasattr(entry, "published_parsed") and entry.published_parsed:
                    try:
                        published = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc).isoformat()
                    except Exception:
                        pass

                results.append({
                    "ticker":      ticker,        # None = news générale marché
                    "title":       title,
                    "summary":     summary[:500], # Limiter la taille
                    "url":         link,
                    "source":      feed.feed.get("title", "unknown"),
                    "hash":        h,
                    "impact_score": None,          # Sera rempli par l'agent IA
                    "sentiment":   None,           # Sera rempli par l'agent IA
                    "published_at": published,
                    "fetched_at":  datetime.now(timezone.utc).isoformat(),
                })

        except Exception as e:
            log.error(f"_parse_feed({url}): {e}")

        return results
