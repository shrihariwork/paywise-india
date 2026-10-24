'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  ShieldCheck,
  CreditCard,
  Smartphone,
  Crown,
  Sliders,
  RotateCcw,
  Check,
  Plus,
  Search,
  X,
  AlertTriangle,
  Plane,
  Fuel,
  ShoppingBag,
  Utensils,
  Sparkles,
} from 'lucide-react';
import {
  INDIAN_CARDS_60_CATALOG,
  CARDS_BY_CATEGORY,
  CardCategoryGroup,
} from '@/data/indian-cards-catalog';
import {
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
    cardId: 'hsbc-live-plus',
    name: 'HSBC Live+ Credit Card',
    maxCap: 1000,
    categoryName: 'Dining & Supermarket (MCC 5411/5812) 10% Cashback',
  },
  {
    cardId: 'sbi-cashback',
    name: 'SBI Cashback Credit Card',
    maxCap: 5000,
    categoryName: 'Online Spends 5% Cashback',
  },
  {
    cardId: 'hdfc-swiggy',
    name: 'HDFC Swiggy Credit Card',
    maxCap: 1500,
    categoryName: 'Swiggy & Dineout 10% Cashback',
  },
  {
    cardId: 'axis-airtel',
    name: 'Airtel Axis Bank Credit Card',
    maxCap: 500,
    categoryName: 'Swiggy/Zomato/BigBasket 10% Cashback',
  },
  {
    cardId: 'hdfc-phonepe-ultimo',
    name: 'HDFC PhonePe Ultimo RuPay',
    maxCap: 1000,
    categoryName: 'PhonePe Utilities & Recharges 10% Cashback',
  },
];

const QUICK_FILTER_TAGS = [
  { id: 'ALL', label: 'All 60 Cards' },
  { id: 'RUPAY_UPI', label: 'RuPay UPI' },
  { id: 'ZERO_FOREX', label: '0% Forex' },
  { id: 'PHONEPE', label: 'PhonePe' },
  { id: 'ZOMATO', label: 'Zomato' },
  { id: 'SWIGGY', label: 'Swiggy' },
  { id: 'GROCERY', label: 'Grocery / Supermarket' },
  { id: 'FUEL', label: 'Fuel' },
  { id: 'MOVIES', label: 'Movies & BOGO' },
];

const ISSUER_OPTIONS = [
  'All Banks',
  'HDFC Bank',
  'SBI Card',
  'Axis Bank',
  'ICICI Bank',
  'Federal Bank',
  'RBL Bank',
  'IndusInd Bank',
  'AU Small Finance Bank',
  'IDFC FIRST Bank',
  'American Express',
  'Kotak Mahindra Bank',
  'YES Bank',
];

export const WalletConfigTab: React.FC<WalletConfigTabProps> = ({
  wallet,
  setWallet,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [selectedIssuer, setSelectedIssuer] = useState('All Banks');
  const [selectedGroup, setSelectedGroup] = useState<CardCategoryGroup | 'ALL'>('ALL');

  // Check if a card is in the user's wallet (supports hyphen and snake_case matching)
  const isCardInWallet = useCallback(
    (cardSlug: string) => {
      return (
        wallet.ownedCardIds.includes(cardSlug) ||
        wallet.ownedCardIds.includes(cardSlug.replace(/-/g, '_')) ||
        (cardSlug === 'axis-airtel' && wallet.ownedCardIds.includes('airtel_axis')) ||
        (cardSlug === 'hdfc-tataneu-infinity' && wallet.ownedCardIds.includes('tata_neu_infinity_rupay')) ||
        (cardSlug === 'kiwi-rupay-upi' && wallet.ownedCardIds.includes('kiwi_rupay'))
      );
    },
    [wallet.ownedCardIds]
  );

  const toggleCard = (cardSlug: string) => {
    setWallet((prev) => {
      const owned = isCardInWallet(cardSlug);
      let updated: string[];

      if (owned) {
        updated = prev.ownedCardIds.filter(
          (id) =>
            id !== cardSlug &&
            id !== cardSlug.replace(/-/g, '_') &&
            !(cardSlug === 'axis-airtel' && id === 'airtel_axis') &&
            !(cardSlug === 'hdfc-tataneu-infinity' && id === 'tata_neu_infinity_rupay') &&
            !(cardSlug === 'kiwi-rupay-upi' && id === 'kiwi_rupay')
        );
      } else {
        updated = [...prev.ownedCardIds, cardSlug];
      }

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
        [cardId.replace(/-/g, '_')]: value,
      },
    }));
  };

  const resetToDefault = () => {
    setWallet(DEFAULT_USER_WALLET);
  };

  const selectAllCards = () => {
    setWallet((prev) => ({
      ...prev,
      ownedCardIds: INDIAN_CARDS_60_CATALOG.map((c) => c.slug),
    }));
  };

  const clearAllCards = () => {
    setWallet((prev) => ({
      ...prev,
      ownedCardIds: [],
    }));
  };

  // Filtered cards in the modal
  const filteredModalCards = useMemo(() => {
    return INDIAN_CARDS_60_CATALOG.filter((card) => {
      // Group filter
      if (selectedGroup !== 'ALL' && card.categoryGroup !== selectedGroup) {
        return false;
      }

      // Bank/Issuer filter
      if (selectedIssuer !== 'All Banks' && !card.issuer.includes(selectedIssuer)) {
        return false;
      }

      // Quick Tag Filter
      if (selectedTag === 'RUPAY_UPI' && !card.upiLinkable) return false;
      if (selectedTag === 'ZERO_FOREX' && card.forexMarkupBps !== 0) return false;
      if (selectedTag === 'PHONEPE') {
        const matches =
          card.name.toLowerCase().includes('phonepe') ||
          card.keyPerks.some((p) => p.toLowerCase().includes('phonepe'));
        if (!matches) return false;
      }
      if (selectedTag === 'ZOMATO') {
        const matches =
          card.name.toLowerCase().includes('zomato') ||
          card.keyPerks.some((p) => p.toLowerCase().includes('zomato')) ||
          card.categoryAccelerators.some((a) => a.categoryOrMerchant.toLowerCase().includes('zomato'));
        if (!matches) return false;
      }
      if (selectedTag === 'SWIGGY') {
        const matches =
          card.name.toLowerCase().includes('swiggy') ||
          card.keyPerks.some((p) => p.toLowerCase().includes('swiggy')) ||
          card.categoryAccelerators.some((a) => a.categoryOrMerchant.toLowerCase().includes('swiggy'));
        if (!matches) return false;
      }
      if (selectedTag === 'GROCERY') {
        const matches =
          card.categoryGroup === 'FOOD_DINING_GROCERY' ||
          card.keyPerks.some((p) => p.toLowerCase().includes('grocery') || p.toLowerCase().includes('supermarket')) ||
          card.categoryAccelerators.some((a) => a.mccs.includes('5411'));
        if (!matches) return false;
      }
      if (selectedTag === 'FUEL') {
        const matches =
          card.categoryGroup === 'FUEL_ENTERTAINMENT_LIFESTYLE' ||
          card.keyPerks.some((p) => p.toLowerCase().includes('fuel') || p.toLowerCase().includes('petrol')) ||
          card.categoryAccelerators.some((a) => a.mccs.includes('5541'));
        if (!matches) return false;
      }
      if (selectedTag === 'MOVIES') {
        const matches =
          card.keyPerks.some((p) => p.toLowerCase().includes('movie') || p.toLowerCase().includes('bookmyshow') || p.toLowerCase().includes('pvr')) ||
          card.categoryAccelerators.some((a) => a.mccs.includes('7832'));
        if (!matches) return false;
      }

      // Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inName = card.name.toLowerCase().includes(q);
        const inIssuer = card.issuer.toLowerCase().includes(q);
        const inSlug = card.slug.toLowerCase().includes(q);
        const inPerks = card.keyPerks.some((p) => p.toLowerCase().includes(q));
        const inTags = card.searchTags?.some((t) => t.toLowerCase().includes(q)) || false;
        const inAccelerators = card.categoryAccelerators.some((a) =>
          a.categoryOrMerchant.toLowerCase().includes(q)
        );
        return inName || inIssuer || inSlug || inPerks || inTags || inAccelerators;
      }

      return true;
    });
  }, [searchQuery, selectedTag, selectedIssuer, selectedGroup]);

  // Active cards in user's wallet
  const activeCards = useMemo(() => {
    return INDIAN_CARDS_60_CATALOG.filter((c) => isCardInWallet(c.slug));
  }, [isCardInWallet]);

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
            PayWise India never asks for or stores 16-digit card numbers, CVVs, expiry dates, or banking passwords. You only configure the card models you carry. All calculations execute deterministically on your device.
          </p>
        </div>
      </div>

      {/* Wallet Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              My Payment Instruments & Memberships
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              60 Cards Catalog
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage the cards in your pocket, installed UPI apps, and dining memberships.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Browse All 60 Cards</span>
          </button>
          <button
            onClick={resetToDefault}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
            title="Reset to default 5 cards"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Default</span>
          </button>
        </div>
      </div>

      {/* Section 1: Active Cards In User's Wallet */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-cyan-400" />
            <span>Active Cards in Wallet ({activeCards.length} of 60 Selected)</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={selectAllCards}
              className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
            >
              Select All 60
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={clearAllCards}
              className="text-[11px] text-rose-400 hover:underline cursor-pointer"
            >
              Clear All
            </button>
          </div>
        </div>

        {activeCards.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-slate-800 text-center space-y-3">
            <CreditCard className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Your wallet is currently empty</h4>
              <p className="text-xs text-slate-400">
                Add cards from the 60-card master catalog to start calculating exact cashback and reward points.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-black cursor-pointer hover:bg-cyan-400"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add Cards to Wallet</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCards.map((card) => {
              return (
                <div
                  key={card.slug}
                  onClick={() => toggleCard(card.slug)}
                  className="p-4 rounded-xl border transition-all cursor-pointer select-none relative flex flex-col justify-between bg-slate-900/90 border-cyan-500/50 shadow-md shadow-cyan-500/10 hover:border-cyan-400"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          {card.issuer} • {card.network}
                        </span>
                        <h4 className="text-sm font-bold text-white leading-tight">
                          {card.name}
                        </h4>
                      </div>

                      <div className="w-5 h-5 rounded-md flex items-center justify-center border bg-cyan-500 border-cyan-400 text-black shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 my-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        Base: {(card.baseRewardRateBps / 100).toFixed(1)}%
                      </span>
                      {card.forexMarkupBps === 0 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          0% Forex
                        </span>
                      )}
                      {card.upiLinkable && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          RuPay UPI
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 mt-2 pt-2 border-t border-slate-800/80">
                      {card.keyPerks.slice(0, 2).map((perk, idx) => (
                        <div key={idx} className="text-[11px] text-slate-300 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-cyan-400 shrink-0" />
                          <span className="truncate">{perk}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {card.devaluationWarnings.length > 0 && (
                    <div className="mt-3 p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="text-[10px] text-rose-300 leading-tight">
                        {card.devaluationWarnings[0]?.message}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center pt-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/60 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Manage All 60 Cards in Modal</span>
          </button>
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
              Test edge cases: what happens when your HSBC Live+ ₹1,000 grocery cap, SBI Cashback ₹5,000 cap, or PhonePe Ultimo ₹1,000 cap is 80% used?
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {CARDS_WITH_CAPS.map((item) => {
            const isOwned = isCardInWallet(item.cardId);
            const currentUsed =
              wallet.monthlyCapUsed[item.cardId] ||
              wallet.monthlyCapUsed[item.cardId.replace(/-/g, '_')] ||
              0;
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
                    <span className="block text-[10px] text-slate-400">
                      ({percentUsed}% consumed)
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max={item.maxCap}
                  step={50}
                  value={currentUsed}
                  disabled={!isOwned}
                  onChange={(e) => updateCapUsed(item.cardId, Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 disabled:opacity-30"
                />

                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>₹0 (Full Cap Available)</span>
                  <span>{formatINR(item.maxCap)} (Fully Exhausted)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Installed UPI Apps */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-purple-400" />
            <span>Installed UPI Apps & QR Scanners</span>
          </span>
          <span className="text-xs text-purple-300 font-semibold">
            {wallet.installedUpiAppIds.length} Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {UPI_APPS.map((app) => {
            const isInstalled = wallet.installedUpiAppIds.includes(app.id);
            return (
              <div
                key={app.id}
                onClick={() => toggleUpiApp(app.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between ${
                  isInstalled
                    ? 'bg-purple-950/30 border-purple-500/50 text-white'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 opacity-60'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold">{app.name}</h4>
                  <span className="text-[10px] text-slate-400">
                    ~{(app.averageRewardRate * 100).toFixed(1)}% yield
                  </span>
                </div>
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border text-xs ${
                    isInstalled
                      ? 'bg-purple-500 border-purple-400 text-black'
                      : 'border-slate-700 bg-slate-900'
                  }`}
                >
                  {isInstalled && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 4: Active Dining & Ecosystem Memberships */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Active Dining & E-Commerce Memberships</span>
          </span>
          <span className="text-xs text-amber-300 font-semibold">
            {wallet.activeMemberships.length} Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {POPULAR_MEMBERSHIPS.map((mem) => {
            const isActive = wallet.activeMemberships.includes(mem.id);
            return (
              <div
                key={mem.id}
                onClick={() => toggleMembership(mem.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between ${
                  isActive
                    ? 'bg-amber-950/20 border-amber-500/50 text-white'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 opacity-60'
                }`}
              >
                <div className="space-y-0.5 pr-2">
                  <h4 className="text-xs font-bold text-amber-200">{mem.name.split('(')[0]}</h4>
                  <span className="text-[10px] text-slate-400 leading-tight block">
                    {mem.name.includes('(') ? `(${mem.name.split('(')[1]}` : ''}
                  </span>
                </div>
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border text-xs shrink-0 ${
                    isActive
                      ? 'bg-amber-400 border-amber-300 text-black'
                      : 'border-slate-700 bg-slate-900'
                  }`}
                >
                  {isActive && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 60-CARD SEARCH & FILTER MODAL / DRAWER */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl max-h-[90vh] bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-900/60">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <span>Indian Payment Catalog (All 60 Cards)</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {activeCards.length} in Wallet
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Search by bank, merchant (PhonePe, Zomato, Swiggy, DMart), or filter by RuPay UPI and 0% Forex.
                </p>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar & Quick Filters */}
            <div className="p-6 border-b border-slate-800/80 space-y-4 bg-slate-900/30">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search e.g. PhonePe, Zomato, Swiggy, DMart, 0% Forex, HDFC, SBI..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Bank / Issuer Dropdown */}
                <select
                  value={selectedIssuer}
                  onChange={(e) => setSelectedIssuer(e.target.value)}
                  className="px-3 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {ISSUER_OPTIONS.map((issuer) => (
                    <option key={issuer} value={issuer}>
                      {issuer}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Filter Tag Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {QUICK_FILTER_TAGS.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => setSelectedTag(tag.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedTag === tag.id
                        ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>

              {/* Category Group Tabs */}
              <div className="flex items-center gap-2 border-t border-slate-800/80 pt-3 overflow-x-auto scrollbar-thin">
                <button
                  onClick={() => setSelectedGroup('ALL')}
                  className={`text-xs font-medium px-2.5 py-1 rounded-md transition-all ${
                    selectedGroup === 'ALL'
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Categories ({INDIAN_CARDS_60_CATALOG.length})
                </button>
                <button
                  onClick={() => setSelectedGroup('FOOD_DINING_GROCERY')}
                  className={`text-xs font-medium px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                    selectedGroup === 'FOOD_DINING_GROCERY'
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Utensils className="w-3 h-3 text-rose-400" />
                  <span>Food & Dining ({CARDS_BY_CATEGORY.FOOD_DINING_GROCERY.length})</span>
                </button>
                <button
                  onClick={() => setSelectedGroup('UPI_TELECOM_FINTECH')}
                  className={`text-xs font-medium px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                    selectedGroup === 'UPI_TELECOM_FINTECH'
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-3 h-3 text-purple-400" />
                  <span>UPI & Telecom ({CARDS_BY_CATEGORY.UPI_TELECOM_FINTECH.length})</span>
                </button>
                <button
                  onClick={() => setSelectedGroup('ECOMMERCE_CASHBACK')}
                  className={`text-xs font-medium px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                    selectedGroup === 'ECOMMERCE_CASHBACK'
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShoppingBag className="w-3 h-3 text-blue-400" />
                  <span>E-Commerce ({CARDS_BY_CATEGORY.ECOMMERCE_CASHBACK.length})</span>
                </button>
                <button
                  onClick={() => setSelectedGroup('PREMIUM_TRAVEL_ZERO_FOREX')}
                  className={`text-xs font-medium px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                    selectedGroup === 'PREMIUM_TRAVEL_ZERO_FOREX'
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Plane className="w-3 h-3 text-amber-400" />
                  <span>Travel & Forex ({CARDS_BY_CATEGORY.PREMIUM_TRAVEL_ZERO_FOREX.length})</span>
                </button>
                <button
                  onClick={() => setSelectedGroup('FUEL_ENTERTAINMENT_LIFESTYLE')}
                  className={`text-xs font-medium px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                    selectedGroup === 'FUEL_ENTERTAINMENT_LIFESTYLE'
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Fuel className="w-3 h-3 text-orange-400" />
                  <span>Fuel & Lifestyle ({CARDS_BY_CATEGORY.FUEL_ENTERTAINMENT_LIFESTYLE.length})</span>
                </button>
              </div>
            </div>

            {/* Modal Cards Grid */}
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Showing {filteredModalCards.length} matching cards</span>
                <span className="text-cyan-400 font-semibold">
                  Tap any card to add or remove from your wallet
                </span>
              </div>

              {filteredModalCards.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <CreditCard className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-sm font-semibold">No cards found matching your search</p>
                  <p className="text-xs text-slate-500">Try searching for &quot;HDFC&quot;, &quot;UPI&quot;, &quot;Forex&quot;, or &quot;Dining&quot;</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredModalCards.map((card) => {
                    const isOwned = isCardInWallet(card.slug);
                    return (
                      <div
                        key={card.slug}
                        onClick={() => toggleCard(card.slug)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer select-none relative flex flex-col justify-between ${
                          isOwned
                            ? 'bg-slate-900 border-cyan-400/80 shadow-lg shadow-cyan-500/10'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40 opacity-75'
                        }`}
                      >
                        <div>
                          {/* Card Top Header */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {card.issuer} • {card.network}
                              </span>
                              <h4 className="text-sm font-bold text-white leading-tight">
                                {card.name}
                              </h4>
                            </div>

                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                                isOwned
                                  ? 'bg-cyan-500 border-cyan-400 text-black shadow-md'
                                  : 'border-slate-700 bg-slate-900 text-transparent'
                              }`}
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                          </div>

                          {/* Pills for Forex, UPI & Base */}
                          <div className="flex flex-wrap gap-1.5 my-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                              Base: {(card.baseRewardRateBps / 100).toFixed(1)}%
                            </span>
                            {card.forexMarkupBps === 0 ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                0% Forex
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] text-slate-400 bg-slate-900 border border-slate-800">
                                Forex: {(card.forexMarkupBps / 100).toFixed(1)}%
                              </span>
                            )}
                            {card.upiLinkable && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                RuPay UPI
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded text-[10px] text-slate-400 bg-slate-900 border border-slate-800">
                              Fee: {card.annualFeeInr === 0 ? 'LTF' : formatINR(card.annualFeeInr)}
                            </span>
                          </div>

                          {/* Accelerators list */}
                          <div className="space-y-1.5 mt-2.5 pt-2.5 border-t border-slate-800">
                            {card.categoryAccelerators.slice(0, 2).map((acc, idx) => (
                              <div
                                key={idx}
                                className="text-[11px] text-slate-300 flex items-start gap-1.5"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1" />
                                <span className="leading-tight">
                                  <strong className="text-cyan-300 font-bold">
                                    {(acc.effectiveYieldBps / 100).toFixed(1)}%
                                  </strong>{' '}
                                  on {acc.categoryOrMerchant}
                                  {acc.monthlyCapInr && ` (Cap: ${formatINR(acc.monthlyCapInr)})`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Devaluation warning alert if applicable */}
                        {card.devaluationWarnings.length > 0 && (
                          <div className="mt-3 p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-bold text-rose-300 uppercase">
                                Devaluation Warning
                              </span>
                              <p className="text-[10px] text-rose-200 leading-tight">
                                {card.devaluationWarnings[0]?.message}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Selected: <strong className="text-cyan-300 font-bold">{activeCards.length}</strong>{' '}
                of 60 cards active in your wallet
              </span>

              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
