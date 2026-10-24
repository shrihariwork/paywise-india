/**
 * PayWise India — Indian Payment Catalog & Knowledge Graph
 * Provides strongly-typed models, 60 credit/RuPay cards, dining aggregators, UPI apps,
 * and merchant knowledge graph with MCC mappings.
 */

import {
  INDIAN_CARDS_60_CATALOG,
  CardProductRule,
} from './indian-cards-catalog';

export type SpendingCategory =
  | 'GROCERY'
  | 'DINING'
  | 'FOOD_DELIVERY'
  | 'SHOPPING'
  | 'MOVIES'
  | 'TRAVEL'
  | 'UTILITIES'
  | 'FUEL'
  | 'RENT'
  | 'JEWELLERY'
  | 'WALLET_LOAD'
  | 'PEER_TO_PEER'
  | 'INSURANCE'
  | 'GENERAL';

export type PaymentNetwork = 'Visa' | 'Mastercard' | 'RuPay' | 'Amex' | 'DinersClub';

export type PaymentInstrumentType =
  | 'CREDIT_CARD'
  | 'RUPAY_UPI_CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'UPI_APP';

export type PaymentEnvironment = 'OFFLINE_POS' | 'ONLINE' | 'UPI_QR_ONLY';

export interface CategoryMultiplier {
  categories: SpendingCategory[];
  mccs: string[];
  rewardRate: number; // e.g. 0.10 for 10%
  monthlyCapInr: number; // Maximum cashback or point equivalent value per month
  minTxnInr?: number;
  isOnlineOnly?: boolean;
  isOfflineOnly?: boolean;
  brandIdentifiers?: string[];
  description: string;
}

export interface VoucherPortalOffer {
  portalId: string;
  portalName: string;
  multiplierRate: number; // e.g. 0.165 for 16.5% on Infinia
  monthlyBonusCapInr?: number; // e.g. 15000 for Infinia SmartBuy
  voucherConvenienceFeeRate?: number; // e.g. 0.025 + GST = 0.0295
  eligibleCategories: SpendingCategory[];
  supportedBrands: string[];
}

export interface PaymentInstrument {
  id: string;
  name: string;
  issuer: string;
  network: PaymentNetwork;
  type: PaymentInstrumentType;
  upiEnabled: boolean;
  baseRewardRate: number; // e.g. 0.033 for 3.3%
  pointValueInr: number; // Real-world INR conversion value per point
  categoryMultipliers: CategoryMultiplier[];
  voucherOffers?: VoucherPortalOffer[];
  exclusions: SpendingCategory[];
  annualMilestoneBonus?: {
    targetSpendInr: number;
    bonusValueInr: number;
    effectiveBonusWeight: number; // e.g. 0.06
    description: string;
  };
  bogoOffer?: {
    platform: 'BOOKMYSHOW' | 'PVR';
    maxDiscountPerTicketInr: number;
    monthlyTimesLimit: number;
  };
  cardColor: {
    gradient: string;
    textColor: string;
    badgeColor: string;
  };
  keyPerks: string[];
}

export interface DiningAggregatorChannel {
  id: string;
  name: string;
  category: 'DINING' | 'RESTAURANT';
  typicalBaseDiscount: number; // e.g. 0.12 (12% upfront bill discount)
  partnerCardBoosts: {
    cardId: string;
    extraCashbackRate: number;
    monthlyCapInr: number;
    description: string;
  }[];
}

export interface UpiApp {
  id: string;
  name: string;
  description: string;
  averageRewardRate: number; // e.g. 0.01 to 0.03
  rewardType: 'CASHBACK' | 'COINS' | 'SCRATCH_CARD';
  rupayCreditCardSupport: boolean;
  minTxnForRewardInr: number;
  specialPerk: string;
}

export interface MerchantDefinition {
  id: string;
  name: string;
  aliases: string[];
  primaryCategory: SpendingCategory;
  mcc: string;
  supportedEnvironments: PaymentEnvironment[];
  hasGiftVouchers: boolean;
  voucherBrands?: string[]; // Brand vouchers accepted, e.g. ['LIFESTYLE', 'SHOPPERS_STOP']
  voucherConvenienceFeeRate?: number;
  supportsDiningApps: boolean;
  diningAppIds?: string[];
  supportsTataNeuDirect: boolean;
  mccInsight: string;
  hackTip: string;
}

// -------------------------------------------------------------------------
// SPECIALIZED VOUCHER & MILESTONE CONFIGURATIONS
// -------------------------------------------------------------------------
const SPECIAL_VOUCHER_OFFERS: Record<string, VoucherPortalOffer[]> = {
  'hdfc-infinia': [
    {
      portalId: 'hdfc_smartbuy_gyftr',
      portalName: 'HDFC SmartBuy GyFTR',
      multiplierRate: 0.165,
      monthlyBonusCapInr: 15000,
      voucherConvenienceFeeRate: 0.025,
      eligibleCategories: ['DINING', 'SHOPPING', 'MOVIES', 'GROCERY'],
      supportedBrands: [
        'LIFESTYLE',
        'SHOPPERS_STOP',
        'WESTSIDE',
        'CROMA',
        'PVR',
        'CINEPOLIS',
        'MAINLAND_CHINA',
        'BARBEQUE_NATION',
        'DECATHLON',
        'BATA',
        'STARBUCKS',
        'MCDONALDS',
        'MORE_RETAIL',
        'RELIANCE_SMART',
        'MAKEMYTRIP',
      ],
    },
  ],
  'hdfc-dcb-metal': [
    {
      portalId: 'hdfc_smartbuy_gyftr',
      portalName: 'HDFC SmartBuy GyFTR',
      multiplierRate: 0.165,
      monthlyBonusCapInr: 10000,
      voucherConvenienceFeeRate: 0.025,
      eligibleCategories: ['DINING', 'SHOPPING', 'MOVIES', 'GROCERY'],
      supportedBrands: [
        'LIFESTYLE',
        'SHOPPERS_STOP',
        'WESTSIDE',
        'CROMA',
        'PVR',
        'CINEPOLIS',
        'MAINLAND_CHINA',
        'BARBEQUE_NATION',
        'DECATHLON',
      ],
    },
  ],
  'hdfc-regalia-gold': [
    {
      portalId: 'hdfc_smartbuy_gyftr',
      portalName: 'HDFC SmartBuy GyFTR',
      multiplierRate: 0.0665,
      monthlyBonusCapInr: 4000,
      voucherConvenienceFeeRate: 0.025,
      eligibleCategories: ['DINING', 'SHOPPING', 'MOVIES', 'GROCERY'],
      supportedBrands: [
        'LIFESTYLE',
        'SHOPPERS_STOP',
        'WESTSIDE',
        'CROMA',
        'PVR',
        'DECATHLON',
        'RELIANCE_DIGITAL',
        'MORE_RETAIL',
        'RELIANCE_SMART',
      ],
    },
  ],
  'sbi-cashback': [
    {
      portalId: 'amazon_maximize',
      portalName: 'Amazon / Maximize Vouchers',
      multiplierRate: 0.05,
      monthlyBonusCapInr: 5000,
      voucherConvenienceFeeRate: 0.0,
      eligibleCategories: ['SHOPPING', 'MOVIES', 'DINING'],
      supportedBrands: ['LIFESTYLE', 'SHOPPERS_STOP', 'PVR', 'CINEPOLIS', 'DECATHLON'],
    },
  ],
  'hdfc-tataneu-infinity': [
    {
      portalId: 'tata_neu_vouchers',
      portalName: 'Tata Neu Brand Vouchers',
      multiplierRate: 0.10,
      monthlyBonusCapInr: 5000,
      voucherConvenienceFeeRate: 0.0,
      eligibleCategories: ['SHOPPING', 'GROCERY', 'TRAVEL'],
      supportedBrands: ['WESTSIDE', 'CROMA', 'BIGBASKET', 'TAJ_HOTELS'],
    },
  ],
};

const SPECIAL_MILESTONES: Record<
  string,
  { targetSpendInr: number; bonusValueInr: number; effectiveBonusWeight: number; description: string }
> = {
  'amex-plat-travel': {
    targetSpendInr: 400000,
    bonusValueInr: 32000,
    effectiveBonusWeight: 0.06,
    description: '40,000 MR points + ₹10,000 Taj Stay voucher on reaching ₹4 Lakh annual spend (~8% total return)',
  },
  'axis-atlas': {
    targetSpendInr: 750000,
    bonusValueInr: 20000,
    effectiveBonusWeight: 0.026,
    description: 'Tier milestone bonus: 10,000 extra Edge Miles on crossing spend tiers',
  },
};

const SPECIAL_BOGO: Record<
  string,
  { platform: 'BOOKMYSHOW' | 'PVR'; maxDiscountPerTicketInr: number; monthlyTimesLimit: number }
> = {
  'kotak-pvr-inox': {
    platform: 'PVR',
    maxDiscountPerTicketInr: 400,
    monthlyTimesLimit: 1,
  },
  'icici-emeralde-metal': {
    platform: 'BOOKMYSHOW',
    maxDiscountPerTicketInr: 750,
    monthlyTimesLimit: 2,
  },
  'indusind-legend': {
    platform: 'BOOKMYSHOW',
    maxDiscountPerTicketInr: 200,
    monthlyTimesLimit: 3,
  },
};

/**
 * Converts a CardProductRule from the 60-card catalog into the engine-compatible PaymentInstrument
 */
export function convertCardRuleToPaymentInstrument(card: CardProductRule): PaymentInstrument {
  const networkMap: Record<string, PaymentNetwork> = {
    VISA: 'Visa',
    MASTERCARD: 'Mastercard',
    RUPAY: 'RuPay',
    DINERS: 'DinersClub',
    AMEX: 'Amex',
  };

  const categoryMultipliers: CategoryMultiplier[] = card.categoryAccelerators.map((acc) => {
    const categories: SpendingCategory[] = [];
    const text = (acc.categoryOrMerchant + ' ' + (acc.description || '')).toUpperCase();

    if (text.includes('GROCERY') || text.includes('SUPERMARKET') || acc.mccs.includes('5411')) {
      categories.push('GROCERY');
    }
    if (text.includes('DINING') || text.includes('RESTAURANT') || acc.mccs.includes('5812') || acc.mccs.includes('5814')) {
      categories.push('DINING');
    }
    if (text.includes('FOOD DELIVERY') || text.includes('SWIGGY') || text.includes('ZOMATO')) {
      categories.push('FOOD_DELIVERY');
    }
    if (text.includes('SHOPPING') || text.includes('MYNTRA') || text.includes('AMAZON') || text.includes('FLIPKART') || acc.mccs.includes('5311')) {
      categories.push('SHOPPING');
    }
    if (text.includes('MOVIE') || text.includes('PVR') || text.includes('BOOKMYSHOW') || acc.mccs.includes('7832')) {
      categories.push('MOVIES');
    }
    if (text.includes('TRAVEL') || text.includes('AIRLINE') || text.includes('HOTEL') || acc.mccs.includes('4511') || acc.mccs.includes('7011')) {
      categories.push('TRAVEL');
    }
    if (
      text.includes('UTILITY') ||
      text.includes('RECHARGE') ||
      text.includes('ELECTRICITY') ||
      text.includes('PHONEPE') ||
      text.includes('AIRTEL') ||
      text.includes('BILL') ||
      acc.mccs.includes('4814') ||
      acc.mccs.includes('4900')
    ) {
      categories.push('UTILITIES');
    }
    if (
      text.includes('FUEL') ||
      text.includes('PETROL') ||
      text.includes('IOCL') ||
      text.includes('BPCL') ||
      text.includes('HPCL') ||
      acc.mccs.includes('5541') ||
      acc.mccs.includes('5542')
    ) {
      categories.push('FUEL');
    }
    if (categories.length === 0) {
      categories.push('GENERAL');
    }

    return {
      categories,
      mccs: acc.mccs,
      rewardRate: acc.effectiveYieldBps / 10000,
      monthlyCapInr: acc.monthlyCapInr || 999999,
      minTxnInr: acc.minTransactionInr,
      isOnlineOnly: acc.isOnlineOnly,
      isOfflineOnly: acc.isOfflineOnly,
      brandIdentifiers: [card.slug.toUpperCase(), card.issuer.toUpperCase()],
      description: acc.description || `${acc.effectiveYieldBps / 100}% on ${acc.categoryOrMerchant}`,
    };
  });

  return {
    id: card.slug,
    name: card.name,
    issuer: card.issuer,
    network: networkMap[card.network] || 'Visa',
    type: card.upiLinkable ? 'RUPAY_UPI_CREDIT_CARD' : 'CREDIT_CARD',
    upiEnabled: card.upiLinkable,
    baseRewardRate: card.baseRewardRateBps / 10000,
    pointValueInr: card.pointValueInr,
    categoryMultipliers,
    voucherOffers: SPECIAL_VOUCHER_OFFERS[card.slug],
    annualMilestoneBonus: SPECIAL_MILESTONES[card.slug],
    bogoOffer: SPECIAL_BOGO[card.slug],
    exclusions: (card.exclusions as SpendingCategory[]) || ['RENT', 'WALLET_LOAD'],
    cardColor: card.cardColor,
    keyPerks: card.keyPerks,
  };
}

// -------------------------------------------------------------------------
// 1. ALL 60 INDIAN CREDIT & RUPAY UPI CARDS
// -------------------------------------------------------------------------
export const INDIAN_PAYMENT_INSTRUMENTS: PaymentInstrument[] = INDIAN_CARDS_60_CATALOG.map(
  convertCardRuleToPaymentInstrument
);

// -------------------------------------------------------------------------
// 2. DINING AGGREGATOR CHANNELS (DOUBLE-DIP STACKING)
// -------------------------------------------------------------------------
export const DINING_AGGREGATORS: DiningAggregatorChannel[] = [
  {
    id: 'swiggy_dineout',
    name: 'Swiggy Dineout',
    category: 'DINING',
    typicalBaseDiscount: 0.12, // 12% average restaurant bill discount
    partnerCardBoosts: [
      {
        cardId: 'hdfc-swiggy',
        extraCashbackRate: 0.10,
        monthlyCapInr: 1500,
        description: '10% cashback on total Dineout bill via HDFC Swiggy Card',
      },
      {
        cardId: 'hsbc-live-plus',
        extraCashbackRate: 0.10,
        monthlyCapInr: 1000,
        description: '10% dining cashback on Dineout transaction (MCC 5812)',
      },
      {
        cardId: 'axis-airtel',
        extraCashbackRate: 0.10,
        monthlyCapInr: 500,
        description: '10% cashback on Swiggy Dineout via Airtel Axis',
      },
      {
        cardId: 'sbi-cashback',
        extraCashbackRate: 0.05,
        monthlyCapInr: 5000,
        description: '5% online cashback on Dineout in-app payment',
      },
      {
        cardId: 'yes-paisasave',
        extraCashbackRate: 0.06,
        monthlyCapInr: 600,
        description: '6% dining cashback via Yes Bank PaisaSave',
      },
      {
        cardId: 'axis-myzone',
        extraCashbackRate: 0.24, // Flat ₹120 off min ₹500
        monthlyCapInr: 480,
        description: 'Up to ₹120 flat discount 4x a month with code AXISMYZONE',
      },
    ],
  },
  {
    id: 'zomato_dining',
    name: 'Zomato District / Dining',
    category: 'DINING',
    typicalBaseDiscount: 0.10, // 10% average restaurant bill discount
    partnerCardBoosts: [
      {
        cardId: 'hsbc-live-plus',
        extraCashbackRate: 0.10,
        monthlyCapInr: 1000,
        description: '10% dining cashback on Zomato Pay bill',
      },
      {
        cardId: 'axis-airtel',
        extraCashbackRate: 0.10,
        monthlyCapInr: 500,
        description: '10% cashback on Zomato platform via Airtel Axis',
      },
      {
        cardId: 'axis-neo',
        extraCashbackRate: 0.40,
        monthlyCapInr: 240,
        description: '40% off on Zomato up to ₹120 twice a month with code AXISNEO',
      },
      {
        cardId: 'yes-paisasave',
        extraCashbackRate: 0.06,
        monthlyCapInr: 600,
        description: '6% dining cashback via Yes Bank PaisaSave',
      },
      {
        cardId: 'sbi-cashback',
        extraCashbackRate: 0.05,
        monthlyCapInr: 5000,
        description: '5% online cashback paying Zomato Pay via app',
      },
    ],
  },
  {
    id: 'eazydiner_prime',
    name: 'EazyDiner Prime',
    category: 'DINING',
    typicalBaseDiscount: 0.25, // 25% table discount for Prime members
    partnerCardBoosts: [
      {
        cardId: 'indusind-eazydiner',
        extraCashbackRate: 0.25,
        monthlyCapInr: 2000,
        description: '25% extra instant discount up to ₹1,000 twice a month on PayEazy',
      },
      {
        cardId: 'indusind-eazydiner-plat',
        extraCashbackRate: 0.20,
        monthlyCapInr: 1000,
        description: '20% extra instant discount up to ₹500 via PayEazy',
      },
      {
        cardId: 'hsbc-live-plus',
        extraCashbackRate: 0.10,
        monthlyCapInr: 1000,
        description: '10% cashback on food and dining spends',
      },
      {
        cardId: 'yes-paisasave',
        extraCashbackRate: 0.06,
        monthlyCapInr: 600,
        description: '6% dining cashback via Yes Bank PaisaSave',
      },
      {
        cardId: 'sbi-cashback',
        extraCashbackRate: 0.05,
        monthlyCapInr: 5000,
        description: '5% cashback on in-app PayEazy payment',
      },
    ],
  },
];

// -------------------------------------------------------------------------
// 3. UPI APPS CATALOG
// -------------------------------------------------------------------------
export const UPI_APPS: UpiApp[] = [
  {
    id: 'super_money',
    name: 'Super.money UPI',
    description: 'Up to 5% assured cashback on merchant QR scan & pay transactions',
    averageRewardRate: 0.03, // ~3% average effective return
    rewardType: 'CASHBACK',
    rupayCreditCardSupport: true,
    minTxnForRewardInr: 50,
    specialPerk: 'Direct instant bank cashback on small and medium merchant QRs',
  },
  {
    id: 'cred_upi',
    name: 'CRED UPI',
    description: 'Earn CRED Coins and dynamic cashbacks on merchant QR payments',
    averageRewardRate: 0.015,
    rewardType: 'CASHBACK',
    rupayCreditCardSupport: true,
    minTxnForRewardInr: 100,
    specialPerk: 'CRED claim drops and bonus merchant coupons',
  },
  {
    id: 'tata_neu_upi',
    name: 'Tata Neu UPI',
    description: '1.5% NeuCoins on RuPay Scan & Pay, bonus on Tata merchants',
    averageRewardRate: 0.015,
    rewardType: 'COINS',
    rupayCreditCardSupport: true,
    minTxnForRewardInr: 50,
    specialPerk: 'Direct NeuCoins crediting into unified Tata ecosystem wallet',
  },
  {
    id: 'gpay',
    name: 'Google Pay',
    description: 'Scratch cards and periodic festival merchant rewards',
    averageRewardRate: 0.005,
    rewardType: 'SCRATCH_CARD',
    rupayCreditCardSupport: true,
    minTxnForRewardInr: 100,
    specialPerk: 'Supports RuPay credit cards on UPI seamlessly',
  },
  {
    id: 'phonepe',
    name: 'PhonePe',
    description: 'Widespread Indian merchant acceptance with RuPay card support',
    averageRewardRate: 0.005,
    rewardType: 'SCRATCH_CARD',
    rupayCreditCardSupport: true,
    minTxnForRewardInr: 100,
    specialPerk: 'High success rate on all Bharat QR and merchant terminals',
  },
];

// -------------------------------------------------------------------------
// 4. MERCHANT KNOWLEDGE GRAPH (INDIAN MERCHANTS & MCC RULES)
// -------------------------------------------------------------------------
export const INDIAN_MERCHANTS: MerchantDefinition[] = [
  // Supermarkets & Groceries
  {
    id: 'dmart',
    name: 'DMart (Avenue Supermarts)',
    aliases: ['dmart', 'd mart', 'avenue supermarts', 'dmart ready'],
    primaryCategory: 'GROCERY',
    mcc: '5411', // Grocery stores, Supermarkets
    supportedEnvironments: ['OFFLINE_POS', 'UPI_QR_ONLY'],
    hasGiftVouchers: false, // DMart has NO GyFTR/SmartBuy vouchers!
    voucherBrands: [],
    supportsDiningApps: false,
    supportsTataNeuDirect: false,
    mccInsight: 'Codes strictly as MCC 5411 (Grocery/Supermarket) on offline POS swipe machines.',
    hackTip: 'DMart does NOT accept GyFTR vouchers and does NOT give 5% on SBI Cashback (offline POS gives only 1%). Best card is HSBC Live+ (10% cashback up to ₹1,000/mo), Federal Paisaback (7.5%), IDFC Power+ (5%), RBL ShopRite (5%), or RuPay UPI cards.',
  },
  {
    id: 'reliance_smart',
    name: 'Reliance Smart / Fresh / Signature',
    aliases: ['reliance smart', 'reliance fresh', 'reliance smart bazaar', 'reliance retail', 'smart bazaar'],
    primaryCategory: 'GROCERY',
    mcc: '5411',
    supportedEnvironments: ['OFFLINE_POS', 'ONLINE'],
    hasGiftVouchers: true,
    voucherBrands: ['RELIANCE_SMART'],
    voucherConvenienceFeeRate: 0.0,
    supportsDiningApps: false,
    supportsTataNeuDirect: false,
    mccInsight: 'Codes as MCC 5411. Also accepts Reliance Retail and JioMart gift vouchers.',
    hackTip: 'Buy Reliance gift vouchers on SmartBuy using Infinia (16.5%) or Regalia Gold (6.65%), or swipe HSBC Live+ (10%), Federal Paisaback (7.5%), IDFC Power+ (5%), or RBL ShopRite (5%).',
  },
  {
    id: 'lulu_hypermarket',
    name: 'LuLu Hypermarket & Supermarket',
    aliases: ['lulu', 'lulu hypermarket', 'lulu supermarket', 'lulu mall', 'lulu international'],
    primaryCategory: 'GROCERY',
    mcc: '5411',
    supportedEnvironments: ['OFFLINE_POS', 'ONLINE'],
    hasGiftVouchers: true,
    voucherBrands: ['LULU'],
    supportsDiningApps: false,
    supportsTataNeuDirect: false,
    mccInsight: 'Codes as MCC 5411 (Grocery/Supermarket). Massive hypermarket presence across South & North India.',
    hackTip: 'Swipe HSBC Live+ for 10% direct cashback, Federal Paisaback RuPay for 7.5%, IDFC Power+ for 5%, or RBL ShopRite for 5% cashback at the billing counter.',
  },
  {
    id: 'more_supermarket',
    name: 'More Supermarket / More Megastore',
    aliases: ['more supermarket', 'more retail', 'more megastore', 'more'],
    primaryCategory: 'GROCERY',
    mcc: '5411',
    supportedEnvironments: ['OFFLINE_POS', 'ONLINE'],
    hasGiftVouchers: true,
    voucherBrands: ['MORE_RETAIL'],
    supportsDiningApps: false,
    supportsTataNeuDirect: false,
    mccInsight: 'Codes as MCC 5411. More vouchers widely available on GyFTR / SmartBuy.',
    hackTip: 'Buy More e-vouchers on HDFC SmartBuy at 16.5% via Infinia, or swipe HSBC Live+ (10%), Federal Paisaback (7.5%), IDFC Power+ (5%), or RBL ShopRite (5%) before paying.',
  },
  {
    id: 'bigbasket',
    name: 'BigBasket',
    aliases: ['bigbasket', 'bb daily', 'bbnow', 'big basket'],
    primaryCategory: 'GROCERY',
    mcc: '5411',
    supportedEnvironments: ['ONLINE'],
    hasGiftVouchers: true,
    voucherBrands: ['BIGBASKET'],
    supportsDiningApps: false,
    supportsTataNeuDirect: true,
    mccInsight: 'Codes as MCC 5411. High partner discounts on Tata Neu and Airtel Axis.',
    hackTip: 'Pay via Tata Neu Infinity Card for 10% NeuCoins or Airtel Axis Card for 10% statement cashback (up to ₹500/mo).',
  },
  {
    id: 'blinkit',
    name: 'Blinkit (Quick Commerce)',
    aliases: ['blinkit', 'grofers'],
    primaryCategory: 'GROCERY',
    mcc: '5411',
    supportedEnvironments: ['ONLINE'],
    hasGiftVouchers: true,
    voucherBrands: ['BLINKIT'],
    supportsDiningApps: false,
    supportsTataNeuDirect: false,
    mccInsight: 'Codes as MCC 5411 / 5814 online grocery.',
    hackTip: 'Pay via HSBC Live+ (10% cashback), HDFC Swiggy Card (5%), or SBI Cashback Card (5% online cashback).',
  },
  {
    id: 'zepto',
    name: 'Zepto (Quick Commerce)',
    aliases: ['zepto', 'zepto cafe'],
    primaryCategory: 'GROCERY',
    mcc: '5411',
    supportedEnvironments: ['ONLINE'],
    hasGiftVouchers: true,
    voucherBrands: ['ZEPTO'],
    supportsDiningApps: false,
    supportsTataNeuDirect: false,
    mccInsight: 'Codes as MCC 5411 online grocery/quick commerce.',
    hackTip: 'Pay with HSBC Live+ (10% cashback) or SBI Cashback (5% statement cashback).',
  },

  // Telecom & Utilities
  {
    id: 'airtel_thanks',
    name: 'Airtel Thanks (Recharges & Utilities)',
    aliases: ['airtel', 'airtel thanks', 'airtel broadband', 'airtel dth', 'airtel recharge', 'airtel fiber'],
    primaryCategory: 'UTILITIES',
    mcc: '4814',
    supportedEnvironments: ['ONLINE'],
    hasGiftVouchers: false,
    supportsDiningApps: false,
    supportsTataNeuDirect: false,
    mccInsight: 'Codes as MCC 4814 (Telecom) and MCC 4900 (Utilities).',
    hackTip: 'Pay Airtel mobile/broadband bills with Airtel Axis Card for 25% cashback (up to ₹250/mo), or utility bills with Airtel Axis for 10% cashback (up to ₹250/mo).',
  },
  {
    id: 'phonepe_app',
    name: 'PhonePe (Utilities & Recharges)',
    aliases: ['phonepe', 'phonepe app', 'phonepe bill', 'phonepe recharge', 'phonepe electricity'],
    primaryCategory: 'UTILITIES',
    mcc: '4900',
    supportedEnvironments: ['ONLINE', 'UPI_QR_ONLY'],
    hasGiftVouchers: false,
    supportsDiningApps: false,
    supportsTataNeuDirect: false,
    mccInsight: 'Codes as MCC 4900 (Utilities) and MCC 4814 (Telecom/Recharge).',
    hackTip: 'Pay with HDFC PhonePe Ultimo (10% up to ₹1,000/mo) or SBI PhonePe Black (10% up to ₹1,000/mo) for electricity, water, and recharge bills.',
  },

  // Dining & Restaurants
  {
    id: 'mainland_china',
    name: 'Mainland China Restaurant',
    aliases: ['mainland china', 'speciality restaurants', 'asia kitchen by mainland china'],
    primaryCategory: 'DINING',
    mcc: '5812', // Eating places, Restaurants
    supportedEnvironments: ['OFFLINE_POS'],
    hasGiftVouchers: true,
    voucherBrands: ['MAINLAND_CHINA', 'SPECIALITY_RESTAURANTS'],
    supportsDiningApps: true,
    diningAppIds: ['swiggy_dineout', 'zomato_dining', 'eazydiner_prime'],
    supportsTataNeuDirect: false,
    mccInsight: 'Codes as MCC 5812 (Restaurants). Listed on Swiggy Dineout and EazyDiner Prime with 15%-25% bill discounts.',
    hackTip: 'Double-Dip! Pay via Swiggy Dineout or EazyDiner using IndusInd EazyDiner (25% off up to ₹1,000), HDFC Swiggy (10%), HSBC Live+ (10%), or Airtel Axis (10%). Total return exceeds 25%!',
  },
  {
    id: 'barbeque_nation',
    name: 'Barbeque Nation',
    aliases: ['barbeque nation', 'bbq nation', 'barbequenation'],
    primaryCategory: 'DINING',
    mcc: '5812',
    supportedEnvironments: ['OFFLINE_POS'],
    hasGiftVouchers: true,
    voucherBrands: ['BARBEQUE_NATION'],
    supportsDiningApps: true,
    diningAppIds: ['swiggy_dineout', 'zomato_dining', 'eazydiner_prime'],
    supportsTataNeuDirect: false,
    mccInsight: 'Codes as MCC 5812. Barbeque Nation e-vouchers are available on GyFTR / SmartBuy with 5X/10X points.',
    hackTip: 'Compare: 1) Swiggy Dineout table discount + HDFC Swiggy (10%), vs 2) Buying an instant BBQ Nation voucher on SmartBuy via Infinia for 16.5% points.',
  },
  {
    id: 'social',
    name: 'Social (Impresario Entertainment)',
    aliases: ['social', 'church street social', 'koramangala social', 'anti social', 'hauz khas social'],
    primaryCategory: 'DINING',
    mcc: '5812',
    supportedEnvironments: ['OFFLINE_POS'],
    hasGiftVouchers: false,
    supportsDiningApps: true,
    diningAppIds: ['swiggy_dineout', 'zomato_dining'],
    supportsTataNeuDirect: false,
    mccInsight: 'Codes as MCC 5812 (Restaurants) or MCC 5813 (Drinking Places).',
    hackTip: 'Open Swiggy Dineout or Zomato Pay at the table for an immediate 10%-15% bill discount, paid with HSBC Live+ (10%) or HDFC Swiggy (10%).',
  },
  {
    id: 'starbucks',
    name: 'Starbucks Coffee',
    aliases: ['starbucks', 'tata starbucks'],
    primaryCategory: 'DINING',
    mcc: '5814', // Fast food, Cafes
    supportedEnvironments: ['OFFLINE_POS', 'ONLINE'],
    hasGiftVouchers: true,
    voucherBrands: ['STARBUCKS'],
    supportsDiningApps: true,
    diningAppIds: ['swiggy_dineout'],
    supportsTataNeuDirect: true,
    mccInsight: 'Starbucks in India is operated by Tata Starbucks (Tata Brand!). Accepts Tata Neu directly.',
    hackTip: 'Pay via Tata Neu Infinity RuPay for 5%-10% NeuCoins, or buy instant Starbucks GyFTR vouchers with Infinia (16.5%).',
  },
  {
    id: 'haldirams',
    name: "Haldiram's",
    aliases: ['haldirams', 'haldiram', "haldiram's"],
    primaryCategory: 'DINING',
    mcc: '5814',
    supportedEnvironments: ['OFFLINE_POS', 'UPI_QR_ONLY'],
    hasGiftVouchers: false,
    supportsDiningApps: false,
    supportsTataNeuDirect: false,
    mccInsight: 'Codes as MCC 5814 / 5812 at counters. Most accept UPI QR and card swipe.',
    hackTip: 'Swipe HSBC Live+ for 10% direct cashback or scan with Super.money / Kiwi RuPay for 2%-5% cashback.',
  },
  {
    id: 'mcdonalds',
    name: "McDonald's",
    aliases: ['mcdonalds', 'mcd', "mcdonald's"],
    primaryCategory: 'DINING',
    mcc: '5814',
    supportedEnvironments: ['OFFLINE_POS', 'ONLINE'],
    hasGiftVouchers: true,
    voucherBrands: ['MCDONALDS'],
    supportsDiningApps: false,
    supportsTataNeuDirect: false,
    mccInsight: 'Codes as MCC 5814 (Fast Food).',
    hackTip: 'Pay with HSBC Live+ (10% dining) or buy McDonald\'s GyFTR vouchers on HDFC SmartBuy.',
  },
  {
    id: 'local_restaurant',
    name: 'Local Restaurant / Standalone Cafe',
    aliases: ['restaurant', 'cafe', 'dhaba', 'local restaurant', 'coffee shop', 'bakery'],
    primaryCategory: 'DINING',
    mcc: '5812',
    supportedEnvironments: ['OFFLINE_POS', 'UPI_QR_ONLY'],
    hasGiftVouchers: false,
    supportsDiningApps: false,
    supportsTataNeuDirect: false,
    mccInsight: 'Standalone eateries usually only have POS machines or BharatPe / Paytm / PhonePe UPI QR codes.',
    hackTip: 'If card swipe POS is available, swipe HSBC Live+ for 10% dining cashback. If UPI QR only, scan with Kiwi RuPay (2% assured) or Super.money (up to 5%).',
  },

  // Malls & Retail
  {
    id: 'lifestyle',
    name: 'Lifestyle Department Store',
    aliases: ['lifestyle', 'lifestyle stores', 'landmark group'],
    primaryCategory: 'SHOPPING',
    mcc: '5311', // Department Stores
    supportedEnvironments: ['OFFLINE_POS', 'ONLINE'],
    hasGiftVouchers: true,
    voucherBrands: ['LIFESTYLE'],
    voucherConvenienceFeeRate: 0.0,
    supportsDiningApps: false,
    supportsTataNeuDirect: false,
    mccInsight: 'Codes as MCC 5311. Lifestyle vouchers are available with ZERO convenience fee on HDFC SmartBuy & GyFTR.',
    hackTip: 'Standing at the billing counter? Don\'t swipe your card! Buy an instant Lifestyle voucher on HDFC SmartBuy with Infinia for 16.5% or Regalia Gold for 6.65% points.',
  },
  {
    id: 'shoppers_stop',
    name: 'Shoppers Stop',
    aliases: ['shoppers stop', 'shopper stop'],
    primaryCategory: 'SHOPPING',
    mcc: '5311',
    supportedEnvironments: ['OFFLINE_POS', 'ONLINE'],
    hasGiftVouchers: true,
    voucherBrands: ['SHOPPERS_STOP'],
    voucherConvenienceFeeRate: 0.0,
    supportsDiningApps: false,
    supportsTataNeuDirect: false,
    mccInsight: 'Codes as MCC 5311 (Department Store). GyFTR vouchers delivered instantly via SMS in 30 seconds.',
    hackTip: 'Generate an instant GyFTR e-voucher via HDFC Infinia (16.5% points) or Regalia Gold (6.65%) while the cashier scans your clothes.',
  },
  {
    id: 'westside',
    name: 'Westside (Tata Trent)',
    aliases: ['westside', 'trent westside', 'trent'],
    primaryCategory: 'SHOPPING',
    mcc: '5311',
    supportedEnvironments: ['OFFLINE_POS', 'ONLINE'],
    hasGiftVouchers: true,
    voucherBrands: ['WESTSIDE'],
    supportsDiningApps: false,
    supportsTataNeuDirect: true,
    mccInsight: 'Westside is a key Tata brand. Fully integrated with Tata Neu and NeuCoins.',
    hackTip: 'Option 1: Pay with Tata Neu Infinity Card for 10% NeuCoins! Option 2: Buy GyFTR voucher on SmartBuy via Infinia for 16.5% reward points.',
  },
  {
    id: 'croma',
    name: 'Croma (Infiniti Retail - Tata)',
    aliases: ['croma', 'croma electronics', 'infiniti retail'],
    primaryCategory: 'SHOPPING',
    mcc: '5732', // Electronics Stores
    supportedEnvironments: ['OFFLINE_POS', 'ONLINE'],
    hasGiftVouchers: true,
    voucherBrands: ['CROMA'],
    supportsDiningApps: false,
    supportsTataNeuDirect: true,
    mccInsight: 'Tata electronics arm. Offers 10% NeuCoins on Tata Neu Infinity.',
    hackTip: 'For large electronics (laptops, phones): Pay with Tata Neu Infinity for up to 10% NeuCoins or buy Croma vouchers on SmartBuy (Infinia 16.5% points up to monthly cap).',
  },
  {
    id: 'decathlon',
    name: 'Decathlon Sports',
    aliases: ['decathlon', 'decathlon sports'],
    primaryCategory: 'SHOPPING',
    mcc: '5941', // Sporting Goods
    supportedEnvironments: ['OFFLINE_POS', 'ONLINE'],
    hasGiftVouchers: true,
    voucherBrands: ['DECATHLON'],
    supportsDiningApps: false,
    supportsTataNeuDirect: false,
    mccInsight: 'Codes as MCC 5941. Decathlon vouchers are available on SmartBuy GyFTR.',
    hackTip: 'Stack SmartBuy vouchers via HDFC Infinia (16.5%) or swipe SBI Cashback on Decathlon App (5%).',
  },
  {
    id: 'zudio',
    name: 'Zudio (Trent Limited)',
    aliases: ['zudio', 'zudio store', 'trent zudio'],
    primaryCategory: 'SHOPPING',
    mcc: '5651', // Family Clothing
    supportedEnvironments: ['OFFLINE_POS'],
    hasGiftVouchers: false, // Zudio does not accept GyFTR vouchers
    supportsDiningApps: false,
    supportsTataNeuDirect: true,
    mccInsight: 'Codes as MCC 5651. Tata brand, accepts Tata Neu RuPay UPI.',
    hackTip: 'Zudio has no e-vouchers on SmartBuy. Pay via Tata Neu Infinity RuPay on UPI for 1.5% to 5% NeuCoins, or swipe Axis Atlas for 4% travel value.',
  },
  {
    id: 'reliance_digital',
    name: 'Reliance Digital',
    aliases: ['reliance digital', 'digital resq'],
    primaryCategory: 'SHOPPING',
    mcc: '5732',
    supportedEnvironments: ['OFFLINE_POS', 'ONLINE'],
    hasGiftVouchers: true,
    voucherBrands: ['RELIANCE_DIGITAL'],
    supportsDiningApps: false,
    supportsTataNeuDirect: false,
    mccInsight: 'Codes as MCC 5732 (Electronics). HDFC Regalia Gold gives 5X points on Reliance Digital!',
    hackTip: 'Swipe HDFC Regalia Gold for 5X accelerated reward points (6.65%) or buy vouchers via HDFC Infinia (16.5%).',
  },

  // Movies & Entertainment
  {
    id: 'pvr_inox',
    name: 'PVR INOX Cinemas',
    aliases: ['pvr', 'inox', 'pvr inox', 'pvr cinemas', 'inox leisure'],
    primaryCategory: 'MOVIES',
    mcc: '7832', // Motion Picture Theaters
    supportedEnvironments: ['OFFLINE_POS', 'ONLINE'],
    hasGiftVouchers: true,
    voucherBrands: ['PVR', 'INOX'],
    supportsDiningApps: false,
    supportsTataNeuDirect: false,
    mccInsight: 'Movie tickets and food counters often code as MCC 7832 or MCC 5814 for popcorn/snacks.',
    hackTip: 'For 2 tickets: Check Kotak PVR INOX, ICICI Emeralde Metal or BookMyShow for BOGO! For snacks/food: Buy PVR e-voucher on SmartBuy via Infinia (16.5%) or swipe HSBC Live+ (10% dining).',
  },
  {
    id: 'cinepolis',
    name: 'Cinepolis Cinemas',
    aliases: ['cinepolis', 'cinepolis india'],
    primaryCategory: 'MOVIES',
    mcc: '7832',
    supportedEnvironments: ['OFFLINE_POS', 'ONLINE'],
    hasGiftVouchers: true,
    voucherBrands: ['CINEPOLIS'],
    supportsDiningApps: false,
    supportsTataNeuDirect: false,
    mccInsight: 'Codes as MCC 7832 (Motion Picture Theatres).',
    hackTip: 'Book online using SBI Cashback for 5% cashback or buy Cinepolis GyFTR voucher with Infinia (16.5%).',
  },
  {
    id: 'bookmyshow',
    name: 'BookMyShow',
    aliases: ['bookmyshow', 'bms', 'book my show'],
    primaryCategory: 'MOVIES',
    mcc: '7832',
    supportedEnvironments: ['ONLINE'],
    hasGiftVouchers: true,
    voucherBrands: ['BOOKMYSHOW'],
    supportsDiningApps: false,
    supportsTataNeuDirect: false,
    mccInsight: 'Primary movie and event aggregator in India.',
    hackTip: 'Apply RBL Play, ICICI Emeralde, or IndusInd Legend for BOGO discounts, or SBI Cashback for 5% cashback.',
  },

  // Travel & Hotels
  {
    id: 'taj_hotels',
    name: 'Taj Hotels & Resorts (IHCL)',
    aliases: ['taj', 'taj hotels', 'vivanta', 'seleqtions', 'ginger', 'ihcl'],
    primaryCategory: 'TRAVEL',
    mcc: '7011', // Hotels, Motels, Resorts
    supportedEnvironments: ['OFFLINE_POS', 'ONLINE'],
    hasGiftVouchers: true,
    voucherBrands: ['TAJ_HOTELS'],
    supportsDiningApps: false,
    supportsTataNeuDirect: true,
    mccInsight: 'Crown jewel of Tata group. Earn and burn NeuCoins at 1:1 on all stays and dining.',
    hackTip: 'Pay with Tata Neu Infinity Card for 10% NeuCoins, or redeem Amex Platinum Travel ₹10,000 Taj Stay Voucher!',
  },
  {
    id: 'indigo',
    name: 'IndiGo Airlines',
    aliases: ['indigo', 'goindigo', 'interglobe aviation'],
    primaryCategory: 'TRAVEL',
    mcc: '4511', // Airlines, Air Carriers
    supportedEnvironments: ['ONLINE'],
    hasGiftVouchers: false,
    supportsDiningApps: false,
    supportsTataNeuDirect: false,
    mccInsight: 'Direct airline booking codes as MCC 4511.',
    hackTip: 'Pay directly on IndiGo website/app with Axis Atlas (5 Edge Miles per ₹100 = 10% travel value) or book via HDFC SmartBuy Flights with Infinia (up to 33% value).',
  },
  {
    id: 'makemytrip',
    name: 'MakeMyTrip',
    aliases: ['makemytrip', 'mmt', 'make my trip'],
    primaryCategory: 'TRAVEL',
    mcc: '4722', // Travel Agencies
    supportedEnvironments: ['ONLINE'],
    hasGiftVouchers: true,
    voucherBrands: ['MAKEMYTRIP'],
    supportsDiningApps: false,
    supportsTataNeuDirect: false,
    mccInsight: 'Online travel aggregator (OTA).',
    hackTip: 'Pay via SBI Cashback (5% online cashback) or buy MMT vouchers on SmartBuy via Infinia (up to 16.5%).',
  },
];

// Helper maps for O(1) lookups
export const INSTRUMENT_MAP = new Map<string, PaymentInstrument>();

// Populate INSTRUMENT_MAP with both hyphenated and snake_cased slugs
for (const inst of INDIAN_PAYMENT_INSTRUMENTS) {
  INSTRUMENT_MAP.set(inst.id, inst);
  INSTRUMENT_MAP.set(inst.id.replace(/-/g, '_'), inst);
  INSTRUMENT_MAP.set(inst.id.replace(/_/g, '-'), inst);
}

// Special legacy aliases
const ALIAS_MAP: Record<string, string> = {
  airtel_axis: 'axis-airtel',
  tata_neu_infinity_rupay: 'hdfc-tataneu-infinity',
  kiwi_rupay: 'kiwi-rupay-upi',
  kiwi_axis_rupay: 'kiwi-rupay-upi',
  hdfc_infinia: 'hdfc-infinia',
  hdfc_regalia_gold: 'hdfc-regalia-gold',
  sbi_cashback: 'sbi-cashback',
  hsbc_live_plus: 'hsbc-live-plus',
  hdfc_swiggy: 'hdfc-swiggy',
  axis_atlas: 'axis-atlas',
  icici_amazon_pay: 'icici-amazon-pay',
  amex_plat_travel: 'amex-plat-travel',
};

for (const [alias, targetSlug] of Object.entries(ALIAS_MAP)) {
  const target = INSTRUMENT_MAP.get(targetSlug);
  if (target) {
    INSTRUMENT_MAP.set(alias, target);
  }
}

export const MERCHANT_MAP = new Map<string, MerchantDefinition>(
  INDIAN_MERCHANTS.map((m) => [m.id, m])
);
