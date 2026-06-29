"""
LCDL — Data Collector
Récupère les prix, calcule les indicateurs techniques, scrape les news.
Tourne via GitHub Actions (cron) ou manuellement.
"""

import os
import time
import logging
from datetime import datetime, timezone
from supabase import create_client, Client
from dotenv import load_dotenv

from collectors.price_collector import PriceCollector
from collectors.news_collector import NewsCollector
from collectors.indicators import compute_indicators

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

# ── Config ──────────────────────────────────────────────────────────────────

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]

TICKERS = ["AAPL", "TSLA", "MSFT", "GOOGL", "NVDA"]

# ── Main ─────────────────────────────────────────────────────────────────────

def run():
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    price_col = PriceCollector(tickers=TICKERS)
    news_col  = NewsCollector(tickers=TICKERS)

    log.info(f"Collecte démarrée — {len(TICKERS)} tickers")

    # 1. Prix + indicateurs
    for ticker in TICKERS:
        try:
            price_data = price_col.fetch_latest(ticker)
            if not price_data:
                log.warning(f"{ticker}: aucun prix récupéré")
                continue

            # Stocker le prix brut
            supabase.table("prices").insert({
                "ticker":     ticker,
                "open":       price_data["open"],
                "high":       price_data["high"],
                "low":        price_data["low"],
                "close":      price_data["close"],
                "volume":     price_data["volume"],
                "change_pct": price_data["change_pct"],
                "fetched_at": datetime.now(timezone.utc).isoformat(),
            }).execute()

            # Calculer et stocker les indicateurs
            history = price_col.fetch_history(ticker, days=60)
            if history:
                indicators = compute_indicators(history)
                supabase.table("indicators").upsert({
                    "ticker":     ticker,
                    "rsi":        indicators["rsi"],
                    "macd":       indicators["macd"],
                    "macd_signal":indicators["macd_signal"],
                    "sma_20":     indicators["sma_20"],
                    "sma_50":     indicators["sma_50"],
                    "trend":      indicators["trend"],
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }, on_conflict="ticker").execute()

            log.info(f"{ticker}: prix={price_data['close']} ({price_data['change_pct']:+.2f}%)")

        except Exception as e:
            log.error(f"{ticker} prix — {e}")

        time.sleep(1)  # Éviter rate limit API

    # 2. News
    try:
        articles = news_col.fetch_all()
        if articles:
            supabase.table("news").upsert(articles, on_conflict="hash").execute()
            log.info(f"News: {len(articles)} articles insérés")
    except Exception as e:
        log.error(f"News — {e}")

    log.info("Collecte terminée ✓")


if __name__ == "__main__":
    run()
