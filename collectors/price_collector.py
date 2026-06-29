"""
Price Collector — CoinGecko API publique (sans clé, gratuit)
Pas de restriction géographique contrairement à Binance
"""

import logging
import requests
import pandas as pd
from datetime import datetime, timezone
import time

log = logging.getLogger(__name__)

COINGECKO_BASE = "https://api.coingecko.com/api/v3"

# Mapping ticker → ID CoinGecko
COINGECKO_IDS = {
    "BTC": "bitcoin",
    "ETH": "ethereum",
    "SOL": "solana",
    "BNB": "binancecoin",
    "XRP": "ripple",
}


class PriceCollector:
    def __init__(self, tickers: list[str]):
        self.tickers = tickers

    def fetch_latest(self, ticker: str) -> dict | None:
        cg_id = COINGECKO_IDS.get(ticker)
        if not cg_id:
            log.error(f"ID CoinGecko inconnu : {ticker}")
            return None

        try:
            r = requests.get(f"{COINGECKO_BASE}/coins/{cg_id}", params={
                "localization": "false",
                "tickers":      "false",
                "community_data": "false",
                "developer_data": "false",
            }, timeout=15)
            r.raise_for_status()
            d = r.json()

            md = d["market_data"]
            close      = float(md["current_price"]["usd"])
            open_24h   = float(md["price_change_24h"]) + close  # approximation open
            high       = float(md["high_24h"]["usd"])
            low        = float(md["low_24h"]["usd"])
            volume     = float(md["total_volume"]["usd"])
            change_pct = float(md["price_change_percentage_24h"])

            return {
                "open":       round(open_24h, 6),
                "high":       round(high, 6),
                "low":        round(low, 6),
                "close":      round(close, 6),
                "volume":     int(volume),
                "change_pct": round(change_pct, 4),
            }

        except Exception as e:
            log.error(f"fetch_latest({ticker}): {e}")
            return None

    def fetch_history(self, ticker: str, days: int = 60) -> pd.DataFrame | None:
        cg_id = COINGECKO_IDS.get(ticker)
        if not cg_id:
            return None

        try:
            r = requests.get(f"{COINGECKO_BASE}/coins/{cg_id}/market_chart", params={
                "vs_currency": "usd",
                "days":        days,
                "interval":    "daily",
            }, timeout=15)
            r.raise_for_status()
            data = r.json()

            prices  = data.get("prices", [])
            volumes = data.get("total_volumes", [])

            rows = []
            for i, (ts, price) in enumerate(prices):
                vol = volumes[i][1] if i < len(volumes) else 0
                rows.append({
                    "Date":   datetime.fromtimestamp(ts / 1000, tz=timezone.utc),
                    "Open":   price,
                    "High":   price * 1.005,  # approximation
                    "Low":    price * 0.995,
                    "Close":  price,
                    "Volume": vol,
                })

            df = pd.DataFrame(rows).set_index("Date")
            return df if len(df) >= 26 else None

        except Exception as e:
            log.error(f"fetch_history({ticker}): {e}")
            return None
