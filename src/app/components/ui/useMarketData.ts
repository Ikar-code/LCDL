// src/hooks/useMarketData.ts
// Remplace toutes les mock data par des données Supabase réelles

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Price {
  id: number;
  ticker: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change_pct: number;
  fetched_at: string;
}

export interface Indicator {
  ticker: string;
  rsi: number | null;
  macd: number | null;
  macd_signal: number | null;
  sma_20: number | null;
  sma_50: number | null;
  trend: "bullish" | "bearish" | "neutral";
  updated_at: string;
}

export interface NewsItem {
  id: number;
  ticker: string | null;
  title: string;
  summary: string;
  url: string;
  source: string;
  impact_score: number | null;
  sentiment: "positive" | "negative" | "neutral" | null;
  published_at: string;
}

export interface Portfolio {
  id: number;
  capital_usdt: number;
  total_value: number;
  performance: number;
  updated_at: string;
}

export interface Position {
  id: number;
  ticker: string;
  quantity: number;
  avg_price: number;
  current_price: number | null;
  pnl_value: number | null;
  pnl_pct: number | null;
  opened_at: string;
}

export interface Trade {
  id: number;
  ticker: string;
  action: "BUY" | "SELL" | "HOLD";
  quantity: number;
  price: number;
  amount_usdt: number;
  confidence: number | null;
  reason: string | null;
  executed_at: string;
}

export interface AgentLog {
  id: number;
  agent_name: string;
  ticker: string | null;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  duration_ms: number;
  created_at: string;
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useMarketData() {
  const [prices,     setPrices]     = useState<Price[]>([]);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [news,       setNews]       = useState<NewsItem[]>([]);
  const [portfolio,  setPortfolio]  = useState<Portfolio | null>(null);
  const [positions,  setPositions]  = useState<Position[]>([]);
  const [trades,     setTrades]     = useState<Trade[]>([]);
  const [agentLogs,  setAgentLogs]  = useState<AgentLog[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [
        pricesRes,
        indicatorsRes,
        newsRes,
        portfolioRes,
        positionsRes,
        tradesRes,
        logsRes,
      ] = await Promise.all([
        // Dernier prix par ticker
        supabase
          .from("prices")
          .select("*")
          .order("fetched_at", { ascending: false })
          .limit(50),

        supabase.from("indicators").select("*"),

        // 30 dernières news
        supabase
          .from("news")
          .select("*")
          .order("fetched_at", { ascending: false })
          .limit(30),

        supabase.from("portfolio").select("*").order("id").limit(1).single(),

        supabase.from("positions").select("*").order("opened_at", { ascending: false }),

        // 20 derniers trades
        supabase
          .from("trades")
          .select("*")
          .order("executed_at", { ascending: false })
          .limit(20),

        // Logs des 4 derniers agents
        supabase
          .from("agent_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(40),
      ]);

      // Dédupliquer les prix — garder le plus récent par ticker
      const latestByTicker = new Map<string, Price>();
      for (const p of (pricesRes.data ?? []) as Price[]) {
        if (!latestByTicker.has(p.ticker)) latestByTicker.set(p.ticker, p);
      }

      setPrices(Array.from(latestByTicker.values()));
      setIndicators((indicatorsRes.data ?? []) as Indicator[]);
      setNews((newsRes.data ?? []) as NewsItem[]);
      setPortfolio((portfolioRes.data as Portfolio) ?? null);
      setPositions((positionsRes.data ?? []) as Position[]);
      setTrades((tradesRes.data ?? []) as Trade[]);
      setAgentLogs((logsRes.data ?? []) as AgentLog[]);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("useMarketData fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    // Rafraîchit toutes les 2 minutes
    const interval = setInterval(fetchAll, 30 * 1000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // Helpers dérivés
  const getPriceFor   = (ticker: string) => prices.find((p) => p.ticker === ticker) ?? null;
  const getIndicator  = (ticker: string) => indicators.find((i) => i.ticker === ticker) ?? null;
  const getNewsFor    = (ticker: string) => news.filter((n) => n.ticker === ticker);
  const getLastDecision = (ticker: string) =>
    agentLogs.find((l) => l.agent_name === "decision" && l.ticker === ticker)?.output_data ?? null;

  // Historique portefeuille depuis les trades (valeur cumulée)
  const portfolioHistory = buildPortfolioHistory(trades, portfolio);

  return {
    prices,
    indicators,
    news,
    portfolio,
    positions,
    trades,
    agentLogs,
    loading,
    lastUpdate,
    refresh: fetchAll,
    // Helpers
    getPriceFor,
    getIndicator,
    getNewsFor,
    getLastDecision,
    portfolioHistory,
  };
}

// ─── Utilitaire : reconstruire la courbe du portefeuille depuis les trades ───

function buildPortfolioHistory(
  trades: Trade[],
  portfolio: Portfolio | null
): { date: string; value: number }[] {
  if (!portfolio || trades.length === 0) return [];

  // Grouper les trades par jour
  const byDay = new Map<string, number>();
  let runningValue = portfolio.capital_usdt;

  // Trier du plus ancien au plus récent
  const sorted = [...trades].sort(
    (a, b) => new Date(a.executed_at).getTime() - new Date(b.executed_at).getTime()
  );

  for (const trade of sorted) {
    const day = new Date(trade.executed_at).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    });
    if (trade.action === "BUY")  runningValue -= trade.amount_usdt;
    if (trade.action === "SELL") runningValue += trade.amount_usdt;
    byDay.set(day, runningValue);
  }

  // Ajouter la valeur actuelle
  const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  byDay.set(today, portfolio.total_value ?? runningValue);

  return Array.from(byDay.entries()).map(([date, value]) => ({ date, value }));
}
