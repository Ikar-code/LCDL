"""
Price Collector — Binance API publique (sans clé API)
Récupère les prix crypto en temps réel + historique pour les indicateurs
"""

import logging
import requests
import pandas as pd
from datetime import datetime, timezone

log = logging.getLogger(__name__)

BINANCE_BASE = "https://api.binance.com/api/v3"

# Paires crypto à suivre (USDT)
SYMBOLS = {
    "BTC":  "BTCUSDT",
    "ETH":  "ETHUSDT",
    "SOL":  "SOLUSDT",
    "BNB":  "BNBUSDT",
    "XRP":  "XRPUSDT",
}


class PriceCollector:
    def __init__(self, tickers: list[str]):
        self.tickers = tickers

    def fetch_latest(self, ticker: str) -> dict | None:
        """Récupère le prix actuel + variation 24h via Binance ticker."""
        symbol = SYMBOLS.get(ticker)
        if not symbol:
            log.error(f"Symbole inconnu : {ticker}")
            return None

        try:
            r = requests.get(f"{BINANCE_BASE}/ticker/24hr", params={"symbol": symbol}, timeout=10)
            r.raise_for_status()
            d = r.json()

            close      = round(float(d["lastPrice"]), 6)
            open_      = round(float(d["openPrice"]), 6)
            high       = round(float(d["highPrice"]), 6)
            low        = round(float(d["lowPrice"]), 6)
            volume     = round(float(d["volume"]), 4)
            change_pct = round(float(d["priceChangePercent"]), 4)

            return {
                "open":       open_,
                "high":       high,
                "low":        low,
                "close":      close,
                "volume":     volume,
                "change_pct": change_pct,
            }

        except Exception as e:
            log.error(f"fetch_latest({ticker}): {e}")
            return None

    def fetch_history(self, ticker: str, days: int = 60) -> pd.DataFrame | None:
        """Récupère l'historique journalier pour calculer les indicateurs."""
        symbol = SYMBOLS.get(ticker)
        if not symbol:
            return None

        try:
            r = requests.get(f"{BINANCE_BASE}/klines", params={
                "symbol":   symbol,
                "interval": "1d",
                "limit":    days,
            }, timeout=15)
            r.raise_for_status()
            klines = r.json()

            rows = []
            for k in klines:
                rows.append({
                    "Date":   datetime.fromtimestamp(k[0] / 1000, tz=timezone.utc),
                    "Open":   float(k[1]),
                    "High":   float(k[2]),
                    "Low":    float(k[3]),
                    "Close":  float(k[4]),
                    "Volume": float(k[5]),
                })

            df = pd.DataFrame(rows).set_index("Date")
            return df

        except Exception as e:
            log.error(f"fetch_history({ticker}): {e}")
            return None
