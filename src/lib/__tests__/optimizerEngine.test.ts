import { describe, it, expect } from 'vitest';
import {
  RewardOptimizerEngine,
  DEFAULT_USER_WALLET,
  UserWallet,
  QueryContext,
  resolveMerchant,
} from '@/lib/optimizerEngine';
import { roundToPaise, formatINR, formatPercent, cn } from '@/lib/utils';


describe('RewardOptimizerEngine - Deterministic Mathematical & FinTech Tests', () => {
  // Test 1: Merchant Resolution
  describe('Merchant Resolver', () => {
    it('correctly resolves known Indian merchants by ID and aliases', () => {
      expect(resolveMerchant('dmart')?.id).toBe('dmart');
      expect(resolveMerchant('D Mart')?.id).toBe('dmart');
      expect(resolveMerchant('Avenue Supermarts')?.id).toBe('dmart');
      expect(resolveMerchant('Mainland China')?.id).toBe('mainland_china');
      expect(resolveMerchant('Barbeque Nation')?.id).toBe('barbeque_nation');
      expect(resolveMerchant('Westside')?.id).toBe('westside');
      expect(resolveMerchant('PVR')?.id).toBe('pvr_inox');
      expect(resolveMerchant('Taj Hotels')?.id).toBe('taj_hotels');
    });

    it('returns undefined for uncatalogued merchants', () => {
      expect(resolveMerchant('Unknown Kirana Store XYZ')).toBeUndefined();
    });
  });

  // Test 2: Utility & Floating Point Drift
  describe('FinTech Math & Formatting Utilities', () => {
    it('eliminates IEEE-754 floating point drift using roundToPaise', () => {
      // 0.1 + 0.2 in raw JS produces IEEE-754 precision drift
      expect(0.1 + 0.2).not.toBe(0.3);
      expect(roundToPaise(0.1 + 0.2)).toBe(0.3);

      const fee = 3500 * 0.0295; // 103.2499...
      expect(roundToPaise(fee)).toBe(103.25);
    });

    it('formats Indian currency (en-IN) properly', () => {
      expect(formatINR(3500)).toContain('3,500');
      expect(formatINR(100000)).toContain('1,00,000');
      expect(formatINR(1234.56, true)).toContain('1,234.56');
    });

    it('formats percentage cleanly', () => {
      expect(formatPercent(0.165)).toBe('16.5%');
      expect(formatPercent(0.05)).toBe('5.0%');
    });

    it('merges classnames with cn helper', () => {
      expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
      expect(cn('p-4', false && 'hidden', 'p-2')).toBe('p-2');
    });
  });

  // Test 3: DMart Scenario (MCC 5411, Offline POS, HSBC Live+ vs SBI Cashback vs UPI)
  describe('Scenario 1: ₹3,500 Grocery at DMart (Offline POS)', () => {
    it('picks HSBC Live+ as best direct swipe (10% cashback = ₹350)', () => {
      const wallet: UserWallet = {
        ownedCardIds: ['hsbc_live_plus', 'sbi_cashback', 'hdfc_regalia_gold'],
        installedUpiAppIds: ['gpay'],
        activeMemberships: [],
        monthlyCapUsed: { hsbc_live_plus: 0 },
      };

      const query: QueryContext = {
        merchantName: 'DMart',
        category: 'GROCERY',
        billAmount: 3500,
        paymentEnvironment: 'OFFLINE_POS',
      };

      const result = RewardOptimizerEngine.optimize(wallet, query);

      // Best Overall should be HSBC Live+ (10% = ₹350)
      expect(result.bestOverall.instrumentId).toBe('hsbc_live_plus');
      expect(result.bestOverall.cardCashbackInr).toBe(350);
      expect(result.bestOverall.effectiveReturnRate).toBe(0.10);

      // SBI Cashback should earn ONLY 1% (₹35) because DMart is offline POS
      const sbiPathway = result.allWalletPathways.find((p) => p.instrumentId === 'sbi_cashback');
      expect(sbiPathway).toBeDefined();
      expect(sbiPathway?.cardCashbackInr).toBe(35); // 1% of 3500
      expect(sbiPathway?.effectiveReturnRate).toBe(0.01);
    });

    it('handles monthly cap partial exhaustion on HSBC Live+ correctly with excess earning base rate', () => {
      // HSBC cap is ₹1,000. Suppose ₹800 is already used. Remaining cap is ₹200.
      // Bill is ₹3,500. 10% on 3,500 would be ₹350, which exceeds ₹200 remaining cap!
      // Accelerated portion: ₹2,000 spend earns ₹200.
      // Excess spend: ₹1,500 earns base rate 1.5% = ₹22.50.
      // Total cashback: ₹200 + ₹22.50 = ₹222.50.
      const wallet: UserWallet = {
        ownedCardIds: ['hsbc_live_plus'],
        installedUpiAppIds: [],
        activeMemberships: [],
        monthlyCapUsed: { hsbc_live_plus: 800 },
      };

      const query: QueryContext = {
        merchantName: 'DMart',
        category: 'GROCERY',
        billAmount: 3500,
        paymentEnvironment: 'OFFLINE_POS',
      };

      const result = RewardOptimizerEngine.optimize(wallet, query);
      const hsbcPathway = result.bestOverall;

      expect(hsbcPathway.instrumentId).toBe('hsbc_live_plus');
      expect(hsbcPathway.cardCashbackInr).toBe(222.5);
      expect(hsbcPathway.isCapExhausted).toBe(true);
      expect(hsbcPathway.capRemainingBeforeInr).toBe(200);
      expect(hsbcPathway.capRemainingAfterInr).toBe(0);
    });
  });

  // Test 4: Restaurant Scenario (Mainland China ₹4,200 Double-Dip)
  describe('Scenario 2: ₹4,200 Dinner at Mainland China (Dining Double-Dip)', () => {
    it('calculates Swiggy Dineout 12% upfront + HDFC Swiggy 10% cashback double-dip', () => {
      const wallet: UserWallet = {
        ownedCardIds: ['hdfc_swiggy', 'hsbc_live_plus', 'sbi_cashback'],
        installedUpiAppIds: [],
        activeMemberships: ['SWIGGY_ONE'],
        monthlyCapUsed: { hdfc_swiggy: 0 },
      };

      const query: QueryContext = {
        merchantName: 'Mainland China',
        category: 'DINING',
        billAmount: 4200,
        paymentEnvironment: 'OFFLINE_POS',
      };

      const result = RewardOptimizerEngine.optimize(wallet, query);

      // Swiggy Dineout upfront 12% = 4200 * 0.12 = ₹504
      // Net bill payable on app = 4200 - 504 = ₹3,696
      // HDFC Swiggy 10% on ₹3,696 = ₹369.60
      // Total savings = 504 + 369.60 = ₹873.60 (~20.8%)
      const dineoutHdfc = result.allWalletPathways.find(
        (p) => p.id === 'dining_swiggy_dineout_hdfc_swiggy'
      );

      expect(dineoutHdfc).toBeDefined();
      expect(dineoutHdfc?.upfrontDiscountInr).toBe(504);
      expect(dineoutHdfc?.cardCashbackInr).toBe(369.6);
      expect(dineoutHdfc?.netSavingsInr).toBe(873.6);
      expect(dineoutHdfc?.effectiveReturnRate).toBeCloseTo(0.208, 3);
    });
  });

  // Test 5: Instant Voucher Stacking at Malls (Lifestyle ₹6,000 with Infinia)
  describe('Scenario 3: ₹6,000 Shopping at Lifestyle (Instant Voucher Trick)', () => {
    it('calculates HDFC Infinia 16.5% points on SmartBuy GyFTR vouchers', () => {
      const wallet: UserWallet = {
        ownedCardIds: ['hdfc_infinia', 'sbi_cashback'],
        installedUpiAppIds: [],
        activeMemberships: [],
        monthlyCapUsed: {},
      };

      const query: QueryContext = {
        merchantName: 'Lifestyle',
        category: 'SHOPPING',
        billAmount: 6000,
        paymentEnvironment: 'OFFLINE_POS',
      };

      const result = RewardOptimizerEngine.optimize(wallet, query);

      // Infinia SmartBuy gives 16.5% points (5X RP) = ₹990 value
      // Zero convenience fee for brand vouchers
      const voucherPathway = result.allWalletPathways.find(
        (p) => p.strategyType === 'INSTANT_VOUCHER' && p.instrumentId === 'hdfc_infinia'
      );

      expect(voucherPathway).toBeDefined();
      expect(voucherPathway?.rewardPointsValueInr).toBe(990);
      expect(voucherPathway?.feesInr).toBe(0);
      expect(voucherPathway?.netSavingsInr).toBe(990);
      expect(voucherPathway?.effectiveReturnRate).toBe(0.165);
    });
  });

  // Test 6: RuPay on UPI & UPI Apps (Small Cafe ₹280)
  describe('Scenario 4: ₹280 at Local Cafe (UPI QR Only)', () => {
    it('routes through Kiwi or Tata Neu RuPay or Super.money on UPI QR', () => {
      const wallet: UserWallet = {
        ownedCardIds: ['kiwi_axis_rupay', 'tata_neu_infinity_rupay'],
        installedUpiAppIds: ['super_money', 'gpay'],
        activeMemberships: [],
        monthlyCapUsed: {},
      };

      const query: QueryContext = {
        merchantName: 'Local Cafe',
        category: 'DINING',
        billAmount: 280,
        paymentEnvironment: 'UPI_QR_ONLY',
      };

      const result = RewardOptimizerEngine.optimize(wallet, query);

      // In UPI QR only mode, no direct card swipes should be evaluated
      const hasDirectCard = result.allWalletPathways.some((p) => p.strategyType === 'DIRECT_CARD');
      expect(hasDirectCard).toBe(false);

      // Super.money (~3%) or Kiwi RuPay (2%) or Tata Neu (1.5%)
      const superMoney = result.allWalletPathways.find((p) => p.instrumentId === 'super_money');
      const kiwi = result.allWalletPathways.find((p) => p.instrumentId === 'kiwi_axis_rupay');

      expect(superMoney).toBeDefined();
      expect(superMoney?.netSavingsInr).toBe(8.4); // 3% of 280
      expect(kiwi).toBeDefined();
      expect(kiwi?.netSavingsInr).toBe(5.6); // 2% of 280
    });
  });

  // Test 7: MCC Exclusion Enforcement
  describe('MCC Exclusions (Fuel & Rent)', () => {
    it('awards 0% when category is in card exclusion list', () => {
      const wallet: UserWallet = {
        ownedCardIds: ['sbi_cashback', 'hsbc_live_plus'],
        installedUpiAppIds: [],
        activeMemberships: [],
        monthlyCapUsed: {},
      };

      const fuelQuery: QueryContext = {
        merchantName: 'Indian Oil Petrol Pump',
        category: 'FUEL',
        billAmount: 2000,
        paymentEnvironment: 'OFFLINE_POS',
      };

      const result = RewardOptimizerEngine.optimize(wallet, fuelQuery);
      for (const p of result.allWalletPathways) {
        if (p.strategyType === 'DIRECT_CARD') {
          expect(p.netSavingsInr).toBe(0);
          expect(p.effectiveReturnRate).toBe(0);
        }
      }
    });
  });

  // Test 8: FOMO Missing Card Insight
  describe('FOMO Engine - Missing Card Opportunity', () => {
    it('detects and calculates extra savings if high-yield card is missing', () => {
      // User only owns SBI Cashback (which gives 1% offline at DMart)
      const wallet: UserWallet = {
        ownedCardIds: ['sbi_cashback'],
        installedUpiAppIds: [],
        activeMemberships: [],
        monthlyCapUsed: {},
      };

      const query: QueryContext = {
        merchantName: 'DMart',
        category: 'GROCERY',
        billAmount: 3500,
        paymentEnvironment: 'OFFLINE_POS',
      };

      const result = RewardOptimizerEngine.optimize(wallet, query);

      // User gets ₹35 with SBI Cashback.
      // Missing HSBC Live+ would give ₹350 (extra ₹315!)
      expect(result.missingCardOpportunity).toBeDefined();
      expect(result.missingCardOpportunity?.cardId).toBe('hsbc_live_plus');
      expect(result.missingCardOpportunity?.extraSavingsInr).toBe(315);
      expect(result.missingCardOpportunity?.fomoMessage).toContain('HSBC Live+');
      expect(result.missingCardOpportunity?.fomoMessage).toContain('315');
    });
  });

  // Test 9: Milestone Booster Card (Amex Platinum Travel)
  describe('Milestone Booster Pick', () => {
    it('adds pro-rated milestone weight when card is in targetMilestoneCards', () => {
      const wallet: UserWallet = {
        ownedCardIds: ['amex_plat_travel', 'sbi_cashback'],
        installedUpiAppIds: [],
        activeMemberships: [],
        monthlyCapUsed: {},
        targetMilestoneCards: ['amex_plat_travel'],
      };

      const query: QueryContext = {
        merchantName: 'Croma',
        category: 'SHOPPING',
        billAmount: 25000,
        paymentEnvironment: 'OFFLINE_POS',
      };

      const result = RewardOptimizerEngine.optimize(wallet, query);
      const amexPathway = result.allWalletPathways.find((p) => p.instrumentId === 'amex_plat_travel');

      expect(amexPathway).toBeDefined();
      expect(amexPathway?.milestoneBonusInr).toBeGreaterThan(0);
      expect(result.milestonePick).toBeDefined();
    });
  });

  // Test 10: Edge Cases
  describe('Edge Cases', () => {
    it('handles zero bill amount gracefully without crashing', () => {
      const result = RewardOptimizerEngine.optimize(DEFAULT_USER_WALLET, {
        merchantName: 'Zero Bill Test',
        category: 'GENERAL',
        billAmount: 0,
        paymentEnvironment: 'ONLINE',
      });

      expect(result.bestOverall.netSavingsInr).toBe(0);
      expect(result.bestOverall.effectiveReturnRate).toBe(0);
    });

    it('handles empty user wallet gracefully with fallback zero pathway', () => {
      const emptyWallet: UserWallet = {
        ownedCardIds: [],
        installedUpiAppIds: [],
        activeMemberships: [],
        monthlyCapUsed: {},
      };

      const result = RewardOptimizerEngine.optimize(emptyWallet, {
        merchantName: 'DMart',
        category: 'GROCERY',
        billAmount: 1000,
        paymentEnvironment: 'OFFLINE_POS',
      });

      expect(result.bestOverall.instrumentId).toBe('none');
      expect(result.bestOverall.netSavingsInr).toBe(0);
    });
  });
});
