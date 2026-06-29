"""
Price Collector — CoinGecko optimisé
- Une seule requête pour tous les prix (évite le rate limit)
- Requêtes historique espacées
"""

import logging
import requests
import pandas as pd
from datetime import datetime, timezone
import time

log = logging.getLogger(__name__)

COINGECKO_BASE = "https://api.coingecko.com/api/v3"

COINGECKO_IDS = {
    "BTC": "bitcoin",
    "ETH": "ethereum",
    "SOL": "solana",
    "BNB": "binancecoin",
    "XRP": "ripple",
}

# Inverse : id → ticker
ID_TO_TICKER = {v: k for k, v in COINGECKO_IDS.items()}


class PriceCollector:
    def __init__(self, tickers: list[str]):
        self.tickers = tickers

    def fetch_all_latest(self) -> dict[str, dict]:
        """
        Récupère tous les prix en UNE seule requête.
        Retourne un dict { "BTC": {...}, "ETH": {...}, ... }
        """
        ids = ",".join(COINGECKO_IDS[t] for t in self.tickers)
        try:
            r = requests.get(f"{COINGECKO_BASE}/coins/markets", params={
                "vs_currency":        "usd",
                "ids":                ids,
                "order":              "market_cap_desc",
                "sparkline":          "false",
                "price_change_percentage": "24h",
            }, timeout=15)
            r.raise_for_status()
            data = r.json()

            result = {}
            for coin in data:
                ticker = ID_TO_TICKER.get(coin["id"])
                if not ticker:
                    continue
                close      = float(coin["current_price"])
                change_pct = float(coin.get("price_change_percentage_24h") or 0)
                open_24h   = close / (1 + change_pct / 100) if change_pct != -100 else close

                result[ticker] = {
                    "open":       round(open_24h, 6),
                    "high":       round(float(coin.get("high_24h") or close), 6),
                    "low":        round(float(coin.get("low_24h") or close), 6),
                    "close":      round(close, 6),
                    "volume":     int(coin.get("total_volume") or 0),
                    "change_pct": round(change_pct, 4),
                }
            return result

        except Exception as e:
            log.error(f"fetch_all_latest: {e}")
            return {}

    def fetch_latest(self, ticker: str) -> dict | None:
        """Compatibilité avec l'interface existante."""
        all_prices = self.fetch_all_latest()
        return all_prices.get(ticker)

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
                    "High":   price * 1.005,
                    "Low":    price * 0.995,
                    "Close":  price,
                    "Volume": vol,
                })

            df = pd.DataFrame(rows).set_index("Date")
            return df if len(df) >= 26 else None

        except Exception as e:
            log.error(f"fetch_history({ticker}): {e}")
            return None
