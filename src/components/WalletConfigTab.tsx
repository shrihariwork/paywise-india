'use client';

import React from 'react';
import {
  ShieldCheck,
  CreditCard,
  Smartphone,
  Crown,
  Sliders,
  RotateCcw,
  Check,
  Plus,
} from 'lucide-react';
import {
  INDIAN_PAYMENT_INSTRUMENTS,
  UPI_APPS,
} from '@/data/indianPaymentCatalog';
import { UserWallet, DEFAULT_USER_WALLET } from '@/lib/optimizerEngine';
import { formatINR } from '@/lib/utils';

interface WalletConfigTabProps {
  wallet: UserWallet;
  setWallet: React.Dispatch<React.SetStateAction<UserWallet>>;
}

const POPULAR_MEMBERSHIPS = [
  { id: 'SWIGGY_ONE', name: 'Swiggy One (Free delivery & extra Dineout discounts)' },
  { id: 'ZOMATO_GOLD', name: 'Zomato Gold (Dining bill perks)' },
  { id: 'EAZYDINER_PRIME', name: 'EazyDiner Prime (25%-50% table discounts)' },
  { id: 'TATA_NEUPASS', name: 'Tata NeuPass (+5% extra NeuCoins on Tata brands)' },
  { id: 'AMAZON_PRIME', name: 'Amazon Prime (5% on Amazon Pay ICICI Card)' },
];

const CARDS_WITH_CAPS = [
  {
    cardId: 'hsbc_live_plus',
    name: 'HSBC Live+ Credit Card',
    maxCap: 1000,
    categoryName: 'Dining & Supermarket (MCC 5411/5812) 10% Cashback',
  },
  {
    cardId: 'sbi_cashback',
    name: 'SBI Cashback Credit Card',
    maxCap: 5000,
    categoryName: 'Online Spends 5% Cashback',
  },
  {
    cardId: 'hdfc_swiggy',
    name: 'HDFC Swiggy Credit Card',
    maxCap: 1500,
    categoryName: 'Swiggy & Dineout 10% Cashback',
  },
  {
    cardId: 'airtel_axis',
    name: 'Airtel Axis Bank Credit Card',
    maxCap: 500,
    categoryName: 'Swiggy/Zomato/BigBasket 10% Cashback',
  },
];

export const WalletConfigTab: React.FC<WalletConfigTabProps> = ({
  wallet,
  setWallet,
}) => {
  const toggleCard = (cardId: string) => {
    setWallet((prev) => {
      const exists = prev.ownedCardIds.includes(cardId);
      const updated = exists
        ? prev.ownedCardIds.filter((id) => id !== cardId)
        : [...prev.ownedCardIds, cardId];
      return { ...prev, ownedCardIds: updated };
    });
  };

  const toggleUpiApp = (appId: string) => {
    setWallet((prev) => {
      const exists = prev.installedUpiAppIds.includes(appId);
      const updated = exists
        ? prev.installedUpiAppIds.filter((id) => id !== appId)
        : [...prev.installedUpiAppIds, appId];
      return { ...prev, installedUpiAppIds: updated };
    });
  };

  const toggleMembership = (membershipId: string) => {
    setWallet((prev) => {
      const exists = prev.activeMemberships.includes(membershipId);
      const updated = exists
        ? prev.activeMemberships.filter((id) => id !== membershipId)
        : [...prev.activeMemberships, membershipId];
      return { ...prev, activeMemberships: updated };
    });
  };

  const updateCapUsed = (cardId: string, value: number) => {
    setWallet((prev) => ({
      ...prev,
      monthlyCapUsed: {
        ...prev.monthlyCapUsed,
        [cardId]: value,
      },
    }));
  };

  const resetToDefault = () => {
    setWallet(DEFAULT_USER_WALLET);
  };

  const selectAllCards = () => {
    setWallet((prev) => ({
      ...prev,
      ownedCardIds: INDIAN_PAYMENT_INSTRUMENTS.map((c) => c.id),
    }));
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Zero-PCI DSS Security Callout */}
      <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-4 shadow-lg">
        <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-emerald-200">
            Zero-PCI DSS Architecture & Financial Privacy Guarantee
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            PayWise India never asks for or stores 16-digit card numbers, CVVs, expiry dates, or banking passwords. You only choose the card variants you carry in your pocket. Your wallet state is kept locally on your device.
          </p>
        </div>
      </div>

      {/* Wallet Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            My Payment Instruments & Memberships
          </h2>
          <p className="text-xs text-slate-400">
            Toggle what is currently in your physical wallet, phone, or dining accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetToDefault}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>
          <button
            onClick={selectAllCards}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 transition-all border border-cyan-500/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Select All 12 Cards</span>
          </button>
        </div>
      </div>

      {/* Section 1: Indian Credit Cards & RuPay on UPI */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-cyan-400" />
            <span>Top Indian Credit Cards ({INDIAN_PAYMENT_INSTRUMENTS.length} Available)</span>
          </span>
          <span className="text-xs text-cyan-300 font-semibold">
            {wallet.ownedCardIds.length} Active in Wallet
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {INDIAN_PAYMENT_INSTRUMENTS.map((card) => {
            const isOwned = wallet.ownedCardIds.includes(card.id);
            return (
              <div
                key={card.id}
                onClick={() => toggleCard(card.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer select-none relative flex flex-col justify-between ${
                  isOwned
                    ? 'bg-slate-900/90 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {card.issuer} • {card.network}
                    </span>
                    <h4 className="text-sm font-bold text-white leading-tight">
                      {card.name}
                    </h4>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                      isOwned
                        ? 'bg-cyan-500 border-cyan-400 text-black'
                        : 'border-slate-700 bg-slate-900'
                    }`}
                  >
                    {isOwned && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                <div className="space-y-1 mt-2 pt-2 border-t border-slate-800/80">
                  {card.keyPerks.slice(0, 2).map((perk, idx) => (
                    <div key={idx} className="text-[11px] text-slate-300 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-cyan-400" />
                      <span className="truncate">{perk}</span>
                    </div>
                  ))}
                </div>

                {card.upiEnabled && (
                  <span className="mt-2 self-start px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    RuPay on UPI Supported
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Dynamic Monthly Cap Sliders */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-base font-bold text-white">
              Simulate Monthly Cap Already Consumed
            </h3>
            <p className="text-xs text-slate-400">
              Test edge cases: what happens when your HSBC Live+ ₹1,000 grocery cap or SBI Cashback ₹5,000 cap is 80% used?
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {CARDS_WITH_CAPS.map((item) => {
            const isOwned = wallet.ownedCardIds.includes(item.cardId);
            const currentUsed = wallet.monthlyCapUsed[item.cardId] || 0;
            const percentUsed = Math.min(100, Math.round((currentUsed / item.maxCap) * 100));

            return (
              <div
                key={item.cardId}
                className={`p-4 rounded-xl bg-slate-900/80 border space-y-3 ${
                  isOwned ? 'border-slate-700' : 'border-slate-800 opacity-40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-white">{item.name}</h5>
                    <span className="text-[10px] text-slate-400">{item.categoryName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-300">
                      {formatINR(currentUsed)} / {formatINR(item.maxCap)}
                    </span>
                    <span className="block text-[10px] text-slate-400">{percentUsed}% Used</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max={item.maxCap}
                  step="50"
                  disabled={!isOwned}
                  value={currentUsed}
                  onChange={(e) => updateCapUsed(item.cardId, Number(e.target.value))}
                  className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />

                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>₹0 (Full Cap Available)</span>
                  <span>Cap Exhausted ({formatINR(item.maxCap)})</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: UPI Apps & Dining Memberships */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* UPI Apps */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">Installed UPI Apps</h4>
          </div>
          <div className="space-y-2">
            {UPI_APPS.map((app) => {
              const isInstalled = wallet.installedUpiAppIds.includes(app.id);
              return (
                <div
                  key={app.id}
                  onClick={() => toggleUpiApp(app.id)}
                  className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    isInstalled
                      ? 'bg-slate-900 border-emerald-500/40 text-white'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 opacity-60'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{app.name}</div>
                    <div className="text-[11px] text-slate-400">{app.specialPerk}</div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border ${
                      isInstalled ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-slate-700'
                    }`}
                  >
                    {isInstalled && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dining & Lifestyle Memberships */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-400" />
            <h4 className="text-sm font-bold text-white">Active Memberships</h4>
          </div>
          <div className="space-y-2">
            {POPULAR_MEMBERSHIPS.map((mem) => {
              const isActive = wallet.activeMemberships.includes(mem.id);
              return (
                <div
                  key={mem.id}
                  onClick={() => toggleMembership(mem.id)}
                  className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    isActive
                      ? 'bg-slate-900 border-yellow-500/40 text-white'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="text-xs font-semibold leading-tight pr-2">{mem.name}</div>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                      isActive ? 'bg-yellow-400 border-yellow-300 text-black' : 'border-slate-700'
                    }`}
                  >
                    {isActive && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
