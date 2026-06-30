// Hook — alertes temps réel sur les positions en danger

import { useEffect, useState } from "react";
import type { Position } from "./useMarketData";
import type { LivePrice } from "./useLivePrices";

export interface Alert {
  id:        string;
  ticker:    string;
  type:      "danger" | "warning" | "info";
  message:   string;
  pnl_pct:   number;
  timestamp: Date;
}

const DANGER_THRESHOLD  = -5;   // Rouge : perte > 5%
const WARNING_THRESHOLD = -2;   // Orange : perte > 2%
const PROFIT_THRESHOLD  = 8;    // Info : gain > 8%

export function useAlerts(positions: Position[], prices: LivePrice[]): Alert[] {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (!positions.length || !prices.length) return;

    const newAlerts: Alert[] = [];

    for (const pos of positions) {
      const live = prices.find(p => p.ticker === pos.ticker);
      if (!live) continue;

      const avgPrice = Number(pos.avg_price);
      const qty      = Number(pos.quantity);
      const current  = live.close;
      const pnl_pct  = ((current - avgPrice) / avgPrice) * 100;
      const pnl_usd  = (current - avgPrice) * qty;

      if (pnl_pct <= DANGER_THRESHOLD) {
        newAlerts.push({
          id:        `${pos.ticker}-danger`,
          ticker:    pos.ticker,
          type:      "danger",
          message:   `⚠️ ${pos.ticker} en forte baisse — stop-loss proche (${pnl_pct.toFixed(2)}%, ${pnl_usd.toFixed(4)}$)`,
          pnl_pct,
          timestamp: new Date(),
        });
      } else if (pnl_pct <= WARNING_THRESHOLD) {
        newAlerts.push({
          id:        `${pos.ticker}-warning`,
          ticker:    pos.ticker,
          type:      "warning",
          message:   `📉 ${pos.ticker} en baisse (${pnl_pct.toFixed(2)}%, ${pnl_usd.toFixed(4)}$)`,
          pnl_pct,
          timestamp: new Date(),
        });
      } else if (pnl_pct >= PROFIT_THRESHOLD) {
        newAlerts.push({
          id:        `${pos.ticker}-profit`,
          ticker:    pos.ticker,
          type:      "info",
          message:   `📈 ${pos.ticker} en forte hausse — prise de bénéfice possible (${pnl_pct.toFixed(2)}%, +${pnl_usd.toFixed(4)}$)`,
          pnl_pct,
          timestamp: new Date(),
        });
      }
    }

    setAlerts(newAlerts);
  }, [positions, prices]);

  return alerts;
}
