import {
  INDIAN_PAYMENT_INSTRUMENTS,
  DINING_AGGREGATORS,
  UPI_APPS,
  INDIAN_MERCHANTS,
  INSTRUMENT_MAP,
  MERCHANT_MAP,
  PaymentInstrument,
  SpendingCategory,
  PaymentEnvironment,
  MerchantDefinition,
} from '@/data/indianPaymentCatalog';
import { roundToPaise, formatINR, formatPercent } from '@/lib/utils';

export type PaymentStrategyType =
  | 'DIRECT_CARD'
  | 'DINING_AGGREGATOR'
  | 'INSTANT_VOUCHER'
  | 'RUPAY_UPI';

export interface UserWallet {
  ownedCardIds: string[];
  installedUpiAppIds: string[];
  activeMemberships: string[]; // e.g. ['SWIGGY_ONE', 'ZOMATO_GOLD', 'EAZYDINER_PRIME', 'TATA_NEUPASS']
  monthlyCapUsed: Record<string, number>; // cardId -> INR cashback/points value used
  targetMilestoneCards?: string[];
}

export interface QueryContext {
  merchantName: string;
  merchantId?: string;
  category: SpendingCategory;
  mccEstimate?: string;
  billAmount: number;
  paymentEnvironment: PaymentEnvironment;
  channelPreferences?: string[];
  notes?: string;
}

export interface PaymentPathway {
  id: string;
  title: string;
  strategyType: PaymentStrategyType;
  instrumentId: string;
  instrumentName: string;
  issuer: string;
  cardColor: {
    gradient: string;
    textColor: string;
    badgeColor: string;
  };
  aggregatorId?: string;
  aggregatorName?: string;
  voucherPortalId?: string;
  voucherPortalName?: string;
  upfrontDiscountInr: number;
  cardCashbackInr: number;
  rewardPointsEarned: number;
  rewardPointsValueInr: number;
  milestoneBonusInr: number;
  feesInr: number;
  netSavingsInr: number;
  netPayableInr: number;
  effectiveReturnRate: number; // e.g. 0.19 for 19%
  capRemainingBeforeInr: number;
  capRemainingAfterInr: number;
  isCapExhausted: boolean;
  steps: string[];
  mathBreakdown: string;
  comparisonNote: string;
  badgeLabel?: string;
}

export interface MissingCardInsight {
  cardId: string;
  cardName: string;
  pathway: PaymentPathway;
  extraSavingsInr: number;
  fomoMessage: string;
}

export interface OptimizationResult {
  queryContext: QueryContext;
  resolvedMerchant?: MerchantDefinition;
  bestOverall: PaymentPathway;
  bestDirect: PaymentPathway;
  milestonePick?: PaymentPathway;
  allWalletPathways: PaymentPathway[];
  missingCardOpportunity?: MissingCardInsight;
}

/**
 * Fuzzy/Normalized merchant resolution against Indian Merchant Knowledge Graph
 */
export function resolveMerchant(rawName: string): MerchantDefinition | undefined {
  if (!rawName) return undefined;
  const clean = rawName.trim().toLowerCase();

  // 1. Direct ID match
  const direct = MERCHANT_MAP.get(clean);
  if (direct) return direct;

  // 2. Exact or substring match in name and aliases
  for (const m of INDIAN_MERCHANTS) {
    if (m.name.toLowerCase() === clean) return m;
    for (const alias of m.aliases) {
      if (clean === alias || clean.includes(alias) || alias.includes(clean)) {
        return m;
      }
    }
  }

  return undefined;
}

/**
 * Default realistic Indian wallet for initial interactive load
 */
export const DEFAULT_USER_WALLET: UserWallet = {
  ownedCardIds: [
    'hdfc_regalia_gold',
    'sbi_cashback',
    'hsbc_live_plus',
    'tata_neu_infinity_rupay',
    'hdfc_swiggy',
  ],
  installedUpiAppIds: ['super_money', 'tata_neu_upi', 'gpay', 'phonepe'],
  activeMemberships: ['SWIGGY_ONE', 'TATA_NEUPASS'],
  monthlyCapUsed: {
    hsbc_live_plus: 0,
    sbi_cashback: 400,
    hdfc_swiggy: 150,
    hdfc_regalia_gold: 0,
    tata_neu_infinity_rupay: 0,
  },
  targetMilestoneCards: [],
};

export class RewardOptimizerEngine {
  /**
   * Main calculation entrypoint: Evaluates all 4 layers and outputs ranked pathways
   */
  public static optimize(
    wallet: UserWallet,
    query: QueryContext
  ): OptimizationResult {
    const billAmount = Math.max(0, query.billAmount);
    const resolvedMerchant = query.merchantId
      ? MERCHANT_MAP.get(query.merchantId)
      : resolveMerchant(query.merchantName);

    // Context adjustments based on merchant knowledge graph
    const effectiveCategory = resolvedMerchant?.primaryCategory || query.category;
    const effectiveMcc = resolvedMerchant?.mcc || query.mccEstimate || '0000';

    const effectiveQuery: QueryContext = {
      ...query,
      category: effectiveCategory,
      mccEstimate: effectiveMcc,
      billAmount,
    };

    // 1. Evaluate all pathways for user's active wallet
    const allWalletPathways = this.evaluateAllPathways(wallet, effectiveQuery, resolvedMerchant);

    // Sort descending by net savings INR
    allWalletPathways.sort((a, b) => b.netSavingsInr - a.netSavingsInr);

    // Fallback zero pathway if wallet has no eligible instruments
    const fallbackPathway: PaymentPathway = {
      id: 'fallback_zero',
      title: 'Standard Cash or Debit Payment',
      strategyType: 'DIRECT_CARD',
      instrumentId: 'none',
      instrumentName: 'Standard Payment',
      issuer: 'Bank',
      cardColor: {
        gradient: 'from-zinc-700 to-zinc-900',
        textColor: 'text-zinc-300',
        badgeColor: 'bg-zinc-800 text-zinc-400 border-zinc-700',
      },
      upfrontDiscountInr: 0,
      cardCashbackInr: 0,
      rewardPointsEarned: 0,
      rewardPointsValueInr: 0,
      milestoneBonusInr: 0,
      feesInr: 0,
      netSavingsInr: 0,
      netPayableInr: billAmount,
      effectiveReturnRate: 0,
      capRemainingBeforeInr: 0,
      capRemainingAfterInr: 0,
      isCapExhausted: false,
      steps: ['Pay standard bill amount using cash or standard UPI'],
      mathBreakdown: 'Zero rewards or cashback earned.',
      comparisonNote: 'No eligible reward cards or offers found.',
    };

    const bestOverall = allWalletPathways[0] || fallbackPathway;
    bestOverall.badgeLabel = '🏆 Best Overall Return';

    // Best Direct (1-Step: Direct Card Swipe or UPI QR Scan)
    const directPathways = allWalletPathways.filter(
      (p) => p.strategyType === 'DIRECT_CARD' || p.strategyType === 'RUPAY_UPI'
    );
    const bestDirect = directPathways[0] || bestOverall;
    if (bestDirect.id !== bestOverall.id) {
      bestDirect.badgeLabel = '⚡ Zero-Hassle (1-Step)';
    }

    // Milestone Pick (e.g. Amex Platinum Travel or designated milestone card)
    const milestonePathways = allWalletPathways.filter((p) => p.milestoneBonusInr > 0);
    const milestonePick = milestonePathways.length > 0 ? milestonePathways[0] : undefined;
    if (milestonePick && milestonePick.id !== bestOverall.id) {
      milestonePick.badgeLabel = '🎯 Milestone Booster';
    }

    // 2. Missing Card Opportunity (Simulate full Indian catalog to give FOMO insights)
    const missingCardOpportunity = this.findMissingCardOpportunity(
      wallet,
      effectiveQuery,
      resolvedMerchant,
      bestOverall.netSavingsInr
    );

    return {
      queryContext: effectiveQuery,
      resolvedMerchant,
      bestOverall,
      bestDirect,
      milestonePick,
      allWalletPathways,
      missingCardOpportunity,
    };
  }

  /**
   * Evaluate all 4 strategies for a specific wallet configuration
   */
  private static evaluateAllPathways(
    wallet: UserWallet,
    query: QueryContext,
    merchant?: MerchantDefinition
  ): PaymentPathway[] {
    const pathways: PaymentPathway[] = [];

    // Strategy A: Direct Card Swipe / Tap
    if (query.paymentEnvironment !== 'UPI_QR_ONLY') {
      for (const cardId of wallet.ownedCardIds) {
        const card = INSTRUMENT_MAP.get(cardId);
        if (!card) continue;
        const pathway = this.evaluateDirectCard(card, wallet, query, merchant);
        if (pathway) pathways.push(pathway);
      }
    }

    // Strategy B: Dining Aggregator Stacking (Double-Dip)
    if (
      query.category === 'DINING' &&
      query.paymentEnvironment !== 'UPI_QR_ONLY' &&
      (merchant?.supportsDiningApps !== false)
    ) {
      const diningPathways = this.evaluateDiningStacking(wallet, query, merchant);
      pathways.push(...diningPathways);
    }

    // Strategy C: Instant Gift Voucher Stacking (SmartBuy / GyFTR / Tata Neu)
    const canUseVouchers =
      merchant?.hasGiftVouchers !== false &&
      merchant?.id !== 'dmart' && // DMart has NO vouchers!
      merchant?.id !== 'zudio' &&
      merchant?.id !== 'haldirams';

    if (canUseVouchers) {
      const voucherPathways = this.evaluateVoucherStacking(wallet, query, merchant);
      pathways.push(...voucherPathways);
    }

    // Strategy D: RuPay on UPI & UPI SuperApps
    const upiPathways = this.evaluateUpiPathways(wallet, query, merchant);
    pathways.push(...upiPathways);

    return pathways;
  }

  // -----------------------------------------------------------------------
  // Strategy A: Direct Card Swipe
  // -----------------------------------------------------------------------
  private static evaluateDirectCard(
    card: PaymentInstrument,
    wallet: UserWallet,
    query: QueryContext,
    merchant?: MerchantDefinition
  ): PaymentPathway | null {
    const bill = query.billAmount;

    // Check MCC exclusions
    if (card.exclusions.includes(query.category)) {
      return {
        id: `direct_${card.id}`,
        title: `${card.name} (Direct Swipe)`,
        strategyType: 'DIRECT_CARD',
        instrumentId: card.id,
        instrumentName: card.name,
        issuer: card.issuer,
        cardColor: card.cardColor,
        upfrontDiscountInr: 0,
        cardCashbackInr: 0,
        rewardPointsEarned: 0,
        rewardPointsValueInr: 0,
        milestoneBonusInr: 0,
        feesInr: 0,
        netSavingsInr: 0,
        netPayableInr: bill,
        effectiveReturnRate: 0,
        capRemainingBeforeInr: 0,
        capRemainingAfterInr: 0,
        isCapExhausted: false,
        steps: [`Card excludes ${query.category}. No rewards earned.`],
        mathBreakdown: `Exclusion category: ${query.category} earns 0% reward points or cashback.`,
        comparisonNote: `Excluded category for ${card.name}.`,
      };
    }

    const currentCapUsed = wallet.monthlyCapUsed[card.id] || 0;
    let earnedCashback = 0;
    let earnedPoints = 0;
    let pointsValueInr = 0;
    let effectiveRate = card.baseRewardRate;
    let mathExplanation = '';
    let capRemainingBefore = 999999;
    let capRemainingAfter = 999999;
    let isCapExhausted = false;

    // Check accelerated category multipliers
    let matchedMultiplier = card.categoryMultipliers.find((m) => {
      // Environment filter: e.g. SBI Cashback online only
      if (m.isOnlineOnly && query.paymentEnvironment === 'OFFLINE_POS') return false;
      if (m.isOfflineOnly && query.paymentEnvironment === 'ONLINE') return false;

      // Brand filter
      if (m.brandIdentifiers && m.brandIdentifiers.length > 0) {
        const matchesBrand = m.brandIdentifiers.some(
          (b) =>
            merchant?.id.toUpperCase().includes(b) ||
            query.merchantName.toUpperCase().includes(b)
        );
        if (matchesBrand) return true;
      }

      // Category or MCC match
      const categoryMatch = m.categories.includes(query.category);
      const mccMatch = query.mccEstimate ? m.mccs.includes(query.mccEstimate) : false;
      return categoryMatch || mccMatch;
    });

    // Special case: SBI Cashback offline POS returns ONLY 1% base
    if (card.id === 'sbi_cashback' && query.paymentEnvironment === 'OFFLINE_POS') {
      matchedMultiplier = undefined; // Force base rate 1%
    }

    if (matchedMultiplier) {
      effectiveRate = matchedMultiplier.rewardRate;
      capRemainingBefore = Math.max(0, matchedMultiplier.monthlyCapInr - currentCapUsed);

      const potentialSavings = bill * effectiveRate;
      const actualSavings = Math.min(potentialSavings, capRemainingBefore);
      capRemainingAfter = Math.max(0, capRemainingBefore - actualSavings);
      isCapExhausted = actualSavings >= capRemainingBefore;

      // In case spend exceeds the cap, the remaining spend earns base reward
      let overflowBaseSavings = 0;
      if (isCapExhausted && potentialSavings > capRemainingBefore && effectiveRate > card.baseRewardRate) {
        const spendCovered = capRemainingBefore / effectiveRate;
        const uncoveredSpend = Math.max(0, bill - spendCovered);
        overflowBaseSavings = uncoveredSpend * card.baseRewardRate;
      }

      earnedCashback = roundToPaise(actualSavings + overflowBaseSavings);
      mathExplanation = `${formatPercent(effectiveRate)} accelerated rate applied (${matchedMultiplier.description}).`;
      if (isCapExhausted) {
        mathExplanation += ` Monthly cap reached: capped at ${formatINR(actualSavings)} + ${formatINR(overflowBaseSavings)} base on excess.`;
      }
    } else {
      // Standard base rate calculation
      if (card.pointValueInr === 1.0) {
        earnedCashback = roundToPaise(bill * card.baseRewardRate);
        mathExplanation = `Base reward rate of ${formatPercent(card.baseRewardRate)} applied (${formatINR(earnedCashback)} cashback).`;
      } else {
        pointsValueInr = roundToPaise(bill * card.baseRewardRate);
        earnedPoints = Math.round(pointsValueInr / card.pointValueInr);
        mathExplanation = `Base reward rate of ${formatPercent(card.baseRewardRate)} (~${earnedPoints} points worth ${formatINR(pointsValueInr)}).`;
      }
    }

    // Milestone bonus weight (e.g. Amex Platinum Travel)
    let milestoneBonusInr = 0;
    if (card.annualMilestoneBonus && wallet.targetMilestoneCards?.includes(card.id)) {
      milestoneBonusInr = roundToPaise(bill * card.annualMilestoneBonus.effectiveBonusWeight);
      mathExplanation += ` + ${formatINR(milestoneBonusInr)} pro-rated toward ₹4L milestone.`;
    }

    const netSavings = roundToPaise(earnedCashback + pointsValueInr + milestoneBonusInr);
    const netReturnRate = bill > 0 ? netSavings / bill : 0;

    return {
      id: `direct_${card.id}`,
      title: `${card.name} (Direct Swipe/Tap)`,
      strategyType: 'DIRECT_CARD',
      instrumentId: card.id,
      instrumentName: card.name,
      issuer: card.issuer,
      cardColor: card.cardColor,
      upfrontDiscountInr: 0,
      cardCashbackInr: earnedCashback,
      rewardPointsEarned: earnedPoints,
      rewardPointsValueInr: pointsValueInr,
      milestoneBonusInr,
      feesInr: 0,
      netSavingsInr: netSavings,
      netPayableInr: roundToPaise(bill - earnedCashback),
      effectiveReturnRate: netReturnRate,
      capRemainingBeforeInr: capRemainingBefore,
      capRemainingAfterInr: capRemainingAfter,
      isCapExhausted,
      steps: [
        `Swipe or tap your ${card.name} at the counter POS machine`,
        `Confirm transaction amount of ${formatINR(bill)}`,
        `Earn ${formatINR(netSavings)} (${formatPercent(netReturnRate)}) in rewards/cashback`,
      ],
      mathBreakdown: mathExplanation,
      comparisonNote: matchedMultiplier
        ? `${formatPercent(effectiveRate)} accelerated category return`
        : `Base reward rate ${formatPercent(card.baseRewardRate)}`,
    };
  }

  // -----------------------------------------------------------------------
  // Strategy B: Dining Aggregator Double-Dip
  // -----------------------------------------------------------------------
  private static evaluateDiningStacking(
    wallet: UserWallet,
    query: QueryContext,
    merchant?: MerchantDefinition
  ): PaymentPathway[] {
    const pathways: PaymentPathway[] = [];
    const bill = query.billAmount;

    for (const aggregator of DINING_AGGREGATORS) {
      // If merchant has explicit dining apps listed, verify inclusion
      if (merchant?.diningAppIds && !merchant.diningAppIds.includes(aggregator.id)) {
        continue;
      }

      // Upfront table/bill discount
      const upfrontDiscount = roundToPaise(bill * aggregator.typicalBaseDiscount);
      const netBillPayable = Math.max(0, bill - upfrontDiscount);

      // Test all owned cards on this aggregator to find card cashback
      for (const cardId of wallet.ownedCardIds) {
        const card = INSTRUMENT_MAP.get(cardId);
        if (!card) continue;

        let cardRate = card.baseRewardRate;
        const currentCapUsed = wallet.monthlyCapUsed[card.id] || 0;

        // Check if card has a partner boost on this aggregator
        const boost = aggregator.partnerCardBoosts.find((b) => b.cardId === card.id);
        if (boost) {
          cardRate = boost.extraCashbackRate;
        } else if (card.id === 'hsbc_live_plus') {
          // HSBC Live+ treats dining apps as MCC 5812 (10%)
          cardRate = 0.10;
        } else if (card.id === 'sbi_cashback') {
          // SBI Cashback treats online dining app payments as online 5%
          cardRate = 0.05;
        }

        const maxCap = boost?.monthlyCapInr || 1500;
        const capRemaining = Math.max(0, maxCap - currentCapUsed);
        const cardCashback = roundToPaise(Math.min(netBillPayable * cardRate, capRemaining));

        const netSavings = roundToPaise(upfrontDiscount + cardCashback);
        const netReturnRate = bill > 0 ? netSavings / bill : 0;

        pathways.push({
          id: `dining_${aggregator.id}_${card.id}`,
          title: `Double-Dip: ${aggregator.name} + ${card.name}`,
          strategyType: 'DINING_AGGREGATOR',
          instrumentId: card.id,
          instrumentName: card.name,
          issuer: card.issuer,
          cardColor: card.cardColor,
          aggregatorId: aggregator.id,
          aggregatorName: aggregator.name,
          upfrontDiscountInr: upfrontDiscount,
          cardCashbackInr: cardCashback,
          rewardPointsEarned: 0,
          rewardPointsValueInr: 0,
          milestoneBonusInr: 0,
          feesInr: 0,
          netSavingsInr: netSavings,
          netPayableInr: roundToPaise(bill - netSavings),
          effectiveReturnRate: netReturnRate,
          capRemainingBeforeInr: capRemaining,
          capRemainingAfterInr: Math.max(0, capRemaining - cardCashback),
          isCapExhausted: cardCashback >= capRemaining,
          steps: [
            `Step 1: Open the ${aggregator.name} app while at ${merchant?.name || query.merchantName}`,
            `Step 2: Tap "Pay Bill" and enter the total bill amount of ${formatINR(bill)}`,
            `Step 3: Instant table discount applied automatically: -${formatINR(upfrontDiscount)} (${formatPercent(aggregator.typicalBaseDiscount)})`,
            `Step 4: Pay the balance ${formatINR(netBillPayable)} using ${card.name} to earn ${formatINR(cardCashback)} extra cashback`,
          ],
          mathBreakdown: `Instant Discount: ${formatINR(upfrontDiscount)} + Card Cashback: ${formatINR(cardCashback)} = Total Saved: ${formatINR(netSavings)} (${formatPercent(netReturnRate)})`,
          comparisonNote: `Stacking ${aggregator.name} ${formatPercent(aggregator.typicalBaseDiscount)} discount with ${card.name}`,
        });
      }
    }

    return pathways;
  }

  // -----------------------------------------------------------------------
  // Strategy C: Instant Gift Voucher Stacking (SmartBuy GyFTR / Tata Neu)
  // -----------------------------------------------------------------------
  private static evaluateVoucherStacking(
    wallet: UserWallet,
    query: QueryContext,
    merchant?: MerchantDefinition
  ): PaymentPathway[] {
    const pathways: PaymentPathway[] = [];
    const bill = query.billAmount;

    for (const cardId of wallet.ownedCardIds) {
      const card = INSTRUMENT_MAP.get(cardId);
      if (!card || !card.voucherOffers || card.voucherOffers.length === 0) continue;

      for (const offer of card.voucherOffers) {
        // Verify category eligibility
        if (!offer.eligibleCategories.includes(query.category)) continue;

        // Verify brand availability if merchant is specified
        if (merchant?.voucherBrands && merchant.voucherBrands.length > 0) {
          const supported = merchant.voucherBrands.some((b) =>
            offer.supportedBrands.includes(b)
          );
          if (!supported) continue;
        }

        const convenienceFeeRate =
          merchant?.voucherConvenienceFeeRate !== undefined
            ? merchant.voucherConvenienceFeeRate
            : offer.voucherConvenienceFeeRate || 0;
        const feeInr = roundToPaise(bill * convenienceFeeRate);
        const grossReturnRate = offer.multiplierRate;
        const grossSavings = roundToPaise(bill * grossReturnRate);
        const netSavings = roundToPaise(grossSavings - feeInr);
        const netReturnRate = bill > 0 ? netSavings / bill : 0;

        pathways.push({
          id: `voucher_${offer.portalId}_${card.id}`,
          title: `Voucher Trick: ${offer.portalName} via ${card.name}`,
          strategyType: 'INSTANT_VOUCHER',
          instrumentId: card.id,
          instrumentName: card.name,
          issuer: card.issuer,
          cardColor: card.cardColor,
          voucherPortalId: offer.portalId,
          voucherPortalName: offer.portalName,
          upfrontDiscountInr: 0,
          cardCashbackInr: 0,
          rewardPointsEarned: Math.round(grossSavings / card.pointValueInr),
          rewardPointsValueInr: grossSavings,
          milestoneBonusInr: 0,
          feesInr: feeInr,
          netSavingsInr: netSavings,
          netPayableInr: roundToPaise(bill + feeInr),
          effectiveReturnRate: netReturnRate,
          capRemainingBeforeInr: offer.monthlyBonusCapInr || 15000,
          capRemainingAfterInr: Math.max(0, (offer.monthlyBonusCapInr || 15000) - grossSavings),
          isCapExhausted: false,
          steps: [
            `Step 1: Open ${offer.portalName} on your phone while standing at the billing counter`,
            `Step 2: Purchase a ₹${bill} brand e-voucher for ${merchant?.name || query.merchantName} using your ${card.name}`,
            `Step 3: Instant e-voucher code & PIN delivered to your SMS/WhatsApp within 30 seconds`,
            `Step 4: Have the cashier scan/enter the voucher code to settle the bill. You earn ${formatINR(netSavings)} in accelerated reward points!`,
          ],
          mathBreakdown: `${formatPercent(grossReturnRate)} accelerated rewards (${formatINR(grossSavings)}) - Convenience fee (${formatINR(feeInr)}) = Net ${formatINR(netSavings)} (${formatPercent(netReturnRate)})`,
          comparisonNote: `Accelerated 5X/10X voucher portal stacking`,
        });
      }
    }

    return pathways;
  }

  // -----------------------------------------------------------------------
  // Strategy D: RuPay on UPI & UPI SuperApps
  // -----------------------------------------------------------------------
  private static evaluateUpiPathways(
    wallet: UserWallet,
    query: QueryContext,
    merchant?: MerchantDefinition
  ): PaymentPathway[] {
    const pathways: PaymentPathway[] = [];
    const bill = query.billAmount;

    // 1. RuPay Credit Cards on UPI
    const rupayCards = wallet.ownedCardIds
      .map((id) => INSTRUMENT_MAP.get(id))
      .filter((card): card is PaymentInstrument => Boolean(card?.type === 'RUPAY_UPI_CREDIT_CARD'));

    for (const rupayCard of rupayCards) {
      let rewardRate = rupayCard.baseRewardRate;
      let note = `${formatPercent(rewardRate)} assured cashback on UPI QR Scan & Pay`;

      // Tata Neu Infinity special Tata brand boost
      if (
        rupayCard.id === 'tata_neu_infinity_rupay' &&
        merchant?.supportsTataNeuDirect
      ) {
        rewardRate = 0.10; // 10% on Tata brands (Westside, Croma, BigBasket, Taj)
        note = `10% NeuCoins on Tata brand via Tata Neu UPI`;
      }

      const netSavings = roundToPaise(bill * rewardRate);
      const netReturnRate = bill > 0 ? netSavings / bill : 0;

      pathways.push({
        id: `upi_rupay_${rupayCard.id}`,
        title: `Scan & Pay: ${rupayCard.name} (RuPay UPI)`,
        strategyType: 'RUPAY_UPI',
        instrumentId: rupayCard.id,
        instrumentName: rupayCard.name,
        issuer: rupayCard.issuer,
        cardColor: rupayCard.cardColor,
        upfrontDiscountInr: 0,
        cardCashbackInr: netSavings,
        rewardPointsEarned: 0,
        rewardPointsValueInr: 0,
        milestoneBonusInr: 0,
        feesInr: 0,
        netSavingsInr: netSavings,
        netPayableInr: roundToPaise(bill - netSavings),
        effectiveReturnRate: netReturnRate,
        capRemainingBeforeInr: 1500,
        capRemainingAfterInr: Math.max(0, 1500 - netSavings),
        isCapExhausted: false,
        steps: [
          `Step 1: Ask the counter staff for the merchant UPI QR Code (BharatPe/Paytm/GPay)`,
          `Step 2: Scan using Tata Neu, Kiwi, or Google Pay app`,
          `Step 3: Select your linked ${rupayCard.name} as the payment account to complete payment of ${formatINR(bill)}`,
        ],
        mathBreakdown: `${formatPercent(rewardRate)} return = ${formatINR(netSavings)} cashback credited to your account`,
        comparisonNote: note,
      });
    }

    // 2. UPI SuperApps (Super.money, CRED UPI)
    for (const app of UPI_APPS) {
      if (!wallet.installedUpiAppIds.includes(app.id)) continue;

      const netSavings = roundToPaise(bill * app.averageRewardRate);
      const netReturnRate = bill > 0 ? netSavings / bill : 0;

      pathways.push({
        id: `upi_app_${app.id}`,
        title: `Scan via ${app.name}`,
        strategyType: 'RUPAY_UPI',
        instrumentId: app.id,
        instrumentName: app.name,
        issuer: 'UPI',
        cardColor: {
          gradient: 'from-emerald-800 to-teal-950',
          textColor: 'text-emerald-200',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
        },
        upfrontDiscountInr: 0,
        cardCashbackInr: netSavings,
        rewardPointsEarned: 0,
        rewardPointsValueInr: 0,
        milestoneBonusInr: 0,
        feesInr: 0,
        netSavingsInr: netSavings,
        netPayableInr: roundToPaise(bill - netSavings),
        effectiveReturnRate: netReturnRate,
        capRemainingBeforeInr: 500,
        capRemainingAfterInr: Math.max(0, 500 - netSavings),
        isCapExhausted: false,
        steps: [
          `Step 1: Scan merchant QR using ${app.name}`,
          `Step 2: Pay ₹${bill} directly via bank account`,
          `Step 3: Earn ${app.specialPerk}`,
        ],
        mathBreakdown: `Estimated ${formatPercent(app.averageRewardRate)} return = ${formatINR(netSavings)}`,
        comparisonNote: app.specialPerk,
      });
    }

    return pathways;
  }

  // -----------------------------------------------------------------------
  // Missing Card Opportunity (FOMO Engine)
  // -----------------------------------------------------------------------
  private static findMissingCardOpportunity(
    wallet: UserWallet,
    query: QueryContext,
    merchant: MerchantDefinition | undefined,
    currentBestSavings: number
  ): MissingCardInsight | undefined {
    // Collect all cards in master catalog not currently owned
    const unownedCards = INDIAN_PAYMENT_INSTRUMENTS.filter(
      (c) => !wallet.ownedCardIds.includes(c.id)
    );

    let bestMissingPathway: PaymentPathway | undefined;
    let highestSavings = currentBestSavings;

    for (const card of unownedCards) {
      // Create a test wallet with this card added
      const testWallet: UserWallet = {
        ...wallet,
        ownedCardIds: [card.id],
        monthlyCapUsed: {},
      };

      const pathways = this.evaluateAllPathways(testWallet, query, merchant);
      for (const p of pathways) {
        if (p.netSavingsInr > highestSavings) {
          highestSavings = p.netSavingsInr;
          bestMissingPathway = p;
        }
      }
    }

    if (!bestMissingPathway) return undefined;

    const extraSavings = roundToPaise(bestMissingPathway.netSavingsInr - currentBestSavings);
    if (extraSavings <= 10) return undefined; // Ignore trivial differences

    return {
      cardId: bestMissingPathway.instrumentId,
      cardName: bestMissingPathway.instrumentName,
      pathway: bestMissingPathway,
      extraSavingsInr: extraSavings,
      fomoMessage: `If you had the ${bestMissingPathway.instrumentName} in your wallet, you would save an extra ${formatINR(extraSavings)} (${formatPercent(bestMissingPathway.effectiveReturnRate)}) at ${merchant?.name || query.merchantName} today!`,
    };
  }
}
