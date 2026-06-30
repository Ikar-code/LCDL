// Hook — historique prix crypto depuis CoinGecko (1j, 7j, 30j)

import { useEffect, useState, useCallback } from "react";

const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  BNB: "binancecoin",
  XRP: "ripple",
};

export interface ChartPoint {
  time: string;
  price: number;
}

export type ChartRange = "1" | "7" | "30";

export function useCryptoChart(ticker: string, days: ChartRange = "7") {
  const [data,    setData]    = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    const id = COINGECKO_IDS[ticker];
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await window.fetch(
        `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const prices: [number, number][] = json.prices ?? [];

      const fmt = days === "1"
        ? (ts: number) => new Date(ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        : (ts: number) => new Date(ts).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

      setData(prices.map(([ts, price]) => ({ time: fmt(ts), price: Math.round(price * 100) / 100 })));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [ticker, days]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refresh: fetch };
}
