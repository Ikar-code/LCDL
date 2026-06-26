"""
Price Collector — utilise yfinance (Yahoo Finance, gratuit, sans clé API)
"""

import logging
import yfinance as yf
import pandas as pd

log = logging.getLogger(__name__)


class PriceCollector:
    def __init__(self, tickers: list[str]):
        self.tickers = tickers

    def fetch_latest(self, ticker: str) -> dict | None:
        """Récupère le dernier prix + variation du jour."""
        try:
            stock = yf.Ticker(ticker)
            info  = stock.fast_info

            close       = round(float(info.last_price), 4)
            prev_close  = round(float(info.previous_close), 4)
            change_pct  = round(((close - prev_close) / prev_close) * 100, 4)

            # Dernière bougie du jour
            hist = stock.history(period="1d", interval="1m")
            if hist.empty:
                return None

            last = hist.iloc[-1]
            return {
                "open":       round(float(last["Open"]), 4),
                "high":       round(float(last["High"]), 4),
                "low":        round(float(last["Low"]),  4),
                "close":      close,
                "volume":     int(last["Volume"]),
                "change_pct": change_pct,
            }

        except Exception as e:
            log.error(f"fetch_latest({ticker}): {e}")
            return None

    def fetch_history(self, ticker: str, days: int = 60) -> pd.DataFrame | None:
        """Récupère l'historique journalier pour calculer les indicateurs."""
        try:
            stock = yf.Ticker(ticker)
            hist  = stock.history(period=f"{days}d", interval="1d")
            if hist.empty:
                return None
            return hist
        except Exception as e:
            log.error(f"fetch_history({ticker}): {e}")
            return None
