// src/App.tsx — LCDL connecté à Supabase + prix live CoinGecko

import { useState } from "react";
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  LayoutDashboard, Brain, TrendingUp, Shield, Bot,
  ChevronRight, Activity, Database, Target, Eye, RefreshCw,
} from "lucide-react";
import { useMarketData } from "./components/ui/useMarketData";
import { useLivePrices } from "./components/ui/useLivePrices";

const VIOLET = "#7c5df2";
const GOLD   = "#c9a227";
const GREEN  = "#22c55e";
const RED    = "#f43f5e";
const CYAN   = "#22d3ee";

// ─── Primitives ───────────────────────────────────────────────────────────────

function Chip({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-mono font-semibold tracking-wider uppercase"
      style={{ background: `${color}18`, color, border: `1px solid ${color}33` }}>
      {children}
    </span>
  );
}

function DecisionBadge({ decision }: { decision: string }) {
  const label = decision === "BUY" ? "ACHETER" : decision === "SELL" ? "VENDRE" : "ATTENDRE";
  const color = decision === "BUY" ? GREEN : decision === "SELL" ? RED : GOLD;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-[11px] font-mono font-bold tracking-[0.12em]"
      style={{ background: `${color}15`, color, border: `1px solid ${color}44` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
      {label}
    </span>
  );
}

function ConfBar({ value, color }: { value: number; color?: string }) {
  const c = color ?? (value >= 80 ? GREEN : value >= 60 ? GOLD : RED);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-[3px] rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: c }} />
      </div>
      <span className="text-[11px] font-mono tabular-nums" style={{ color: c }}>{value}%</span>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-[#0d0f1a] border border-white/5 rounded-sm p-4 flex flex-col gap-1.5">
      <span className="text-[9px] font-mono text-white/25 tracking-[0.15em] uppercase">{label}</span>
      <span className="text-2xl font-semibold tracking-tight leading-none"
        style={{ fontFamily: "'Outfit', sans-serif", color: color ?? "white" }}>{value}</span>
      {sub && <span className="text-[10px] font-mono text-white/30">{sub}</span>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-[9px] font-mono text-white/25 tracking-[0.18em] uppercase mb-3">{children}</div>;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Eye size={28} className="mb-3" style={{ color: "rgba(255,255,255,0.08)" }} />
      <div className="text-[11px] font-mono text-white/20">{message}</div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard() {
  const { portfolio, positions, trades, portfolioHistory, loading } = useMarketData();
  const { prices } = useLivePrices();

  const totalPnl = positions.reduce((acc, p) => acc + (p.pnl_value ?? 0), 0);
  const todayTrades = trades.filter(t =>
    new Date(t.executed_at).toDateString() === new Date().toDateString()
  );

  if (loading) return <div className="text-[11px] font-mono text-white/20 p-8">Chargement des données…</div>;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Capital total" value={`$${(portfolio?.total_value ?? 0).toLocaleString("fr-FR")}`} sub="Portefeuille virtuel" />
        <StatCard label="Performance globale"
          value={`${(portfolio?.performance ?? 0) >= 0 ? "+" : ""}${(portfolio?.performance ?? 0).toFixed(2)}%`}
          sub={`${totalPnl >= 0 ? "↑" : "↓"} ${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`}
          color={(portfolio?.performance ?? 0) >= 0 ? GREEN : RED} />
        <StatCard label="Positions ouvertes" value={`${positions.length}`}
          sub={`${positions.length} actif${positions.length > 1 ? "s" : ""}`} />
        <StatCard label="Trades aujourd'hui" value={`${todayTrades.length}`}
          sub="Décisions IA exécutées" color={GOLD} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Courbe portefeuille */}
        <div className="lg:col-span-2 bg-[#0d0f1a] border border-white/5 rounded-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <SectionTitle>Évolution du portefeuille</SectionTitle>
              <div className="text-[11px] text-white/30">Basé sur les trades IA</div>
            </div>
            <span className="text-sm font-mono font-bold"
              style={{ color: (portfolio?.performance ?? 0) >= 0 ? GREEN : RED }}>
              {(portfolio?.performance ?? 0) >= 0 ? "+" : ""}{(portfolio?.performance ?? 0).toFixed(2)}%
            </span>
          </div>
          {portfolioHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={portfolioHistory}>
                <defs>
                  <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={VIOLET} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={VIOLET} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `$${v.toFixed(0)}`} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke={VIOLET} strokeWidth={2} fill="url(#pg)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Aucun trade encore exécuté — lancez l'orchestrateur" />
          )}
        </div>

        {/* Prix en direct CoinGecko */}
        <div className="bg-[#0d0f1a] border border-white/5 rounded-sm p-4">
          <SectionTitle>Prix en direct</SectionTitle>
          <div className="flex flex-col divide-y divide-white/[0.04]">
            {prices.length === 0 ? (
              <EmptyState message="Chargement des prix…" />
            ) : (
              prices.map((p) => (
                <div key={p.ticker} className="flex items-center justify-between py-2.5">
                  <span className="text-[11px] font-mono text-white/40">{p.ticker}</span>
                  <div className="text-right">
                    <div className="text-[11px] font-mono text-white">${p.close.toFixed(2)}</div>
                    <div className="text-[10px] font-mono" style={{ color: p.change_pct >= 0 ? GREEN : RED }}>
                      {p.change_pct >= 0 ? "+" : ""}{p.change_pct.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Positions */}
      <div className="bg-[#0d0f1a] border border-white/5 rounded-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
          <SectionTitle>Positions ouvertes</SectionTitle>
          <span className="text-[9px] font-mono text-white/20">{positions.length} positions</span>
        </div>
        {positions.length === 0 ? (
          <EmptyState message="Aucune position ouverte — l'IA n'a pas encore acheté" />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-[9px] font-mono text-white/20 uppercase tracking-widest border-b border-white/5">
                {["Actif", "Qté", "Prix moy.", "Prix actuel", "P&L", "P&L %"].map((h) => (
                  <th key={h} className={`px-5 py-2.5 font-normal ${h === "Actif" ? "text-left" : "text-right"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => {
                const livePrice = prices.find(p => p.ticker === pos.ticker);
                const currentPrice = livePrice?.close ?? Number(pos.current_price) ?? Number(pos.avg_price);
                const pnlValue = (currentPrice - Number(pos.avg_price)) * Number(pos.quantity);
                const pnlPct   = ((currentPrice - Number(pos.avg_price)) / Number(pos.avg_price)) * 100;
                return (
                  <tr key={pos.ticker} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-0.5 h-7 rounded-full" style={{ background: pnlValue >= 0 ? GREEN : RED }} />
                        <div className="text-xs font-mono font-bold text-white">{pos.ticker}</div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right text-[11px] font-mono text-white/50">{Number(pos.quantity).toFixed(6)}</td>
                    <td className="px-5 py-3 text-right text-[11px] font-mono text-white/50">${Number(pos.avg_price).toFixed(2)}</td>
                    <td className="px-5 py-3 text-right text-[11px] font-mono text-white">${currentPrice.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right text-[11px] font-mono" style={{ color: pnlValue >= 0 ? GREEN : RED }}>
                      {pnlValue >= 0 ? "+" : ""}${pnlValue.toFixed(4)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm"
                        style={{ background: `${pnlPct >= 0 ? GREEN : RED}15`, color: pnlPct >= 0 ? GREEN : RED }}>
                        {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Décisions IA ─────────────────────────────────────────────────────────────

function AIDecisions() {
  const { agentLogs, news, indicators, loading } = useMarketData();
  const { prices } = useLivePrices();

  const decisions = Object.values(
    agentLogs
      .filter(l => l.agent_name === "decision" && l.ticker)
      .reduce((acc: Record<string, typeof agentLogs[0]>, log) => {
        if (!acc[log.ticker!]) acc[log.ticker!] = log;
        return acc;
      }, {})
  );

  const [selected, setSelected] = useState<string | null>(decisions[0]?.ticker ?? null);

  if (loading) return <div className="text-[11px] font-mono text-white/20 p-8">Chargement…</div>;

  if (decisions.length === 0) {
    return (
      <div className="bg-[#0d0f1a] border border-white/5 rounded-sm p-16">
        <EmptyState message="Aucune décision IA encore — lancez l'orchestrateur" />
      </div>
    );
  }

  const selectedLog   = decisions.find(d => d.ticker === selected) ?? decisions[0];
  const output        = selectedLog?.output_data as Record<string, unknown> ?? {};
  const price         = prices.find(p => p.ticker === selectedLog?.ticker);
  const indic         = indicators.find(i => i.ticker === selectedLog?.ticker);
  const newsForTicker = news.filter(n => n.ticker === selectedLog?.ticker).slice(0, 5);
  const analyseLog    = agentLogs.find(l => l.agent_name === "analyse" && l.ticker === selectedLog?.ticker);
  const analyseOutput = analyseLog?.output_data as Record<string, unknown> ?? {};

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 flex flex-col gap-3">
          <SectionTitle>Dernières décisions · {decisions.length} actifs</SectionTitle>
          {decisions.map((d) => {
            const out = d.output_data as Record<string, unknown>;
            const p   = prices.find(px => px.ticker === d.ticker);
            return (
              <button key={d.ticker} onClick={() => setSelected(d.ticker!)}
                className="w-full text-left bg-[#0d0f1a] border rounded-sm p-4 transition-all"
                style={{ borderColor: selected === d.ticker ? `${VIOLET}55` : "rgba(255,255,255,0.05)" }}>
                <div className="flex items-start justify-between mb-2.5">
                  <div>
                    <div className="text-xs font-mono font-bold text-white">{d.ticker}</div>
                    <div className="text-[10px] text-white/35">${p?.close.toFixed(2) ?? "—"}</div>
                  </div>
                  <DecisionBadge decision={String(out.action ?? "HOLD")} />
                </div>
                <ConfBar value={Number(out.confidence ?? 0)} />
                <div className="text-[9px] font-mono text-white/20 mt-1.5">
                  {new Date(d.created_at).toLocaleString("fr-FR")}
                </div>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-[#0d0f1a] border border-white/5 rounded-sm p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-lg font-semibold text-white mb-0.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {selectedLog?.ticker}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-white/30">{price?.change_pct?.toFixed(2)}% aujourd'hui</span>
                  <Chip color={GOLD}>{String(output.horizon ?? "—")}</Chip>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-mono font-bold text-white">${price?.close.toFixed(2) ?? "—"}</div>
                <div className="text-[11px] font-mono" style={{ color: (price?.change_pct ?? 0) >= 0 ? GREEN : RED }}>
                  {(price?.change_pct ?? 0) >= 0 ? "+" : ""}{price?.change_pct?.toFixed(2) ?? "—"}%
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <DecisionBadge decision={String(output.action ?? "HOLD")} />
            </div>
            <div className="mb-4">
              <ConfBar value={Number(output.confidence ?? 0)} />
            </div>
            <div className="p-4 bg-white/[0.03] rounded-sm border border-white/[0.05]">
              <div className="text-[9px] font-mono text-white/25 uppercase tracking-widest mb-2">Raisonnement IA</div>
              <p className="text-[12px] text-white/60 leading-relaxed">{String(output.reason ?? "—")}</p>
            </div>
          </div>

          {indic && (
            <div className="bg-[#0d0f1a] border border-white/5 rounded-sm p-5">
              <SectionTitle>Indicateurs techniques</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "RSI (14)", value: indic.rsi?.toFixed(1) ?? "—", color: (indic.rsi ?? 50) > 70 ? RED : (indic.rsi ?? 50) < 30 ? GREEN : GOLD },
                  { label: "MACD", value: indic.macd?.toFixed(4) ?? "—", color: (indic.macd ?? 0) > 0 ? GREEN : RED },
                  { label: "SMA 20", value: indic.sma_20 ? `$${indic.sma_20.toFixed(2)}` : "—", color: GOLD },
                  { label: "SMA 50", value: indic.sma_50 ? `$${indic.sma_50.toFixed(2)}` : "—", color: GOLD },
                  { label: "Tendance", value: indic.trend, color: indic.trend === "bullish" ? GREEN : indic.trend === "bearish" ? RED : GOLD },
                  { label: "Sentiment", value: String(analyseOutput.trend ?? "—"), color: VIOLET },
                ].map((t) => (
                  <div key={t.label} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-sm border border-white/[0.04]">
                    <div className="text-[9px] font-mono text-white/25">{t.label}</div>
                    <span className="text-[10px] font-mono font-bold" style={{ color: t.color }}>{t.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {newsForTicker.length > 0 && (
            <div className="bg-[#0d0f1a] border border-white/5 rounded-sm p-5">
              <SectionTitle>Actualités récentes</SectionTitle>
              <div className="flex flex-col gap-3">
                {newsForTicker.map((n) => (
                  <div key={n.id} className="flex gap-2.5 pb-3 border-b border-white/[0.04] last:border-0 last:pb-0">
                    <span className="mt-0.5 text-xs font-mono shrink-0"
                      style={{ color: n.sentiment === "positive" ? GREEN : n.sentiment === "negative" ? RED : GOLD }}>
                      {n.sentiment === "positive" ? "↑" : n.sentiment === "negative" ? "↓" : "~"}
                    </span>
                    <div>
                      <div className="text-[11px] text-white/60 leading-snug">{n.title}</div>
                      <div className="text-[9px] font-mono text-white/20 mt-0.5">{n.source}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Simulation ───────────────────────────────────────────────────────────────

function Simulation() {
  const { portfolio, trades, portfolioHistory, loading } = useMarketData();

  if (loading) return <div className="text-[11px] font-mono text-white/20 p-8">Chargement…</div>;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Capital disponible" value={`$${Number(portfolio?.capital_usdt ?? 0).toFixed(2)}`} sub="Non investi" />
        <StatCard label="Valeur totale" value={`$${Number(portfolio?.total_value ?? 0).toFixed(2)}`}
          sub={`${(portfolio?.performance ?? 0) >= 0 ? "+" : ""}${(portfolio?.performance ?? 0).toFixed(2)}% depuis début`}
          color={(portfolio?.performance ?? 0) >= 0 ? GREEN : RED} />
        <StatCard label="Opérations" value={`${trades.length}`} sub="Décisions exécutées" />
        <StatCard label="Ventes" value={`${trades.filter(t => t.action === "SELL").length}`} sub="Positions fermées" color={GOLD} />
      </div>

      <div className="bg-[#0d0f1a] border border-white/5 rounded-sm p-5">
        <SectionTitle>Évolution du capital</SectionTitle>
        {portfolioHistory.length > 1 ? (
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={portfolioHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `$${v.toFixed(0)}`} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke={VIOLET} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message="Historique insuffisant — au moins 2 trades nécessaires" />
        )}
      </div>

      <div className="bg-[#0d0f1a] border border-white/5 rounded-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
          <SectionTitle>Journal des opérations IA</SectionTitle>
          <span className="text-[9px] font-mono text-white/20">{trades.length} opérations</span>
        </div>
        {trades.length === 0 ? (
          <EmptyState message="Aucun trade encore — lancez l'orchestrateur" />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-[9px] font-mono text-white/20 uppercase tracking-widest border-b border-white/5">
                {["Date", "Actif", "Action", "Qté", "Prix", "Montant", "Confiance"].map((h) => (
                  <th key={h} className={`px-5 py-2.5 font-normal ${h === "Date" || h === "Actif" || h === "Action" ? "text-left" : "text-right"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => (
                <tr key={t.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-[11px] font-mono text-white/35">
                    {new Date(t.executed_at).toLocaleDateString("fr-FR")} {new Date(t.executed_at).toLocaleTimeString("fr-FR")}
                  </td>
                  <td className="px-5 py-3 text-[11px] font-mono font-bold text-white">{t.ticker}</td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm"
                      style={{ background: t.action === "BUY" ? `${GREEN}15` : `${RED}15`, color: t.action === "BUY" ? GREEN : RED }}>
                      {t.action === "BUY" ? "ACHAT" : "VENTE"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-[11px] font-mono text-white/50">{Number(t.quantity).toFixed(6)}</td>
                  <td className="px-5 py-3 text-right text-[11px] font-mono text-white/50">${Number(t.price).toFixed(2)}</td>
                  <td className="px-5 py-3 text-right text-[11px] font-mono text-white">${Number(t.amount_usdt).toFixed(2)}</td>
                  <td className="px-5 py-3 text-right">
                    <ConfBar value={Number(t.confidence ?? 0)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Agents IA ────────────────────────────────────────────────────────────────

function Agents() {
  const { agentLogs, loading } = useMarketData();

  const agentDefs = [
    { id: "analyse",  name: "Agent Analyse",  color: GOLD,   icon: <TrendingUp size={15} /> },
    { id: "news",     name: "Agent News",     color: CYAN,   icon: <Database size={15} /> },
    { id: "decision", name: "Agent Décision", color: VIOLET, icon: <Target size={15} /> },
    { id: "risque",   name: "Agent Risque",   color: RED,    icon: <Shield size={15} /> },
  ];

  if (loading) return <div className="text-[11px] font-mono text-white/20 p-8">Chargement…</div>;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {agentDefs.map((agent) => {
          const logs    = agentLogs.filter(l => l.agent_name === agent.id).slice(0, 5);
          const lastRun = logs[0];
          return (
            <div key={agent.id} className="bg-[#0d0f1a] border border-white/5 rounded-sm p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-sm flex items-center justify-center"
                    style={{ background: `${agent.color}12`, border: `1px solid ${agent.color}28`, color: agent.color }}>
                    {agent.icon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>{agent.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full"
                        style={{ background: logs.length > 0 ? GREEN : "rgba(255,255,255,0.15)" }} />
                      <span className="text-[10px] font-mono" style={{ color: logs.length > 0 ? GREEN : "rgba(255,255,255,0.3)" }}>
                        {logs.length > 0 ? `${logs.length} exécution${logs.length > 1 ? "s" : ""}` : "Inactif"}
                      </span>
                    </div>
                  </div>
                </div>
                {lastRun && (
                  <div className="text-[9px] font-mono text-white/20">
                    {new Date(lastRun.created_at).toLocaleTimeString("fr-FR")}
                  </div>
                )}
              </div>

              {logs.length === 0 ? (
                <EmptyState message="Pas encore exécuté" />
              ) : (
                <div className="border-t border-white/[0.04] pt-3">
                  <div className="text-[9px] font-mono text-white/20 uppercase tracking-wider mb-2">Journal</div>
                  <div className="flex flex-col gap-1.5">
                    {logs.map((log) => (
                      <div key={log.id} className="flex gap-2">
                        <span className="text-[9px] font-mono text-white/15 shrink-0 tabular-nums">
                          {new Date(log.created_at).toLocaleTimeString("fr-FR")}
                        </span>
                        <span className="text-[10px] font-mono text-white/40">
                          {log.ticker} — {String(
                            (log.output_data as Record<string, unknown>).action
                            ?? (log.output_data as Record<string, unknown>).trend
                            ?? (log.output_data as Record<string, unknown>).sentiment
                            ?? (log.output_data as Record<string, unknown>).approved
                            ?? "OK"
                          )} ({log.duration_ms}ms)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────

const navItems = [
  { id: "dashboard",  label: "Dashboard",    icon: LayoutDashboard },
  { id: "decisions",  label: "Décisions IA", icon: Brain },
  { id: "simulation", label: "Simulation",   icon: TrendingUp },
  { id: "agents",     label: "Agents IA",    icon: Bot },
] as const;

type PageId = (typeof navItems)[number]["id"];

export default function App() {
  const [active, setActive] = useState<PageId>("dashboard");
  const { lastUpdate, refresh, loading } = useMarketData();
  const { prices: livePrices, lastUpdate: livePricesUpdate } = useLivePrices();

  return (
    <div className="flex h-screen overflow-hidden"
      style={{ background: "#07080d", color: "#dde1f0", fontFamily: "'Inter', sans-serif" }}>

      {/* Sidebar */}
      <aside className="w-52 shrink-0 flex flex-col border-r"
        style={{ background: "#0a0b14", borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="w-7 h-7 rounded-sm flex items-center justify-center shrink-0"
            style={{ background: `linear-gradient(135deg, ${VIOLET} 0%, #4a2fc2 100%)` }}>
            <Activity size={13} color="white" />
          </div>
          <div>
            <div className="text-[13px] font-bold tracking-[0.2em] text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>LCDL</div>
            <div className="text-[8px] font-mono text-white/20 tracking-[0.15em]">AI MARKET INTEL</div>
          </div>
        </div>

        <nav className="flex-1 py-4 px-2.5 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button key={item.id} onClick={() => setActive(item.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-[11px] font-mono transition-all text-left"
                style={{
                  background: isActive ? `${VIOLET}18` : "transparent",
                  color: isActive ? VIOLET : "rgba(255,255,255,0.3)",
                  borderLeft: `2px solid ${isActive ? VIOLET : "transparent"}`,
                }}>
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-3 border-t flex flex-col gap-1" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: GREEN, boxShadow: `0 0 5px ${GREEN}` }} />
            <span className="text-[9px] font-mono text-white/25">
              {lastUpdate ? `BDD ${lastUpdate.toLocaleTimeString("fr-FR")}` : "Connexion…"}
            </span>
          </div>
          <button onClick={refresh}
            className="flex items-center gap-2 px-3 py-1.5 rounded-sm text-[11px] font-mono w-full transition-all"
            style={{ color: "rgba(255,255,255,0.25)" }}>
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} /> Actualiser
          </button>
        </div>
      </aside>

      {/* Contenu */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-11 shrink-0 flex items-center justify-between px-6 border-b"
          style={{ background: "rgba(10,11,20,0.6)", borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-2 text-[10px] font-mono text-white/25">
            <span>LCDL</span>
            <ChevronRight size={10} />
            <span className="text-white/50">{active}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-white/20">
              {livePricesUpdate
                ? `Prix live · ${livePricesUpdate.toLocaleTimeString("fr-FR")}`
                : "Chargement prix…"}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-5"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}>
          {active === "dashboard"  && <Dashboard />}
          {active === "decisions"  && <AIDecisions />}
          {active === "simulation" && <Simulation />}
          {active === "agents"     && <Agents />}
        </main>
      </div>
    </div>
  );
}
