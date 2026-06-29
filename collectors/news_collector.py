"""
News Collector crypto — RSS spécialisés crypto, sans clé API
"""

import logging
import hashlib
from datetime import datetime, timezone
import feedparser

log = logging.getLogger(__name__)

# Flux RSS crypto gratuits
RSS_FEEDS = [
    "https://cointelegraph.com/rss",
    "https://coindesk.com/arc/outboundfeeds/rss/",
    "https://decrypt.co/feed",
    "https://www.theblock.co/rss.xml",
    "https://cryptonews.com/news/feed/",
]

# Mots clés par ticker pour filtrer les articles pertinents
TICKER_KEYWORDS = {
    "BTC":  ["bitcoin", "btc"],
    "ETH":  ["ethereum", "eth", "ether"],
    "SOL":  ["solana", "sol"],
    "BNB":  ["binance", "bnb"],
    "XRP":  ["xrp", "ripple"],
}


class NewsCollector:
    def __init__(self, tickers: list[str]):
        self.tickers = tickers

    def fetch_all(self) -> list[dict]:
        """Récupère et trie les news par ticker."""
        all_articles = []

        for url in RSS_FEEDS:
            articles = self._parse_feed(url)
            all_articles.extend(articles)

        # Déduplication par hash
        seen = set()
        unique = []
        for a in all_articles:
            if a["hash"] not in seen:
                seen.add(a["hash"])
                unique.append(a)

        # Taguer chaque article avec le ticker concerné
        tagged = []
        for article in unique:
            text = (article["title"] + " " + article["summary"]).lower()
            matched = False
            for ticker, keywords in TICKER_KEYWORDS.items():
                if any(kw in text for kw in keywords):
                    tagged.append({**article, "ticker": ticker})
                    matched = True
            if not matched:
                # News générale marché crypto
                tagged.append({**article, "ticker": None})

        return tagged

    def _parse_feed(self, url: str) -> list[dict]:
        results = []
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:15]:
                title   = entry.get("title", "").strip()
                summary = entry.get("summary", "").strip()
                link    = entry.get("link", "")

                if not title:
                    continue

                h = hashlib.md5(title.encode()).hexdigest()

                published = datetime.now(timezone.utc).isoformat()
                if hasattr(entry, "published_parsed") and entry.published_parsed:
                    try:
                        published = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc).isoformat()
                    except Exception:
                        pass

                results.append({
                    "ticker":       None,
                    "title":        title,
                    "summary":      summary[:500],
                    "url":          link,
                    "source":       feed.feed.get("title", "unknown"),
                    "hash":         h,
                    "impact_score": None,
                    "sentiment":    None,
                    "published_at": published,
                    "fetched_at":   datetime.now(timezone.utc).isoformat(),
                })

        except Exception as e:
            log.error(f"_parse_feed({url}): {e}")

        return results
