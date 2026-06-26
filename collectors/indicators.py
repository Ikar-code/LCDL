"""
Indicateurs techniques — RSI, MACD, SMA
Calculés à partir de l'historique journalier (pandas DataFrame).
"""

import pandas as pd
import logging

log = logging.getLogger(__name__)


def compute_indicators(hist: pd.DataFrame) -> dict:
    """
    Reçoit un DataFrame yfinance (colonnes: Open, High, Low, Close, Volume)
    Retourne un dict avec tous les indicateurs calculés.
    """
    close = hist["Close"].dropna()

    return {
        "rsi":         _rsi(close, period=14),
        "macd":        _macd(close)["macd"],
        "macd_signal": _macd(close)["signal"],
        "sma_20":      _sma(close, 20),
        "sma_50":      _sma(close, 50),
        "trend":       _trend(close),
    }


def _rsi(close: pd.Series, period: int = 14) -> float | None:
    if len(close) < period + 1:
        return None
    delta = close.diff()
    gain  = delta.clip(lower=0).rolling(period).mean()
    loss  = (-delta.clip(upper=0)).rolling(period).mean()
    rs    = gain / loss
    rsi   = 100 - (100 / (1 + rs))
    val   = rsi.iloc[-1]
    return round(float(val), 2) if not pd.isna(val) else None


def _macd(close: pd.Series) -> dict:
    if len(close) < 26:
        return {"macd": None, "signal": None}
    ema12  = close.ewm(span=12, adjust=False).mean()
    ema26  = close.ewm(span=26, adjust=False).mean()
    macd   = ema12 - ema26
    signal = macd.ewm(span=9, adjust=False).mean()
    return {
        "macd":   round(float(macd.iloc[-1]), 4),
        "signal": round(float(signal.iloc[-1]), 4),
    }


def _sma(close: pd.Series, period: int) -> float | None:
    if len(close) < period:
        return None
    val = close.rolling(period).mean().iloc[-1]
    return round(float(val), 4) if not pd.isna(val) else None


def _trend(close: pd.Series) -> str:
    """
    Tendance simple sur 10 jours :
    - 'bullish'  : prix > SMA20 et en hausse
    - 'bearish'  : prix < SMA20 et en baisse
    - 'neutral'  : sinon
    """
    if len(close) < 20:
        return "neutral"
    sma20     = float(close.rolling(20).mean().iloc[-1])
    last      = float(close.iloc[-1])
    prev      = float(close.iloc[-2])
    going_up  = last > prev

    if last > sma20 and going_up:
        return "bullish"
    elif last < sma20 and not going_up:
        return "bearish"
    return "neutral"
