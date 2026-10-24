'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { AgentTab } from '@/components/AgentTab';
import { WalletConfigTab } from '@/components/WalletConfigTab';
import { MccExplorerTab } from '@/components/MccExplorerTab';
import { DEFAULT_USER_WALLET, UserWallet } from '@/lib/optimizerEngine';
import { ShieldCheck } from 'lucide-react';

const WALLET_STORAGE_KEY = 'paywise_india_user_wallet_v1';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'agent' | 'wallet' | 'explorer'>('agent');
  const [wallet, setWallet] = useState<UserWallet>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(WALLET_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed.ownedCardIds)) {
            return parsed as UserWallet;
          }
        }
      } catch (e) {
        console.warn('Could not read wallet from localStorage:', e);
      }
    }
    return DEFAULT_USER_WALLET;
  });

  // Save wallet to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));
    } catch (e) {
      console.warn('Could not save wallet to localStorage:', e);
    }
  }, [wallet]);

  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  const handleTestMerchantFromExplorer = (queryText: string) => {
    setSelectedScenario(queryText);
    setActiveTab('agent');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#080b11]">
      {/* Top SuperApp Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        wallet={wallet}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {activeTab === 'agent' && (
          <AgentTab
            key={selectedScenario || 'default'}
            wallet={wallet}
            initialQuery={selectedScenario}
            onOpenWallet={() => setActiveTab('wallet')}
          />
        )}

        {activeTab === 'wallet' && (
          <WalletConfigTab
            wallet={wallet}
            setWallet={setWallet}
          />
        )}

        {activeTab === 'explorer' && (
          <MccExplorerTab
            onTestMerchant={handleTestMerchantFromExplorer}
          />
        )}
      </main>

      {/* Global SuperApp Footer */}
      <footer className="border-t border-slate-800/80 bg-[#090d16] py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zero-PCI DSS Architecture. No card numbers or passwords ever collected.</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-slate-400">
              Powered by <strong className="text-cyan-400 font-semibold">Gemini 3.8 Flash</strong> + Deterministic Neuro-Symbolic Engine
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
