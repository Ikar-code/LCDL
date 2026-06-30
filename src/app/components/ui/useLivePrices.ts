// Hook qui récupère les prix crypto en direct depuis CoinGecko
// S'actualise toutes les 30 secondes côté frontend

import { useEffect, useState, useCallback } from "react";

const COINGECKO_IDS = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  BNB: "binancecoin",
  XRP: "ripple",
};

export interface LivePrice {
  ticker: string;
  close: number;
  change_pct: number;
  high: number;
  low: number;
  fetched_at: string;
}

export function useLivePrices() {
  const [prices, setPrices]     = useState<LivePrice[]>([]);
  const [loading, setLoading]   = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      const ids = Object.values(COINGECKO_IDS).join(",");
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`
      );
      if (!res.ok) return;
      const data = await res.json();

      const now = new Date().toISOString();
      const live: LivePrice[] = data.map((coin: Record<string, unknown>) => {
        const ticker = Object.entries(COINGECKO_IDS).find(([, id]) => id === coin.id)?.[0] ?? "";
        return {
          ticker,
          close:      Number(coin.current_price),
          change_pct: Number(coin.price_change_percentage_24h ?? 0),
          high:       Number(coin.high_24h),
          low:        Number(coin.low_24h),
          fetched_at: now,
        };
      }).filter((p: LivePrice) => p.ticker);

      setPrices(live);
      setLastUpdate(new Date());
    } catch (e) {
      console.error("useLivePrices:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30_000); // toutes les 30s
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return { prices, loading, lastUpdate, refresh: fetchPrices };
}
