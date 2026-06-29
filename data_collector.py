"""
LCDL — Data Collector Crypto
Récupère prix BTC/ETH/SOL/BNB/XRP + indicateurs + news
"""

import os
import time
import logging
from datetime import datetime, timezone
from supabase import create_client, Client
from dotenv import load_dotenv

from collectors.price_collector import PriceCollector
from collectors.news_collector  import NewsCollector
from collectors.indicators      import compute_indicators

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]

TICKERS = ["BTC", "ETH", "SOL", "BNB", "XRP"]


def run():
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    price_col = PriceCollector(tickers=TICKERS)
    news_col  = NewsCollector(tickers=TICKERS)

    log.info(f"Collecte crypto démarrée — {len(TICKERS)} tickers")

    for ticker in TICKERS:
        try:
            # 1. Prix actuel
            price_data = price_col.fetch_latest(ticker)
            if not price_data:
                log.warning(f"{ticker}: aucun prix récupéré")
                continue

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

            log.info(f"{ticker}: {price_data['close']} USDT ({price_data['change_pct']:+.2f}%)")

            # 2. Historique + indicateurs
            history = price_col.fetch_history(ticker, days=60)
            if history is not None and len(history) >= 26:
                indicators = compute_indicators(history)
                supabase.table("indicators").upsert({
                    "ticker":      ticker,
                    "rsi":         indicators["rsi"],
                    "macd":        indicators["macd"],
                    "macd_signal": indicators["macd_signal"],
                    "sma_20":      indicators["sma_20"],
                    "sma_50":      indicators["sma_50"],
                    "trend":       indicators["trend"],
                    "updated_at":  datetime.now(timezone.utc).isoformat(),
                }, on_conflict="ticker").execute()
                log.info(f"{ticker}: indicateurs calculés — RSI={indicators['rsi']}, trend={indicators['trend']}")
            else:
                log.warning(f"{ticker}: historique insuffisant pour les indicateurs")

        except Exception as e:
            log.error(f"{ticker}: {e}")

        time.sleep(0.5)  # Binance rate limit

    # 3. News crypto
    try:
        articles = news_col.fetch_all()
        if articles:
            supabase.table("news").upsert(articles, on_conflict="hash").execute()
            log.info(f"News: {len(articles)} articles insérés/mis à jour")
    except Exception as e:
        log.error(f"News: {e}")

    log.info("Collecte terminée ✓")


if __name__ == "__main__":
    run()
