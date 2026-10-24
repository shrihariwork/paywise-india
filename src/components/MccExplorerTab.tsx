'use client';

import React, { useState } from 'react';
import {
  Store,
  Search,
  ArrowRight,
  Sparkles,
  XCircle,
  Gift,
  UtensilsCrossed,
} from 'lucide-react';
import { INDIAN_MERCHANTS, SpendingCategory } from '@/data/indianPaymentCatalog';

interface MccExplorerTabProps {
  onTestMerchant: (query: string) => void;
}

const CATEGORY_FILTERS: Array<{ id: string; label: string; category?: SpendingCategory }> = [
  { id: 'ALL', label: 'All Merchants' },
  { id: 'GROCERY', label: '🛒 Supermarkets & Groceries (5411)', category: 'GROCERY' },
  { id: 'DINING', label: '🍽️ Dining & Restaurants (5812/5814)', category: 'DINING' },
  { id: 'SHOPPING', label: '🛍️ Retail & Malls (5311/5732)', category: 'SHOPPING' },
  { id: 'MOVIES', label: '🎬 Movies & BMS (7832)', category: 'MOVIES' },
  { id: 'TRAVEL', label: '✈️ Airlines & Hotels (4511/7011)', category: 'TRAVEL' },
];

export const MccExplorerTab: React.FC<MccExplorerTabProps> = ({
  onTestMerchant,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');

  const filteredMerchants = INDIAN_MERCHANTS.filter((merchant) => {
    // Category filter
    if (activeFilter !== 'ALL') {
      const catConfig = CATEGORY_FILTERS.find((f) => f.id === activeFilter);
      if (catConfig && catConfig.category && merchant.primaryCategory !== catConfig.category) {
        return false;
      }
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = merchant.name.toLowerCase().includes(q);
      const matchMcc = merchant.mcc.includes(q);
      const matchAliases = merchant.aliases.some((a) => a.toLowerCase().includes(q));
      const matchCategory = merchant.primaryCategory.toLowerCase().includes(q);
      return matchName || matchMcc || matchAliases || matchCategory;
    }

    return true;
  });

  const getSuggestedBill = (category: SpendingCategory) => {
    switch (category) {
      case 'GROCERY':
        return 3500;
      case 'DINING':
        return 4200;
      case 'SHOPPING':
        return 6000;
      case 'MOVIES':
        return 1600;
      case 'TRAVEL':
        return 12000;
      default:
        return 2500;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Explanation */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-3">
        <div className="flex items-center gap-2.5">
          <Store className="w-5 h-5 text-cyan-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">
            Indian Merchant & MCC Knowledge Graph
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
          In India, reward rates are dictated by backend Merchant Category Codes (MCCs) rather than brand names. Discover how DMart, Reliance, PVR, and Taj Hotels code their billing machines and which payment loopholes yield the highest return.
        </p>

        {/* Search & Category Filter */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by merchant name, alias, or MCC (e.g. DMart, 5411, PVR)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 text-white rounded-xl border border-slate-700/80 text-xs sm:text-sm outline-none focus:border-cyan-400 transition-all placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeFilter === f.id
                  ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Merchant Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMerchants.map((merchant) => {
          const suggestedAmount = getSuggestedBill(merchant.primaryCategory);
          return (
            <div
              key={merchant.id}
              className="p-5 rounded-2xl glass-panel-interactive flex flex-col justify-between border border-slate-800/80 space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">
                      {merchant.name}
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      Category: {merchant.primaryCategory}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    MCC {merchant.mcc}
                  </span>
                </div>

                {/* Stacking Portal Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {merchant.hasGiftVouchers ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      <Gift className="w-3 h-3 text-emerald-400" />
                      <span>GyFTR Vouchers Eligible</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
                      <XCircle className="w-3 h-3 text-rose-400" />
                      <span>No GyFTR Vouchers</span>
                    </span>
                  )}

                  {merchant.supportsDiningApps && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      <UtensilsCrossed className="w-3 h-3 text-cyan-400" />
                      <span>Dining Apps (Dineout/Zomato)</span>
                    </span>
                  )}

                  {merchant.supportsTataNeuDirect && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      <span>Tata Neu 10% NeuCoins</span>
                    </span>
                  )}
                </div>

                {/* MCC Insight */}
                <div className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    MCC Mechanics & Insight:
                  </span>
                  <p className="leading-relaxed">{merchant.mccInsight}</p>
                </div>

                {/* Hack Tip */}
                <div className="text-xs text-amber-200/90 bg-amber-950/20 p-3 rounded-xl border border-amber-500/20 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Optimization Hack:</span>
                  </span>
                  <p className="leading-relaxed">{merchant.hackTip}</p>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() =>
                  onTestMerchant(
                    `Standing at ${merchant.name} checkout counter with ₹${suggestedAmount} bill`
                  )
                }
                className="w-full mt-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span>Test ₹{suggestedAmount.toLocaleString('en-IN')} at {merchant.name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {filteredMerchants.length === 0 && (
        <div className="p-12 text-center text-slate-400 rounded-2xl glass-panel border border-slate-800">
          <p className="text-sm">No merchants found matching &quot;{searchQuery}&quot;.</p>
        </div>
      )}
    </div>
  );
};
