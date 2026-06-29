"""
Price Collector — Alpha Vantage (gratuit, 25 req/jour)
Clé API gratuite sur : https://www.alphavantage.co/support/#api-key
"""

import os
import logging
import requests
import pandas as pd
from datetime import datetime, timezone

log = logging.getLogger(__name__)

AV_BASE = "https://www.alphavantage.co/query"
AV_KEY  = os.environ.get("ALPHAVANTAGE_KEY", "demo")


class PriceCollector:
    def __init__(self, tickers: list[str]):
        self.tickers = tickers

    def fetch_latest(self, ticker: str) -> dict | None:
        """Récupère le dernier prix via GLOBAL_QUOTE."""
        try:
            r = requests.get(AV_BASE, params={
                "function": "GLOBAL_QUOTE",
                "symbol":   ticker,
                "apikey":   AV_KEY,
            }, timeout=10)
            r.raise_for_status()
            data  = r.json()
            quote = data.get("Global Quote", {})

            if not quote or not quote.get("05. price"):
                log.warning(f"{ticker}: réponse vide Alpha Vantage")
                return None

            close      = round(float(quote["05. price"]), 4)
            open_      = round(float(quote["02. open"]), 4)
            high       = round(float(quote["03. high"]), 4)
            low        = round(float(quote["04. low"]), 4)
            volume     = int(quote["06. volume"])
            change_pct = round(float(quote["10. change percent"].replace("%", "")), 4)

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
        """Récupère l'historique journalier pour les indicateurs."""
        try:
            r = requests.get(AV_BASE, params={
                "function":   "TIME_SERIES_DAILY",
                "symbol":     ticker,
                "outputsize": "compact",  # 100 derniers jours
                "apikey":     AV_KEY,
            }, timeout=15)
            r.raise_for_status()
            data   = r.json()
            series = data.get("Time Series (Daily)", {})

            if not series:
                log.warning(f"{ticker}: historique vide")
                return None

            rows = []
            for date_str, vals in sorted(series.items())[-days:]:
                rows.append({
                    "Date":   datetime.strptime(date_str, "%Y-%m-%d"),
                    "Open":   float(vals["1. open"]),
                    "High":   float(vals["2. high"]),
                    "Low":    float(vals["3. low"]),
                    "Close":  float(vals["4. close"]),
                    "Volume": int(vals["5. volume"]),
                })

            df = pd.DataFrame(rows).set_index("Date")
            return df

        except Exception as e:
            log.error(f"fetch_history({ticker}): {e}")
            return None
