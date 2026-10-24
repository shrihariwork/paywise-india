'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Mic,
  ArrowRight,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import {
  UserWallet,
  OptimizationResult,
  RewardOptimizerEngine,
} from '@/lib/optimizerEngine';
import { formatINR, formatPercent } from '@/lib/utils';
import { SpendingCategory, PaymentEnvironment } from '@/data/indianPaymentCatalog';

interface AgentTabProps {
  wallet: UserWallet;
  onOpenWallet: () => void;
}

interface ParsedIntentPayload {
  merchantName: string;
  category: SpendingCategory;
  mccEstimate: string;
  billAmount: number;
  isOnline: boolean;
  paymentEnvironment: PaymentEnvironment;
  parserSource?: string;
}

interface MultiPartSplitPayload {
  part: {
    description: string;
    billAmount: number;
    category: SpendingCategory;
  };
  optimization: OptimizationResult;
}

interface OptimizationResponsePayload {
  query: string;
  parsedIntent: ParsedIntentPayload;
  optimization: OptimizationResult;
  multiPartResults?: MultiPartSplitPayload[];
  aiSummary: string;
}

const QUICK_SCENARIOS = [
  {
    label: '🛒 ₹3,500 at DMart counter',
    query: "I'm at DMart counter with a ₹3,500 bill for groceries",
  },
  {
    label: '🍽️ ₹4,200 dinner at Mainland China',
    query: 'At Mainland China restaurant, bill is ₹4,200, how should I pay?',
  },
  {
    label: '🎬 ₹1,600 for 2 tickets at PVR Inox',
    query: 'Watching movie at PVR Inox, 2 tickets for ₹1,600',
  },
  {
    label: '🍿 PVR Split: Tickets 1200 & Snacks 600',
    query: 'Watching movie at PVR with friends, tickets 1200 and snacks 600',
  },
  {
    label: '🛍️ ₹6,000 shopping at Westside in Mall',
    query: 'Standing in billing line at Westside in mall, bill is ₹6,000',
  },
  {
    label: '☕ ₹280 at a local cafe (UPI QR only)',
    query: '₹280 at a local cafe counter (UPI QR only)',
  },
];

function getInitialOptimization(wallet: UserWallet): OptimizationResponsePayload {
  const query = "I'm at DMart with a ₹3,500 bill";
  const optimization = RewardOptimizerEngine.optimize(wallet, {
    merchantName: 'DMart',
    category: 'GROCERY',
    billAmount: 3500,
    paymentEnvironment: 'OFFLINE_POS',
  });

  return {
    query,
    parsedIntent: {
      merchantName: 'DMart (Avenue Supermarts)',
      category: 'GROCERY',
      mccEstimate: '5411',
      billAmount: 3500,
      isOnline: false,
      paymentEnvironment: 'OFFLINE_POS',
      parserSource: 'DETERMINISTIC_FALLBACK',
    },
    optimization,
    aiSummary: `Optimal Strategy: Pay via ${optimization.bestOverall.title} to save ${formatINR(optimization.bestOverall.netSavingsInr)} (${formatPercent(optimization.bestOverall.effectiveReturnRate)}) on your ${formatINR(3500)} bill at DMart.`,
  };
}

export const AgentTab: React.FC<AgentTabProps> = ({
  wallet,
  onOpenWallet,
}) => {
  const [queryText, setQueryText] = useState("I'm at DMart with a ₹3,500 bill");
  const [loading, setLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [resultData, setResultData] = useState<OptimizationResponsePayload>(() =>
    getInitialOptimization(wallet)
  );

  const handleOptimize = useCallback(
    async (customQuery?: string) => {
      const textToRun = (customQuery !== undefined ? customQuery : queryText).trim();
      if (!textToRun) return;

      setLoading(true);
      try {
        const res = await fetch('/api/optimize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: textToRun,
            wallet,
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to optimize payment query');
        }

        const data: OptimizationResponsePayload = await res.json();
        setResultData(data);
      } catch (err) {
        console.error('Optimization error:', err);
      } finally {
        setLoading(false);
      }
    },
    [queryText, wallet]
  );

  // Listen to custom query events from MCC explorer
  useEffect(() => {
    const onCustomQuery = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const q = customEvent.detail;
      if (q) {
        setQueryText(q);
        void handleOptimize(q);
      }
    };
    window.addEventListener('paywise_set_query', onCustomQuery);
    return () => window.removeEventListener('paywise_set_query', onCustomQuery);
  }, [handleOptimize]);

  const simulateVoiceInput = () => {
    setIsVoiceActive(true);
    setTimeout(() => {
      const vQuery = 'At Mainland China restaurant, bill is ₹4,200, how should I pay?';
      setQueryText(vQuery);
      setIsVoiceActive(false);
      void handleOptimize(vQuery);
    }, 1800);
  };

  const optimization = resultData?.optimization;
  const bestOverall = optimization?.bestOverall;
  const bestDirect = optimization?.bestDirect;
  const milestonePick = optimization?.milestonePick;
  const missingCard = optimization?.missingCardOpportunity;
  const multiPart = resultData?.multiPartResults;

  return (
    <div className="space-y-8 pb-16">
      {/* Search & Natural Language Query Hero */}
      <section className="relative rounded-2xl glass-panel p-6 sm:p-8 overflow-hidden border border-slate-800/80 shadow-2xl">
        {/* Background glow highlights */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Where are you paying right now?</span>
              </h1>
              <p className="text-sm text-slate-400">
                Ask in plain English. We calculate exact rupee savings across all cards, UPI apps, and dining portals.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Deterministic Neuro-Symbolic Engine
              </span>
            </div>
          </div>

          {/* Search Input Box */}
          <div className="relative flex items-center">
            <input
              type="text"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleOptimize()}
              placeholder="e.g. Standing at DMart queue with ₹3,500 bill..."
              className="w-full pl-4 pr-32 sm:pr-40 py-4 bg-slate-900/90 text-white rounded-xl border border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-sm sm:text-base outline-none transition-all placeholder:text-slate-500 shadow-inner"
            />

            <div className="absolute right-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={simulateVoiceInput}
                title="Simulate Voice Input"
                className={`p-2.5 rounded-lg border transition-all ${
                  isVoiceActive
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
                }`}
              >
                {isVoiceActive ? <Mic className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => handleOptimize()}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-cyan-500/25 disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Optimize</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {isVoiceActive && (
            <div className="flex items-center gap-2 text-xs text-rose-400 font-medium animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Listening to Indian merchant checkout scenario...</span>
            </div>
          )}

          {/* Quick Scenario Chips */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Popular Indian Scenarios:
            </span>
            <div className="flex flex-wrap gap-2">
              {QUICK_SCENARIOS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQueryText(chip.query);
                    handleOptimize(chip.query);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/30 transition-all text-left"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      {resultData && optimization && (
        <div className="space-y-6">
          {/* Query Context Pill Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl glass-panel border border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">Context Resolved:</span>
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                {optimization.resolvedMerchant?.name || resultData.parsedIntent.merchantName}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                Category: {optimization.queryContext.category}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-800 text-amber-300 border border-slate-700">
                MCC: {optimization.queryContext.mccEstimate}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                Env: {optimization.queryContext.paymentEnvironment}
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400">Total Bill Amount: </span>
              <span className="text-base font-bold text-white">
                {formatINR(optimization.queryContext.billAmount)}
              </span>
            </div>
          </div>

          {/* AI Explanation Summary */}
          {resultData.aiSummary && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-slate-900 border border-cyan-500/30 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-cyan-100/90 leading-relaxed">
                {resultData.aiSummary}
              </div>
            </div>
          )}

          {/* Multi-Part Bill Splitting Breakdown (if present) */}
          {multiPart && multiPart.length > 1 && (
            <div className="p-5 rounded-2xl glass-panel border border-purple-500/30 bg-purple-950/20 space-y-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-purple-200">
                  Multi-Part Bill Splitting Recommendation
                </h3>
              </div>
              <p className="text-xs text-slate-300">
                We detected distinct transaction parts (e.g. movie tickets vs snacks). Splitting payments across specialized cards yields maximum rupee returns:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {multiPart.map((item, idx) => {
                  const partBest = item.optimization.bestOverall;
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-900/90 border border-purple-500/20 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                          Part {idx + 1}: {item.part.description}
                        </span>
                        <span className="text-sm font-bold text-white">
                          {formatINR(item.part.billAmount)}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-cyan-300">
                        Use: {partBest.instrumentName} ({partBest.strategyType})
                      </div>
                      <div className="text-xs text-slate-400">
                        {partBest.mathBreakdown}
                      </div>
                      <div className="pt-1 flex items-center justify-between text-xs border-t border-slate-800">
                        <span className="text-slate-400">Savings:</span>
                        <span className="font-bold text-emerald-400">
                          {formatINR(partBest.netSavingsInr)} ({formatPercent(partBest.effectiveReturnRate)})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* HERO #1 RECOMMENDATION STACK CARD */}
          {bestOverall && (
            <div className="relative rounded-2xl glass-panel border-2 border-emerald-500/40 p-6 sm:p-8 overflow-hidden shadow-2xl glow-emerald">
              {/* Winner Header Pill */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>#1 Highest Return Strategy</span>
                  </span>
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    {bestOverall.strategyType}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400">Net Effective Return: </span>
                  <span className="text-xl font-extrabold text-emerald-400">
                    {formatPercent(bestOverall.effectiveReturnRate)}
                  </span>
                </div>
              </div>

              {/* Card & Strategy Title */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">
                      {bestOverall.title}
                    </h2>
                    <p className="text-sm text-slate-300">
                      Issued by <span className="text-cyan-300 font-semibold">{bestOverall.issuer}</span>
                    </p>
                  </div>

                  {/* Mathematical Breakdown Banner */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Exact Financial Math Breakdown:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                        <span className="text-[10px] text-slate-400 uppercase">Upfront Discount</span>
                        <p className="text-sm font-bold text-white">
                          {formatINR(bestOverall.upfrontDiscountInr)}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                        <span className="text-[10px] text-slate-400 uppercase">Card Cashback</span>
                        <p className="text-sm font-bold text-white">
                          {formatINR(bestOverall.cardCashbackInr)}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                        <span className="text-[10px] text-emerald-300 uppercase font-semibold">Total Saved</span>
                        <p className="text-base font-extrabold text-emerald-400">
                          {formatINR(bestOverall.netSavingsInr)}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                        <span className="text-[10px] text-cyan-300 uppercase font-semibold">You Pay</span>
                        <p className="text-base font-extrabold text-cyan-300">
                          {formatINR(bestOverall.netPayableInr)}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                      {bestOverall.mathBreakdown}
                    </div>
                  </div>

                  {/* Step-by-Step Instructions */}
                  <div className="space-y-2.5 pt-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Step-by-Step Payment Instructions:</span>
                    </span>

                    <div className="space-y-2">
                      {bestOverall.steps.map((step, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs sm:text-sm text-slate-200"
                        >
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sleek Visual Card Graphic */}
                <div className="flex flex-col justify-between p-6 rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 border border-slate-700/80 shadow-xl relative min-h-[220px]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono tracking-widest text-slate-400">
                      PAYWISE SECURE
                    </span>
                    <CreditCard className="w-6 h-6 text-cyan-400" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider">
                      Selected Instrument
                    </span>
                    <h4 className="text-lg font-bold text-white leading-tight">
                      {bestOverall.instrumentName}
                    </h4>
                    <p className="text-xs text-cyan-300">
                      {bestOverall.issuer}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase">Effective ROI</span>
                      <p className="text-sm font-bold text-emerald-400">
                        {formatPercent(bestOverall.effectiveReturnRate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase">Net Benefit</span>
                      <p className="text-sm font-bold text-white">
                        {formatINR(bestOverall.netSavingsInr)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Missing Card Opportunity (FOMO Engine) */}
          {missingCard && (
            <div className="p-5 rounded-2xl glass-panel border border-amber-500/40 bg-gradient-to-r from-amber-950/20 via-orange-950/10 to-slate-900 space-y-2 glow-amber">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    FOMO Opportunity
                  </span>
                  <h4 className="text-sm font-bold text-amber-200">
                    Missing Card That Saves Even More
                  </h4>
                </div>
                <span className="text-xs font-bold text-amber-300">
                  +{formatINR(missingCard.extraSavingsInr)} More
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {missingCard.fomoMessage}
              </p>
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={onOpenWallet}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 underline"
                >
                  Configure Wallet Cards →
                </button>
              </div>
            </div>
          )}

          {/* 3-Tier Recommendation Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tier 1: Maximum Value Hack */}
            <div className="p-5 rounded-xl glass-panel border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  🏆 Maximum Value
                </span>
                <span className="text-sm font-bold text-emerald-400">
                  {formatINR(bestOverall?.netSavingsInr || 0)}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  {bestOverall?.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {bestOverall?.mathBreakdown}
                </p>
              </div>
            </div>

            {/* Tier 2: Zero-Hassle Direct */}
            <div className="p-5 rounded-xl glass-panel border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  ⚡ Zero-Hassle (1-Step)
                </span>
                <span className="text-sm font-bold text-cyan-300">
                  {formatINR(bestDirect?.netSavingsInr || 0)}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  {bestDirect?.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {bestDirect?.mathBreakdown}
                </p>
              </div>
            </div>

            {/* Tier 3: Milestone Pick */}
            <div className="p-5 rounded-xl glass-panel border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  🎯 Milestone Booster
                </span>
                <span className="text-sm font-bold text-purple-300">
                  {formatINR(milestonePick ? milestonePick.netSavingsInr : bestOverall?.netSavingsInr || 0)}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  {milestonePick ? milestonePick.title : 'No Active Milestone'}
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {milestonePick
                    ? milestonePick.comparisonNote
                    : 'Configure annual spend targets in Wallet to track milestones.'}
                </p>
              </div>
            </div>
          </div>

          {/* Full Comparison Table of All User Wallet Pathways */}
          <div className="rounded-2xl glass-panel border border-slate-800 overflow-hidden space-y-0">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Full Comparison Across Your Wallet
                </h3>
                <p className="text-xs text-slate-400">
                  See how every card and payment method in your wallet performed for this transaction.
                </p>
              </div>
              <span className="text-xs text-slate-400">
                {optimization.allWalletPathways.length} methods evaluated
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Rank / Strategy</th>
                    <th className="py-3 px-4">Payment Instrument</th>
                    <th className="py-3 px-4">Upfront Discount</th>
                    <th className="py-3 px-4">Card Cashback</th>
                    <th className="py-3 px-4">Total Saved</th>
                    <th className="py-3 px-4">Return %</th>
                    <th className="py-3 px-4">Why It Won or Lost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {optimization.allWalletPathways.map((pathway, index) => {
                    const isWinner = index === 0;
                    return (
                      <tr
                        key={pathway.id}
                        className={`transition-colors ${
                          isWinner ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3.5 px-4 font-bold text-slate-300">
                          {isWinner ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              #1 Winner
                            </span>
                          ) : (
                            `#${index + 1}`
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-medium text-white">
                          <div className="flex flex-col">
                            <span>{pathway.instrumentName}</span>
                            <span className="text-[10px] text-slate-500 uppercase">{pathway.strategyType}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-300">
                          {formatINR(pathway.upfrontDiscountInr)}
                        </td>

                        <td className="py-3.5 px-4 text-slate-300">
                          {formatINR(pathway.cardCashbackInr)}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-emerald-400">
                          {formatINR(pathway.netSavingsInr)}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-200">
                          {formatPercent(pathway.effectiveReturnRate)}
                        </td>

                        <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                          {pathway.comparisonNote || pathway.mathBreakdown}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
