"""
LCDL — Data Collector Crypto optimisé
1 requête pour tous les prix + historiques espacés de 20s
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

    # 1. Tous les prix en une seule requête
    all_prices = price_col.fetch_all_latest()
    log.info(f"Prix récupérés : {list(all_prices.keys())}")

    for ticker, price_data in all_prices.items():
        try:
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
        except Exception as e:
            log.error(f"{ticker} insert prix: {e}")

    # 2. Historique + indicateurs — espacé de 20s pour respecter le rate limit
    for ticker in TICKERS:
        try:
            history = price_col.fetch_history(ticker, days=60)
            if history is not None:
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
                log.info(f"{ticker}: RSI={indicators['rsi']}, trend={indicators['trend']}")
            else:
                log.warning(f"{ticker}: historique insuffisant")
        except Exception as e:
            log.error(f"{ticker} historique: {e}")

        time.sleep(20)  # 20s entre chaque historique = ~3 req/min

    # 3. News
    try:
        articles = news_col.fetch_all()
        if articles:
            seen = set()
            unique = []
            for a in articles:
                if a["hash"] not in seen:
                    seen.add(a["hash"])
                    unique.append(a)

            for i in range(0, len(unique), 20):
                try:
                    supabase.table("news").upsert(unique[i:i+20], on_conflict="hash").execute()
                except Exception as e:
                    log.warning(f"Batch news {i}: {e}")

            log.info(f"News: {len(unique)} articles")
    except Exception as e:
        log.error(f"News: {e}")

    log.info("Collecte terminée ✓")


if __name__ == "__main__":
    run()
