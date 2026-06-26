import { useState } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  LayoutDashboard,
  Brain,
  TrendingUp,
  BarChart2,
  Shield,
  Bot,
  Bell,
  Settings,
  ChevronRight,
  ArrowUpRight,
  Check,
  X,
  Activity,
  Clock,
  Database,
  Target,
  Eye,
} from "lucide-react";

// ─── PALETTE ────────────────────────────────────────────────────────────────

const VIOLET = "#7c5df2";
const GOLD = "#c9a227";
const GREEN = "#22c55e";
const RED = "#f43f5e";
const CYAN = "#22d3ee";

// ─── MOCK DATA ───────────────────────────────────────────────────────────────

const portfolioHistory = [
  { date: "01 Mai", value: 112000 },
  { date: "04 Mai", value: 109800 },
  { date: "07 Mai", value: 114200 },
  { date: "10 Mai", value: 116500 },
  { date: "13 Mai", value: 115100 },
  { date: "16 Mai", value: 118900 },
  { date: "19 Mai", value: 121300 },
  { date: "22 Mai", value: 119700 },
  { date: "25 Mai", value: 123400 },
  { date: "28 Mai", value: 122800 },
  { date: "31 Mai", value: 125400 },
];

const aiDecisions = [
  {
    id: 1,
    name: "NVIDIA Corporation",
    ticker: "NVDA",
    type: "Action",
    decision: "ACHETER",
    confidence: 87,
    horizon: "Court terme",
    explanation:
      "Les résultats Q2 dépassent les attentes avec une croissance de 122% du revenu Data Center. La demande en GPU IA reste structurellement forte. Le momentum technique confirme la tendance haussière avec un RSI favorable à 58.",
    factors: { price: 92, volume: 78, trend: 85, news: 91, fundamentals: 88, sentiment: 82 },
    price: 875.4,
    change: 3.24,
    sign: 1,
  },
  {
    id: 2,
    name: "SPDR S&P 500 ETF",
    ticker: "SPY",
    type: "ETF",
    decision: "ATTENDRE",
    confidence: 61,
    horizon: "Moyen terme",
    explanation:
      "L'incertitude macroéconomique liée aux décisions de la Fed maintient une volatilité élevée. Les données d'inflation restent mixtes. Il est préférable d'attendre la prochaine réunion du FOMC avant de prendre une position.",
    factors: { price: 45, volume: 38, trend: 52, news: 41, fundamentals: 60, sentiment: 35 },
    price: 524.17,
    change: 0.38,
    sign: -1,
  },
  {
    id: 3,
    name: "Tesla Inc.",
    ticker: "TSLA",
    type: "Action",
    decision: "VENDRE",
    confidence: 74,
    horizon: "Court terme",
    explanation:
      "Les marges brutes continuent de se comprimer sous l'effet des réductions de prix compétitives. Les livraisons Q3 ont déçu les attentes. La pression concurrentielle en Chine s'intensifie avec BYD et NIO.",
    factors: { price: -71, volume: 65, trend: -68, news: -79, fundamentals: -62, sentiment: -74 },
    price: 248.92,
    change: 2.87,
    sign: -1,
  },
  {
    id: 4,
    name: "iShares MSCI Emerging Markets",
    ticker: "EEM",
    type: "ETF",
    decision: "ACHETER",
    confidence: 69,
    horizon: "Long terme",
    explanation:
      "La stabilisation du dollar américain et les valorisations attractives des marchés émergents créent une fenêtre d'opportunité. La Chine montre des signes de reprise économique progressive.",
    factors: { price: 58, volume: 51, trend: 63, news: 55, fundamentals: 71, sentiment: 48 },
    price: 42.85,
    change: 0.92,
    sign: 1,
  },
];

const portfolioPositions = [
  { ticker: "AAPL", name: "Apple Inc.", qty: 45, avgPrice: 178.2, currentPrice: 192.53, pnl: 644.85, pnlPct: 8.04 },
  { ticker: "MSFT", name: "Microsoft Corp.", qty: 30, avgPrice: 312.4, currentPrice: 378.85, pnl: 1993.5, pnlPct: 21.27 },
  { ticker: "QQQ", name: "Invesco QQQ Trust", qty: 120, avgPrice: 385.1, currentPrice: 448.22, pnl: 7574.4, pnlPct: 16.39 },
  { ticker: "AMZN", name: "Amazon.com Inc.", qty: 25, avgPrice: 142.8, currentPrice: 185.4, pnl: 1065.0, pnlPct: 29.83 },
  { ticker: "GOOGL", name: "Alphabet Inc.", qty: 18, avgPrice: 128.5, currentPrice: 171.92, pnl: 781.56, pnlPct: 33.79 },
];

const tradeHistory = [
  { date: "26 Jun 2025", ticker: "NVDA", action: "ACHAT", qty: 15, price: 831.2, total: 12468.0 },
  { date: "22 Jun 2025", ticker: "TSLA", action: "VENTE", qty: 20, price: 271.4, total: 5428.0 },
  { date: "18 Jun 2025", ticker: "QQQ", action: "ACHAT", qty: 30, price: 421.8, total: 12654.0 },
  { date: "14 Jun 2025", ticker: "AAPL", action: "ACHAT", qty: 45, price: 178.2, total: 8019.0 },
  { date: "09 Jun 2025", ticker: "META", action: "VENTE", qty: 12, price: 498.3, total: 5979.6 },
];

const validationRequests = [
  {
    id: 1,
    agent: "Agent Stratégie",
    request: "Analyser le secteur technologique américain (NASDAQ : QQQ, XLK, SMH)",
    reason:
      "Détection d'un breakout potentiel sur le secteur semi-conducteurs. Demande d'autorisation pour analyse approfondie des 50 composants principaux.",
    type: "Analyse sectorielle",
    priority: "Haute",
    estimatedTime: "~4 minutes",
  },
  {
    id: 2,
    agent: "Agent Recherche",
    request: "Accéder aux données macroéconomiques de la Fed (FRED API)",
    reason:
      "Collecte des données CPI, PCE et taux directeurs pour modéliser l'impact sur les portefeuilles obligataires.",
    type: "Collecte de données",
    priority: "Moyenne",
    estimatedTime: "~2 minutes",
  },
  {
    id: 3,
    agent: "Agent Risque",
    request: "Évaluer l'exposition aux marchés émergents asiatiques",
    reason:
      "Analyse des corrélations entre EEM, FXI et les indices CSI 300 suite aux tensions géopolitiques récentes.",
    type: "Évaluation des risques",
    priority: "Haute",
    estimatedTime: "~6 minutes",
  },
];

const assetPriceHistory = [
  { time: "09:00", price: 868.2 },
  { time: "09:30", price: 871.4 },
  { time: "10:00", price: 869.8 },
  { time: "10:30", price: 874.2 },
  { time: "11:00", price: 872.6 },
  { time: "11:30", price: 876.8 },
  { time: "12:00", price: 878.1 },
  { time: "12:30", price: 873.9 },
  { time: "13:00", price: 871.2 },
  { time: "13:30", price: 875.4 },
  { time: "14:00", price: 877.8 },
  { time: "14:30", price: 875.4 },
];

const agents = [
  {
    id: "research",
    name: "Agent Recherche",
    color: VIOLET,
    status: "active",
    task: "Collecte données NVDA — Rapport annuel 2024",
    progress: 73,
    logs: [
      { time: "14:32:18", msg: "Connexion API Bloomberg établie" },
      { time: "14:31:55", msg: "Téléchargement rapport 10-K NVDA" },
      { time: "14:30:41", msg: "Analyse sentiment — 2 847 tweets analysés" },
      { time: "14:28:19", msg: "Collecte données financières Q2 2024" },
    ],
  },
  {
    id: "analysis",
    name: "Agent Analyse",
    color: GOLD,
    status: "active",
    task: "Analyse tendance 90 jours — Secteur semi-conducteurs",
    progress: 45,
    logs: [
      { time: "14:32:05", msg: "Calcul corrélations NVDA / SOX Index" },
      { time: "14:30:22", msg: "Modèle ARIMA initialisé (p=2, d=1, q=2)" },
      { time: "14:28:47", msg: "Comparaison historique — 5 cycles similaires" },
      { time: "14:26:33", msg: "Analyse RSI, MACD, Bollinger Bands" },
    ],
  },
  {
    id: "strategy",
    name: "Agent Stratégie",
    color: CYAN,
    status: "processing",
    task: "Formulation recommandation — NVDA position longue",
    progress: 28,
    logs: [
      { time: "14:31:44", msg: "Synthèse données Agent Recherche reçue" },
      { time: "14:29:18", msg: "Évaluation horizon d'investissement" },
      { time: "14:27:52", msg: "Définition take-profit / stop-loss" },
      { time: "14:25:09", msg: "Consultation Agent Risque en cours..." },
    ],
  },
  {
    id: "risk",
    name: "Agent Risque",
    color: RED,
    status: "idle",
    task: "Évaluation exposition sectorielle globale",
    progress: 91,
    logs: [
      { time: "14:32:28", msg: "VaR 95% calculée : -2.3% (journalière)" },
      { time: "14:31:02", msg: "Corrélation portefeuille — Beta : 1.24" },
      { time: "14:29:37", msg: "Stress test — scénario correction -15%" },
      { time: "14:27:14", msg: "Exposition secteur tech : 42.8% portefeuille" },
    ],
  },
];

// ─── SHARED PRIMITIVES ───────────────────────────────────────────────────────

function Chip({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-mono font-semibold tracking-wider uppercase"
      style={{ background: `${color}18`, color, border: `1px solid ${color}33` }}
    >
      {children}
    </span>
  );
}

function DecisionBadge({ decision }: { decision: string }) {
  const cfg: Record<string, { color: string }> = {
    ACHETER: { color: GREEN },
    VENDRE: { color: RED },
    ATTENDRE: { color: GOLD },
  };
  const { color } = cfg[decision] ?? { color: "#888" };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-[11px] font-mono font-bold tracking-[0.12em]"
      style={{ background: `${color}15`, color, border: `1px solid ${color}44` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
      {decision}
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

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-[#0d0f1a] border border-white/5 rounded-sm p-4 flex flex-col gap-1.5">
      <span className="text-[9px] font-mono text-white/25 tracking-[0.15em] uppercase">{label}</span>
      <span
        className="text-2xl font-semibold tracking-tight leading-none"
        style={{ fontFamily: "'Outfit', sans-serif", color: color ?? "white" }}
      >
        {value}
      </span>
      {sub && <span className="text-[10px] font-mono text-white/30">{sub}</span>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[9px] font-mono text-white/25 tracking-[0.18em] uppercase mb-3">
      {children}
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  format,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  format?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const fmt = format ?? ((v: number) => `€${v.toLocaleString("fr-FR")}`);
  return (
    <div className="bg-[#0d0f1a] border border-white/10 rounded-sm px-3 py-2 text-[11px] font-mono shadow-xl">
      <div className="text-white/40 mb-0.5">{label}</div>
      <div className="text-white font-bold">{fmt(payload[0].value)}</div>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

function Dashboard() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Capital total" value="€125 400" sub="Portefeuille virtuel" />
        <StatCard label="Performance globale" value="+12.4%" sub="↑ +€13 847 depuis le début" color={GREEN} />
        <StatCard label="Positions ouvertes" value="8" sub="5 actions · 3 ETF" />
        <StatCard label="Journée" value="+€342" sub="↑ +0.27% aujourd'hui" color={GREEN} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Portfolio chart */}
        <div className="lg:col-span-2 bg-[#0d0f1a] border border-white/5 rounded-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <SectionTitle>Évolution du portefeuille</SectionTitle>
              <div className="text-[11px] text-white/30">30 derniers jours</div>
            </div>
            <span className="text-sm font-mono font-bold" style={{ color: GREEN }}>+12.4%</span>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={portfolioHistory}>
              <defs>
                <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={VIOLET} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={VIOLET} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9, fontFamily: "JetBrains Mono" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9, fontFamily: "JetBrains Mono" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="value" stroke={VIOLET} strokeWidth={2} fill="url(#pg)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Market tickers */}
        <div className="bg-[#0d0f1a] border border-white/5 rounded-sm p-4">
          <SectionTitle>Marchés en temps réel</SectionTitle>
          <div className="flex flex-col divide-y divide-white/[0.04]">
            {[
              { name: "S&P 500", val: "5 447.68", chg: "+0.34%", pos: true },
              { name: "NASDAQ", val: "17 192.53", chg: "+0.58%", pos: true },
              { name: "DOW JONES", val: "39 118.86", chg: "-0.12%", pos: false },
              { name: "VIX", val: "13.24", chg: "-2.41%", pos: false },
              { name: "EUR/USD", val: "1.0847", chg: "+0.18%", pos: true },
              { name: "Or XAU/USD", val: "2 328.40", chg: "+0.43%", pos: true },
              { name: "WTI Brut", val: "81.27", chg: "-0.65%", pos: false },
            ].map((m) => (
              <div key={m.name} className="flex items-center justify-between py-2.5">
                <span className="text-[11px] font-mono text-white/40">{m.name}</span>
                <div className="text-right">
                  <div className="text-[11px] font-mono text-white">{m.val}</div>
                  <div className="text-[10px] font-mono" style={{ color: m.pos ? GREEN : RED }}>
                    {m.chg}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Positions table */}
      <div className="bg-[#0d0f1a] border border-white/5 rounded-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
          <SectionTitle>Positions ouvertes</SectionTitle>
          <span className="text-[9px] font-mono text-white/20">8 positions</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[9px] font-mono text-white/20 uppercase tracking-widest border-b border-white/5">
                {["Actif", "Qté", "Prix moy.", "Prix actuel", "P&L", "P&L %"].map((h) => (
                  <th key={h} className={`px-5 py-2.5 font-normal ${h === "Actif" ? "text-left" : "text-right"}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {portfolioPositions.map((pos) => (
                <tr
                  key={pos.ticker}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-0.5 h-7 rounded-full" style={{ background: GREEN }} />
                      <div>
                        <div className="text-xs font-mono font-bold text-white">{pos.ticker}</div>
                        <div className="text-[10px] text-white/30">{pos.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right text-[11px] font-mono text-white/50">{pos.qty}</td>
                  <td className="px-5 py-3 text-right text-[11px] font-mono text-white/50">
                    ${pos.avgPrice.toFixed(2)}
                  </td>
                  <td className="px-5 py-3 text-right text-[11px] font-mono text-white">
                    ${pos.currentPrice.toFixed(2)}
                  </td>
                  <td className="px-5 py-3 text-right text-[11px] font-mono" style={{ color: GREEN }}>
                    +€{pos.pnl.toFixed(2)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded-sm"
                      style={{ background: `${GREEN}15`, color: GREEN }}
                    >
                      +{pos.pnlPct.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── AI DECISION CENTER ──────────────────────────────────────────────────────

function AIDecisions() {
  const [selected, setSelected] = useState(aiDecisions[0]);

  const factorLabels: Record<string, string> = {
    price: "Évolution du prix",
    volume: "Volume",
    trend: "Tendance graphique",
    news: "Actualités récentes",
    fundamentals: "Données financières",
    sentiment: "Sentiment du marché",
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* List */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <SectionTitle>Analyses récentes · {aiDecisions.length} actifs</SectionTitle>
          {aiDecisions.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelected(d)}
              className="w-full text-left bg-[#0d0f1a] border rounded-sm p-4 transition-all"
              style={{
                borderColor: selected.id === d.id ? `${VIOLET}55` : "rgba(255,255,255,0.05)",
                boxShadow: selected.id === d.id ? `0 0 0 1px ${VIOLET}22` : "none",
              }}
            >
              <div className="flex items-start justify-between mb-2.5">
                <div>
                  <div className="text-xs font-mono font-bold text-white">{d.ticker}</div>
                  <div className="text-[10px] text-white/35">{d.name}</div>
                </div>
                <DecisionBadge decision={d.decision} />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Chip color="#555">{d.type}</Chip>
                <Chip color={GOLD}>{d.horizon}</Chip>
              </div>
              <ConfBar value={d.confidence} />
            </button>
          ))}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-[#0d0f1a] border border-white/5 rounded-sm p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div
                  className="text-lg font-semibold text-white mb-0.5"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  {selected.name}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-white/30">{selected.ticker}</span>
                  <span className="text-white/15">·</span>
                  <Chip color="#555">{selected.type}</Chip>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-mono font-bold text-white">${selected.price.toFixed(2)}</div>
                <div
                  className="text-[11px] font-mono"
                  style={{ color: selected.sign > 0 ? GREEN : RED }}
                >
                  {selected.sign > 0 ? "+" : "-"}{selected.change.toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <DecisionBadge decision={selected.decision} />
              <Chip color={GOLD}>{selected.horizon}</Chip>
            </div>

            <div className="mb-4">
              <ConfBar value={selected.confidence} />
            </div>

            <div className="p-4 bg-white/[0.03] rounded-sm border border-white/[0.05]">
              <div className="text-[9px] font-mono text-white/25 uppercase tracking-widest mb-2">
                Raisonnement IA
              </div>
              <p className="text-[12px] text-white/60 leading-relaxed">{selected.explanation}</p>
            </div>
          </div>

          {/* Factors */}
          <div className="bg-[#0d0f1a] border border-white/5 rounded-sm p-5">
            <SectionTitle>Facteurs analysés</SectionTitle>
            <div className="flex flex-col gap-3">
              {Object.entries(selected.factors).map(([key, raw]) => {
                const val = raw as number;
                const abs = Math.abs(val);
                const color = val >= 0 ? GREEN : RED;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-white/35 w-36 shrink-0">
                      {factorLabels[key]}
                    </span>
                    <div className="flex-1 relative h-[3px] bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 h-full rounded-full"
                        style={{
                          width: `${abs}%`,
                          background: color,
                          left: val < 0 ? `${100 - abs}%` : "0",
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-mono tabular-nums w-8 text-right" style={{ color }}>
                      {val > 0 ? "+" : ""}
                      {val}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PORTFOLIO SIMULATION ────────────────────────────────────────────────────

function Simulation() {
  const compData = portfolioHistory.map((d, i) => ({
    date: d.date,
    lcdl: d.value,
    sp500: 112000 + i * 850,
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Capital virtuel" value="€125 400" sub="Départ : €111 553" />
        <StatCard label="Rendement IA" value="+12.4%" sub="vs S&P 500 : +8.1%" color={GREEN} />
        <StatCard label="Opérations exécutées" value="47" sub="38 gagnantes · 9 perdantes" />
        <StatCard label="Taux de succès" value="80.9%" sub="Décisions rentables" color={GREEN} />
      </div>

      {/* Comparison chart */}
      <div className="bg-[#0d0f1a] border border-white/5 rounded-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <SectionTitle>Performance comparative</SectionTitle>
            <div className="text-[11px] text-white/30">LCDL IA vs S&P 500</div>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 rounded-full" style={{ background: VIOLET }} />
              <span className="text-[9px] font-mono text-white/35 uppercase tracking-wider">LCDL IA</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 rounded-full border-t border-dashed" style={{ borderColor: GOLD }} />
              <span className="text-[9px] font-mono text-white/35 uppercase tracking-wider">S&P 500</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={210}>
          <LineChart data={compData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="date"
              tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9, fontFamily: "JetBrains Mono" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9, fontFamily: "JetBrains Mono" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-[#0d0f1a] border border-white/10 rounded-sm px-3 py-2 text-[11px] font-mono shadow-xl">
                    <div className="text-white/40 mb-1">{label}</div>
                    <div style={{ color: VIOLET }}>LCDL : €{(payload[0]?.value as number)?.toLocaleString("fr-FR")}</div>
                    <div style={{ color: GOLD }}>S&P 500 : €{(payload[1]?.value as number)?.toLocaleString("fr-FR")}</div>
                  </div>
                );
              }}
            />
            <Line type="monotone" dataKey="lcdl" stroke={VIOLET} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="sp500" stroke={GOLD} strokeWidth={1.5} dot={false} strokeDasharray="5 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Trade log */}
      <div className="bg-[#0d0f1a] border border-white/5 rounded-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
          <SectionTitle>Journal des opérations IA</SectionTitle>
          <span className="text-[9px] font-mono text-white/20">47 opérations</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-[9px] font-mono text-white/20 uppercase tracking-widest border-b border-white/5">
              {["Date", "Actif", "Action", "Qté", "Prix", "Montant", "Statut"].map((h) => (
                <th key={h} className={`px-5 py-2.5 font-normal ${h === "Date" || h === "Actif" || h === "Action" ? "text-left" : "text-right"}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tradeHistory.map((t, i) => (
              <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3 text-[11px] font-mono text-white/35">{t.date}</td>
                <td className="px-5 py-3 text-[11px] font-mono font-bold text-white">{t.ticker}</td>
                <td className="px-5 py-3">
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-sm"
                    style={{
                      background: t.action === "ACHAT" ? `${GREEN}15` : `${RED}15`,
                      color: t.action === "ACHAT" ? GREEN : RED,
                    }}
                  >
                    {t.action}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-[11px] font-mono text-white/50">{t.qty}</td>
                <td className="px-5 py-3 text-right text-[11px] font-mono text-white/50">${t.price.toFixed(2)}</td>
                <td className="px-5 py-3 text-right text-[11px] font-mono text-white">
                  ${t.total.toLocaleString("en-US")}
                </td>
                <td className="px-5 py-3 text-right">
                  <span className="text-[10px] font-mono" style={{ color: `${GREEN}aa` }}>
                    ● Exécuté
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── ASSET ANALYSIS ──────────────────────────────────────────────────────────

function AssetAnalysis() {
  const [asset, setAsset] = useState("NVDA");

  return (
    <div className="flex flex-col gap-5">
      {/* Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {["NVDA", "AAPL", "MSFT", "GOOGL", "TSLA", "SPY", "QQQ"].map((a) => (
          <button
            key={a}
            onClick={() => setAsset(a)}
            className="px-3 py-1.5 rounded-sm text-[11px] font-mono font-bold transition-all"
            style={{
              background: asset === a ? `${VIOLET}22` : "rgba(255,255,255,0.04)",
              color: asset === a ? VIOLET : "rgba(255,255,255,0.35)",
              border: `1px solid ${asset === a ? VIOLET + "44" : "rgba(255,255,255,0.06)"}`,
            }}
          >
            {a}
          </button>
        ))}
        <div className="ml-auto text-[10px] font-mono text-white/20">Données simulées</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Price chart */}
          <div className="bg-[#0d0f1a] border border-white/5 rounded-sm p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-base font-semibold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  NVIDIA Corporation
                </div>
                <div className="text-[10px] font-mono text-white/30">NASDAQ: NVDA · Technologie · Semi-conducteurs</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-mono font-bold text-white">$875.40</div>
                <div className="text-[11px] font-mono" style={{ color: GREEN }}>+$27.68 (+3.26%)</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={assetPriceHistory}>
                <defs>
                  <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={GREEN} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="time"
                  tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9, fontFamily: "JetBrains Mono" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9, fontFamily: "JetBrains Mono" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-[#0d0f1a] border border-white/10 rounded-sm px-3 py-2 text-[11px] font-mono">
                        <div className="text-white/40">{label}</div>
                        <div className="text-white font-bold">${(payload[0]?.value as number)?.toFixed(2)}</div>
                      </div>
                    );
                  }}
                />
                <Area type="monotone" dataKey="price" stroke={GREEN} strokeWidth={2} fill="url(#ag)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Fundamentals */}
          <div className="bg-[#0d0f1a] border border-white/5 rounded-sm p-5">
            <SectionTitle>Analyse fondamentale</SectionTitle>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                ["Cap. boursière", "$2.15T"],
                ["PER (TTM)", "72.4×"],
                ["PEG Ratio", "0.89"],
                ["Revenu annuel", "$60.9B"],
                ["Marge brute", "72.7%"],
                ["EPS", "$12.96"],
                ["Dividende", "0.03%"],
                ["Beta", "1.68"],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-mono text-white/25 uppercase tracking-wider">{label}</span>
                  <span className="text-xs font-mono font-bold text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Technical indicators */}
          <div className="bg-[#0d0f1a] border border-white/5 rounded-sm p-5">
            <SectionTitle>Indicateurs techniques</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "RSI (14)", value: "58.3", signal: "Neutre", color: GOLD },
                { label: "MACD", value: "+12.4", signal: "Haussier", color: GREEN },
                { label: "MM 50j", value: "$821.40", signal: "Au-dessus ↑", color: GREEN },
                { label: "MM 200j", value: "$654.80", signal: "Au-dessus ↑", color: GREEN },
                { label: "Bollinger", value: "Upper band", signal: "Attention", color: GOLD },
                { label: "Volume moyen", value: "42.8M", signal: "+28% vs moy.", color: GREEN },
              ].map((t) => (
                <div key={t.label} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-sm border border-white/[0.04]">
                  <div>
                    <div className="text-[9px] font-mono text-white/25">{t.label}</div>
                    <div className="text-xs font-mono font-bold text-white">{t.value}</div>
                  </div>
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm"
                    style={{ color: t.color, background: `${t.color}15` }}
                  >
                    {t.signal}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* AI forecast */}
          <div
            className="bg-[#0d0f1a] border rounded-sm p-5"
            style={{ borderColor: `${VIOLET}33` }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: VIOLET, boxShadow: `0 0 8px ${VIOLET}` }} />
              <span className="text-[9px] font-mono tracking-widest uppercase" style={{ color: VIOLET }}>
                Prévision IA
              </span>
            </div>
            <DecisionBadge decision="ACHETER" />
            <div className="mt-4 text-[11px] font-mono text-white/50 leading-relaxed space-y-1.5">
              <div>
                Objectif CT :{" "}
                <span className="text-white font-bold">$920 – $950</span>
              </div>
              <div>
                Stop-loss :{" "}
                <span style={{ color: RED }} className="font-bold">$835</span>
              </div>
              <div>
                Horizon :{" "}
                <span style={{ color: GOLD }}>3 à 8 semaines</span>
              </div>
              <div>
                Risk/Reward :{" "}
                <span className="text-white font-bold">1 : 2.4</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-[9px] font-mono text-white/25 mb-1.5">Confiance</div>
              <ConfBar value={87} />
            </div>
          </div>

          {/* News */}
          <div className="bg-[#0d0f1a] border border-white/5 rounded-sm p-5 flex-1">
            <SectionTitle>Actualités récentes</SectionTitle>
            <div className="flex flex-col gap-3">
              {[
                { time: "2h", title: "NVDA : Résultats Q2 dépassent les attentes de 18%", pos: true },
                { time: "5h", title: "NVIDIA annonce un partenariat élargi avec Microsoft Azure", pos: true },
                { time: "1j", title: "L'IA générative booste la demande de GPU data center", pos: true },
                { time: "2j", title: "AMD tente de regagner des parts sur le HPC", pos: false },
                { time: "3j", title: "China export restrictions — impact limité selon analystes", pos: null },
              ].map((n, i) => (
                <div
                  key={i}
                  className="flex gap-2.5 pb-3 border-b border-white/[0.04] last:border-0 last:pb-0"
                >
                  <span
                    className="mt-0.5 text-xs font-mono shrink-0"
                    style={{
                      color: n.pos === true ? GREEN : n.pos === false ? RED : GOLD,
                    }}
                  >
                    {n.pos === true ? "↑" : n.pos === false ? "↓" : "~"}
                  </span>
                  <div>
                    <div className="text-[11px] text-white/60 leading-snug">{n.title}</div>
                    <div className="text-[9px] font-mono text-white/20 mt-0.5">{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── VALIDATION SYSTEM ───────────────────────────────────────────────────────

function Validation() {
  const [decisions, setDecisions] = useState<Record<number, "approved" | "rejected">>({});
  const [history, setHistory] = useState<
    Array<{ req: (typeof validationRequests)[0]; decision: "approved" | "rejected"; time: string }>
  >([]);

  const decide = (id: number, d: "approved" | "rejected") => {
    const req = validationRequests.find((r) => r.id === id);
    if (req) {
      setHistory((prev) => [{ req, decision: d, time: new Date().toLocaleTimeString("fr-FR") }, ...prev]);
    }
    setDecisions((prev) => ({ ...prev, [id]: d }));
  };

  const pending = validationRequests.filter((r) => !decisions[r.id]);

  return (
    <div className="flex flex-col gap-5">
      {/* Control banner */}
      <div
        className="bg-[#0d0f1a] border rounded-sm p-4 flex items-center gap-4"
        style={{ borderColor: `${GOLD}2a` }}
      >
        <div
          className="w-9 h-9 rounded-sm flex items-center justify-center shrink-0"
          style={{ background: `${GOLD}15` }}
        >
          <Shield size={16} style={{ color: GOLD }} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-white mb-0.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Contrôle humain activé — Principe HITL
          </div>
          <div className="text-[11px] text-white/35">
            L'IA ne peut accéder à aucune donnée, ni initier aucune action, sans votre autorisation
            explicite. Toutes les décisions restent sous contrôle humain.
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: GREEN }} />
          <span className="text-[10px] font-mono" style={{ color: GREEN }}>Actif</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pending requests */}
        <div className="flex flex-col gap-3">
          <SectionTitle>Demandes en attente ({pending.length})</SectionTitle>
          {validationRequests.map((req) => {
            const d = decisions[req.id];
            return (
              <div
                key={req.id}
                className="bg-[#0d0f1a] border rounded-sm p-5 transition-all"
                style={{
                  borderColor: d === "approved" ? `${GREEN}33` : d === "rejected" ? `${RED}22` : "rgba(255,255,255,0.05)",
                  opacity: d ? 0.55 : 1,
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: d ? (d === "approved" ? GREEN : RED) : VIOLET,
                        boxShadow: !d ? `0 0 6px ${VIOLET}` : "none",
                      }}
                    />
                    <span className="text-[10px] font-mono text-white/35">{req.agent}</span>
                  </div>
                  <Chip color={req.priority === "Haute" ? RED : GOLD}>{req.priority}</Chip>
                </div>

                <div
                  className="text-sm font-semibold text-white mb-2 leading-snug"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  "{req.request}"
                </div>
                <p className="text-[11px] text-white/45 leading-relaxed mb-3">{req.reason}</p>

                <div className="flex items-center gap-3 mb-4">
                  <Chip color="#555">{req.type}</Chip>
                  <div className="flex items-center gap-1 text-[9px] font-mono text-white/25">
                    <Clock size={9} />
                    <span>{req.estimatedTime}</span>
                  </div>
                </div>

                {!d ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => decide(req.id, "approved")}
                      className="flex-1 py-2 rounded-sm text-[11px] font-mono font-bold transition-all hover:opacity-90 flex items-center justify-center gap-1.5"
                      style={{
                        background: `${GREEN}18`,
                        color: GREEN,
                        border: `1px solid ${GREEN}44`,
                      }}
                    >
                      <Check size={12} /> Autoriser l'analyse
                    </button>
                    <button
                      onClick={() => decide(req.id, "rejected")}
                      className="flex-1 py-2 rounded-sm text-[11px] font-mono font-bold transition-all hover:opacity-90 flex items-center justify-center gap-1.5"
                      style={{
                        background: `${RED}12`,
                        color: RED,
                        border: `1px solid ${RED}33`,
                      }}
                    >
                      <X size={12} /> Refuser
                    </button>
                  </div>
                ) : (
                  <div
                    className="text-center text-[11px] font-mono py-1.5 rounded-sm"
                    style={{
                      color: d === "approved" ? GREEN : RED,
                      background: d === "approved" ? `${GREEN}10` : `${RED}10`,
                    }}
                  >
                    {d === "approved" ? "✓ Analyse autorisée" : "✗ Accès refusé"}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* History */}
        <div className="flex flex-col gap-3">
          <SectionTitle>Historique des décisions</SectionTitle>
          {history.length === 0 ? (
            <div className="bg-[#0d0f1a] border border-white/5 rounded-sm p-10 flex flex-col items-center justify-center text-center">
              <Eye size={28} className="mb-3" style={{ color: "rgba(255,255,255,0.08)" }} />
              <div className="text-[11px] font-mono text-white/20">Aucune décision enregistrée</div>
              <div className="text-[10px] font-mono text-white/12 mt-1">
                Autorisez ou refusez une demande pour commencer
              </div>
            </div>
          ) : (
            history.map((h, i) => (
              <div key={i} className="bg-[#0d0f1a] border border-white/5 rounded-sm p-4 flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-sm flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: h.decision === "approved" ? `${GREEN}18` : `${RED}15` }}
                >
                  {h.decision === "approved" ? (
                    <Check size={12} style={{ color: GREEN }} />
                  ) : (
                    <X size={12} style={{ color: RED }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-mono text-white/55 leading-snug">{h.req.request}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[9px] font-mono text-white/20">{h.req.agent}</span>
                    <span className="text-white/10">·</span>
                    <span className="text-[9px] font-mono text-white/20">{h.time}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MULTI-AGENT SYSTEM ──────────────────────────────────────────────────────

function Agents() {
  const AgentIcon = ({ id }: { id: string }) => {
    if (id === "research") return <Database size={15} />;
    if (id === "analysis") return <TrendingUp size={15} />;
    if (id === "strategy") return <Target size={15} />;
    return <Shield size={15} />;
  };

  const statusLabel = (s: string) =>
    s === "active" ? "Actif" : s === "processing" ? "Traitement" : "Veille";

  const statusColor = (s: string) =>
    s === "active" ? GREEN : s === "processing" ? GOLD : "rgba(255,255,255,0.15)";

  return (
    <div className="flex flex-col gap-5">
      {/* Pipeline */}
      <div className="bg-[#0d0f1a] border border-white/5 rounded-sm p-5">
        <SectionTitle>Pipeline d'analyse IA</SectionTitle>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { label: "Collecte données", agent: "Recherche", color: VIOLET, status: "Actif" },
            null,
            { label: "Analyse technique", agent: "Analyse", color: GOLD, status: "Actif" },
            null,
            { label: "Stratégie", agent: "Stratégie", color: CYAN, status: "En cours" },
            null,
            { label: "Éval. risque", agent: "Risque", color: RED, status: "Veille" },
            null,
            { label: "Décision finale", agent: "→ Vous", color: GREEN, status: "Validation" },
          ].map((step, i) => {
            if (!step) {
              return (
                <div key={i} className="text-white/12 font-mono text-base shrink-0 px-0.5">
                  →
                </div>
              );
            }
            return (
              <div
                key={i}
                className="shrink-0 flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-sm bg-white/[0.025] border border-white/[0.04] min-w-[90px] text-center"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: step.color,
                    boxShadow: step.status !== "Veille" ? `0 0 8px ${step.color}` : "none",
                  }}
                />
                <div className="text-[9px] font-mono text-white/50 leading-tight">{step.label}</div>
                <div className="text-[9px] font-mono" style={{ color: step.color }}>
                  {step.status}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agent cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {agents.map((agent) => (
          <div key={agent.id} className="bg-[#0d0f1a] border border-white/5 rounded-sm p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-sm flex items-center justify-center"
                  style={{
                    background: `${agent.color}12`,
                    border: `1px solid ${agent.color}28`,
                    color: agent.color,
                  }}
                >
                  <AgentIcon id={agent.id} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    {agent.name}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: statusColor(agent.status),
                        boxShadow: agent.status !== "idle" ? `0 0 5px ${statusColor(agent.status)}` : "none",
                      }}
                    />
                    <span className="text-[10px] font-mono" style={{ color: statusColor(agent.status) }}>
                      {statusLabel(agent.status)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-mono text-white/20 mb-0.5">Progression</div>
                <div className="text-sm font-mono font-bold" style={{ color: agent.color }}>
                  {agent.progress}%
                </div>
              </div>
            </div>

            <div className="mb-3">
              <div className="text-[9px] font-mono text-white/20 mb-1">Tâche en cours</div>
              <div className="text-[11px] text-white/55">{agent.task}</div>
            </div>

            <div className="w-full h-[3px] bg-white/[0.05] rounded-full overflow-hidden mb-4">
              <div
                className="h-full rounded-full"
                style={{ width: `${agent.progress}%`, background: agent.color }}
              />
            </div>

            <div className="border-t border-white/[0.04] pt-3">
              <div className="text-[9px] font-mono text-white/20 uppercase tracking-wider mb-2">
                Journal d'activité
              </div>
              <div className="flex flex-col gap-1.5">
                {agent.logs.map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-[9px] font-mono text-white/15 shrink-0 tabular-nums">
                      {log.time}
                    </span>
                    <span className="text-[10px] font-mono text-white/40">{log.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────

function SettingsPanel() {
  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div className="bg-[#0d0f1a] border border-white/5 rounded-sm p-5">
        <SectionTitle>Compte</SectionTitle>
        <div className="flex flex-col gap-4">
          {[
            { label: "Identifiant", value: "analyst_01" },
            { label: "Plan", value: "LCDL Institutionnel" },
            { label: "Accès IA", value: "Multi-agents activé" },
            { label: "Région", value: "EU — Paris" },
          ].map((row) => (
            <div key={row.label} className="flex justify-between items-center py-2 border-b border-white/[0.04] last:border-0">
              <span className="text-[11px] font-mono text-white/35">{row.label}</span>
              <span className="text-[11px] font-mono text-white/70">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#0d0f1a] border border-white/5 rounded-sm p-5">
        <SectionTitle>Préférences IA</SectionTitle>
        <div className="flex flex-col gap-3">
          {[
            { label: "Validation obligatoire", value: true },
            { label: "Alertes temps réel", value: true },
            { label: "Mode simulation uniquement", value: true },
            { label: "Journalisation complète", value: false },
          ].map((pref) => (
            <div key={pref.label} className="flex justify-between items-center py-2 border-b border-white/[0.04] last:border-0">
              <span className="text-[11px] font-mono text-white/35">{pref.label}</span>
              <div
                className="w-8 h-4 rounded-full flex items-center px-0.5"
                style={{ background: pref.value ? `${VIOLET}60` : "rgba(255,255,255,0.1)" }}
              >
                <div
                  className="w-3 h-3 rounded-full transition-all"
                  style={{
                    background: pref.value ? VIOLET : "rgba(255,255,255,0.3)",
                    transform: pref.value ? "translateX(16px)" : "translateX(0)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── APP SHELL ────────────────────────────────────────────────────────────────

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "decisions", label: "Décisions IA", icon: Brain },
  { id: "simulation", label: "Simulation", icon: TrendingUp },
  { id: "analysis", label: "Analyse", icon: BarChart2 },
  { id: "validation", label: "Validation", icon: Shield },
  { id: "agents", label: "Agents IA", icon: Bot },
] as const;

type PageId = (typeof navItems)[number]["id"] | "settings";

const pageTitles: Record<PageId, string> = {
  dashboard: "Vue d'ensemble",
  decisions: "Centre de décision IA",
  simulation: "Simulation de portefeuille",
  analysis: "Analyse d'actif",
  validation: "Système de validation",
  agents: "Système multi-agents",
  settings: "Paramètres",
};

export default function App() {
  const [active, setActive] = useState<PageId>("dashboard");

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#07080d", color: "#dde1f0", fontFamily: "'Inter', sans-serif" }}
    >
      {/* Sidebar */}
      <aside
        className="w-52 shrink-0 flex flex-col border-r"
        style={{ background: "#0a0b14", borderColor: "rgba(255,255,255,0.05)" }}
      >
        {/* Wordmark */}
        <div
          className="px-5 py-4 border-b flex items-center gap-3"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
          <div
            className="w-7 h-7 rounded-sm flex items-center justify-center shrink-0"
            style={{ background: `linear-gradient(135deg, ${VIOLET} 0%, #4a2fc2 100%)` }}
          >
            <Activity size={13} color="white" />
          </div>
          <div>
            <div
              className="text-[13px] font-bold tracking-[0.2em] text-white"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              LCDL
            </div>
            <div className="text-[8px] font-mono text-white/20 tracking-[0.15em]">AI MARKET INTEL</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2.5 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-[11px] font-mono transition-all text-left"
                style={{
                  background: isActive ? `${VIOLET}18` : "transparent",
                  color: isActive ? VIOLET : "rgba(255,255,255,0.3)",
                  borderLeft: `2px solid ${isActive ? VIOLET : "transparent"}`,
                }}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div
          className="px-4 py-3 border-t flex flex-col gap-1"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-center gap-2 px-2 py-1">
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: GREEN, boxShadow: `0 0 5px ${GREEN}` }}
            />
            <span className="text-[9px] font-mono text-white/25">Marchés ouverts</span>
          </div>
          <button
            onClick={() => setActive("settings")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-sm text-[11px] font-mono transition-all w-full"
            style={{
              color: active === "settings" ? VIOLET : "rgba(255,255,255,0.25)",
              background: active === "settings" ? `${VIOLET}12` : "transparent",
            }}
          >
            <Settings size={13} /> Paramètres
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header
          className="h-11 shrink-0 flex items-center justify-between px-6 border-b"
          style={{ background: "rgba(10,11,20,0.6)", borderColor: "rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-center gap-2 text-[10px] font-mono text-white/25">
            <span>LCDL</span>
            <ChevronRight size={10} />
            <span className="text-white/50">{pageTitles[active]}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-white/20">26 Jun 2025 · 14:32 CET</span>
            <button className="relative">
              <Bell size={13} className="transition-colors" style={{ color: "rgba(255,255,255,0.25)" }} />
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: RED }} />
            </button>
            <div
              className="w-6 h-6 rounded-sm flex items-center justify-center text-[10px] font-mono font-bold"
              style={{ background: `${VIOLET}22`, color: VIOLET }}
            >
              A
            </div>
          </div>
        </header>

        {/* Page content */}
        <main
          className="flex-1 overflow-y-auto px-6 py-5"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.08) transparent",
          }}
        >
          {active === "dashboard" && <Dashboard />}
          {active === "decisions" && <AIDecisions />}
          {active === "simulation" && <Simulation />}
          {active === "analysis" && <AssetAnalysis />}
          {active === "validation" && <Validation />}
          {active === "agents" && <Agents />}
          {active === "settings" && <SettingsPanel />}
        </main>
      </div>
    </div>
  );
}
