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
// 1. MASTER INDIAN CREDIT CARDS & PAYMENT INSTRUMENTS
// -------------------------------------------------------------------------
export const INDIAN_PAYMENT_INSTRUMENTS: PaymentInstrument[] = [
  {
    id: 'hdfc_infinia',
    name: 'HDFC Infinia Metal Credit Card',
    issuer: 'HDFC Bank',
    network: 'Visa',
    type: 'CREDIT_CARD',
    upiEnabled: false,
    baseRewardRate: 0.033, // 5 points per ₹150 = 3.33%
    pointValueInr: 1.0, // 1 Reward Point = ₹1.00 on SmartBuy flights/hotels/Apple
    exclusions: ['FUEL', 'RENT', 'UTILITIES'],
    cardColor: {
      gradient: 'from-zinc-900 via-slate-800 to-black',
      textColor: 'text-amber-300',
      badgeColor: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
    },
    keyPerks: [
      '3.3% base reward rate (1 RP = ₹1.00)',
      '16.5% (5X RP) via SmartBuy GyFTR vouchers on dining, fashion & movies',
      '₹15,000 monthly bonus reward points cap',
    ],
    categoryMultipliers: [
      {
        categories: ['TRAVEL'],
        mccs: ['4511', '4722', '7011'],
        rewardRate: 0.33, // 10X points on flights/hotels via SmartBuy
        monthlyCapInr: 15000,
        isOnlineOnly: true,
        description: '10X points (33% value) on SmartBuy Flights & Hotels',
      },
    ],
    voucherOffers: [
      {
        portalId: 'hdfc_smartbuy_gyftr',
        portalName: 'HDFC SmartBuy GyFTR',
        multiplierRate: 0.165, // 5X points = 16.5% effective
        monthlyBonusCapInr: 15000,
        voucherConvenienceFeeRate: 0.025, // typical 2.5% fee on Amazon/Flipkart vouchers, 0% on brands
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
        ],
      },
    ],
  },
  {
    id: 'hdfc_regalia_gold',
    name: 'HDFC Regalia Gold Credit Card',
    issuer: 'HDFC Bank',
    network: 'Visa',
    type: 'CREDIT_CARD',
    upiEnabled: false,
    baseRewardRate: 0.0133, // 4 points per ₹150, 1 point = ₹0.50
    pointValueInr: 0.5,
    exclusions: ['FUEL', 'RENT'],
    cardColor: {
      gradient: 'from-amber-700 via-yellow-800 to-stone-900',
      textColor: 'text-yellow-200',
      badgeColor: 'bg-yellow-400/20 text-yellow-200 border-yellow-400/30',
    },
    keyPerks: [
      '1.33% base reward rate (4 RP per ₹150, 1 RP = ₹0.50)',
      '6.65% (5X RP) on SmartBuy instant vouchers and Marks & Spencer, Myntra, Nykaa, Reliance Digital',
      'Milestone vouchers of ₹1,500 every ₹1.5L spend',
    ],
    categoryMultipliers: [
      {
        categories: ['SHOPPING'],
        mccs: ['5311', '5651', '5732'],
        rewardRate: 0.0665, // 5X RP = 20 points per ₹150 = 6.65%
        monthlyCapInr: 2500,
        brandIdentifiers: ['MYNTRA', 'NYKAA', 'MARKS_AND_SPENCER', 'RELIANCE_DIGITAL'],
        description: '5X accelerated reward points on select retail partners',
      },
    ],
    voucherOffers: [
      {
        portalId: 'hdfc_smartbuy_gyftr',
        portalName: 'HDFC SmartBuy GyFTR',
        multiplierRate: 0.0665, // 5X points
        monthlyBonusCapInr: 4000,
        voucherConvenienceFeeRate: 0.02,
        eligibleCategories: ['DINING', 'SHOPPING', 'MOVIES'],
        supportedBrands: [
          'LIFESTYLE',
          'SHOPPERS_STOP',
          'WESTSIDE',
          'CROMA',
          'PVR',
          'BARBEQUE_NATION',
          'DECATHLON',
        ],
      },
    ],
  },
  {
    id: 'sbi_cashback',
    name: 'SBI Cashback Credit Card',
    issuer: 'State Bank of India',
    network: 'Visa',
    type: 'CREDIT_CARD',
    upiEnabled: false,
    baseRewardRate: 0.01, // 1% on offline POS transactions
    pointValueInr: 1.0, // Direct statement cashback in INR
    exclusions: ['FUEL', 'RENT', 'UTILITIES', 'JEWELLERY'],
    cardColor: {
      gradient: 'from-blue-700 via-indigo-900 to-slate-950',
      textColor: 'text-cyan-200',
      badgeColor: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/30',
    },
    keyPerks: [
      '5% flat statement cashback on almost ALL online transactions',
      '₹5,000 monthly cashback cap (spends up to ₹1,00,000/mo)',
      '1% offline POS cashback',
    ],
    categoryMultipliers: [
      {
        categories: ['SHOPPING', 'FOOD_DELIVERY', 'GROCERY', 'MOVIES', 'TRAVEL'],
        mccs: ['5411', '5812', '5814', '5311', '7832', '4511', '4722'],
        rewardRate: 0.05, // 5% online
        monthlyCapInr: 5000,
        isOnlineOnly: true,
        description: '5% unlimited online statement cashback up to ₹5,000/mo cap',
      },
    ],
  },
  {
    id: 'hsbc_live_plus',
    name: 'HSBC Live+ Credit Card',
    issuer: 'HSBC',
    network: 'Visa',
    type: 'CREDIT_CARD',
    upiEnabled: false,
    baseRewardRate: 0.015, // 1.5% base cashback on all other spends
    pointValueInr: 1.0,
    exclusions: ['FUEL', 'RENT', 'UTILITIES'],
    cardColor: {
      gradient: 'from-red-700 via-rose-900 to-zinc-950',
      textColor: 'text-rose-200',
      badgeColor: 'bg-red-500/20 text-rose-200 border-red-400/30',
    },
    keyPerks: [
      '10% accelerated cashback on Dining, Food Delivery, and Supermarket/Grocery (MCC 5411/5812)',
      '₹1,000 monthly cashback cap across accelerated categories',
      '1.5% unlimited base cashback everywhere else',
    ],
    categoryMultipliers: [
      {
        categories: ['DINING', 'FOOD_DELIVERY', 'GROCERY'],
        mccs: ['5411', '5812', '5814'],
        rewardRate: 0.10, // 10% cashback
        monthlyCapInr: 1000,
        minTxnInr: 100,
        description: '10% cashback on Dining, Groceries & Food Delivery (DMart, Swiggy, Zomato)',
      },
    ],
  },
  {
    id: 'hdfc_swiggy',
    name: 'HDFC Swiggy Credit Card',
    issuer: 'HDFC Bank',
    network: 'Mastercard',
    type: 'CREDIT_CARD',
    upiEnabled: false,
    baseRewardRate: 0.01,
    pointValueInr: 1.0, // Cashback credited directly as Swiggy Money
    exclusions: ['FUEL', 'RENT', 'UTILITIES', 'JEWELLERY'],
    cardColor: {
      gradient: 'from-orange-600 via-amber-800 to-zinc-950',
      textColor: 'text-orange-200',
      badgeColor: 'bg-orange-500/20 text-orange-200 border-orange-400/30',
    },
    keyPerks: [
      '10% cashback on Swiggy, Dineout, Instamart & Genie (up to ₹1,500/mo)',
      '5% cashback on leading online platforms (Amazon, Flipkart, Myntra, Nykaa) up to ₹1,500/mo',
      '1% cashback on other spends',
    ],
    categoryMultipliers: [
      {
        categories: ['FOOD_DELIVERY', 'DINING'],
        mccs: ['5812', '5814'],
        rewardRate: 0.10,
        monthlyCapInr: 1500,
        brandIdentifiers: ['SWIGGY', 'SWIGGY_DINEOUT', 'INSTAMART'],
        description: '10% cashback on Swiggy App and Swiggy Dineout restaurant payments',
      },
      {
        categories: ['SHOPPING'],
        mccs: ['5311'],
        rewardRate: 0.05,
        monthlyCapInr: 1500,
        isOnlineOnly: true,
        brandIdentifiers: ['AMAZON', 'FLIPKART', 'MYNTRA', 'NYKAA', 'AJIO', 'UBER'],
        description: '5% cashback on top online merchants',
      },
    ],
  },
  {
    id: 'airtel_axis',
    name: 'Airtel Axis Bank Credit Card',
    issuer: 'Axis Bank',
    network: 'Mastercard',
    type: 'CREDIT_CARD',
    upiEnabled: false,
    baseRewardRate: 0.01,
    pointValueInr: 1.0,
    exclusions: ['FUEL', 'RENT', 'JEWELLERY'],
    cardColor: {
      gradient: 'from-red-600 via-stone-900 to-black',
      textColor: 'text-red-300',
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
    },
    keyPerks: [
      '10% cashback on Swiggy, Zomato, and BigBasket (up to ₹500/mo combined)',
      '25% cashback on Airtel mobile, broadband, and DTH recharges (up to ₹300/mo)',
      '10% on utility bills via Airtel Thanks App (up to ₹300/mo)',
    ],
    categoryMultipliers: [
      {
        categories: ['FOOD_DELIVERY', 'DINING', 'GROCERY'],
        mccs: ['5812', '5814', '5411'],
        rewardRate: 0.10,
        monthlyCapInr: 500,
        brandIdentifiers: ['SWIGGY', 'ZOMATO', 'BIGBASKET'],
        description: '10% statement cashback on Swiggy, Zomato, and BigBasket',
      },
      {
        categories: ['UTILITIES'],
        mccs: ['4814', '4900'],
        rewardRate: 0.10,
        monthlyCapInr: 300,
        description: '10% on utility bill payments via Airtel Thanks App',
      },
    ],
  },
  {
    id: 'axis_atlas',
    name: 'Axis Bank Atlas Credit Card',
    issuer: 'Axis Bank',
    network: 'Visa',
    type: 'CREDIT_CARD',
    upiEnabled: false,
    baseRewardRate: 0.04, // 2 Edge Miles per ₹100 = 4% travel value (1 EM = 2 Partner Points = ~₹2.00)
    pointValueInr: 2.0, // Real-world value when transferred to airline miles (Accor, Singapore Krisflyer, etc.)
    exclusions: ['FUEL', 'RENT', 'WALLET_LOAD'],
    cardColor: {
      gradient: 'from-slate-800 via-blue-950 to-neutral-900',
      textColor: 'text-blue-200',
      badgeColor: 'bg-blue-400/20 text-blue-200 border-blue-400/30',
    },
    keyPerks: [
      '4% baseline return across all general offline/online spends (2 Edge Miles/₹100)',
      '10% accelerated return on direct airline & hotel booking spends (5 Edge Miles/₹100)',
      'Up to 10,000 bonus Edge Miles on Tier milestones',
    ],
    categoryMultipliers: [
      {
        categories: ['TRAVEL'],
        mccs: ['4511', '7011', '4722'],
        rewardRate: 0.10, // 5 Edge Miles per ₹100 = 10%
        monthlyCapInr: 20000,
        description: '5 Edge Miles per ₹100 (10% value) on direct airlines and hotel websites',
      },
    ],
  },
  {
    id: 'icici_amazon_pay',
    name: 'Amazon Pay ICICI Credit Card',
    issuer: 'ICICI Bank',
    network: 'Visa',
    type: 'CREDIT_CARD',
    upiEnabled: false,
    baseRewardRate: 0.01,
    pointValueInr: 1.0, // Direct Amazon Pay balance
    exclusions: ['FUEL', 'RENT'],
    cardColor: {
      gradient: 'from-amber-600 via-neutral-900 to-black',
      textColor: 'text-amber-200',
      badgeColor: 'bg-amber-400/20 text-amber-200 border-amber-400/30',
    },
    keyPerks: [
      '5% unlimited cashback on Amazon for Prime members (3% for non-Prime)',
      '2% unlimited cashback on 100+ Amazon Pay partner merchants (Uber, Swiggy, BookMyShow)',
      '1% unlimited on offline and other online spends',
    ],
    categoryMultipliers: [
      {
        categories: ['SHOPPING'],
        mccs: ['5311'],
        rewardRate: 0.05,
        monthlyCapInr: 999999, // Unlimited
        isOnlineOnly: true,
        brandIdentifiers: ['AMAZON'],
        description: '5% unlimited cashback for Amazon Prime members',
      },
      {
        categories: ['FOOD_DELIVERY', 'MOVIES', 'TRAVEL'],
        mccs: ['5812', '7832', '4121'],
        rewardRate: 0.02,
        monthlyCapInr: 999999, // Unlimited
        brandIdentifiers: ['UBER', 'SWIGGY', 'ZOMATO', 'BOOKMYSHOW'],
        description: '2% unlimited cashback on Amazon Pay partner merchants',
      },
    ],
  },
  {
    id: 'tata_neu_infinity_rupay',
    name: 'Tata Neu Infinity HDFC Credit Card (RuPay)',
    issuer: 'HDFC Bank',
    network: 'RuPay',
    type: 'RUPAY_UPI_CREDIT_CARD',
    upiEnabled: true,
    baseRewardRate: 0.015, // 1.5% NeuCoins on UPI Scan & Pay and non-Tata spends
    pointValueInr: 1.0, // 1 NeuCoin = ₹1.00 on Tata brands
    exclusions: ['FUEL', 'RENT'],
    cardColor: {
      gradient: 'from-violet-800 via-purple-950 to-neutral-950',
      textColor: 'text-purple-200',
      badgeColor: 'bg-purple-500/20 text-purple-200 border-purple-400/30',
    },
    keyPerks: [
      '1.5% NeuCoins on ALL RuPay UPI Scan & Pay merchant transactions via Tata Neu App',
      '10% NeuCoins on Tata Brands (5% card + 5% NeuPass) across BigBasket, Croma, Westside, Tata 1mg, Taj',
      'Direct RuPay UPI linkage in GPay, PhonePe, and Tata Neu',
    ],
    categoryMultipliers: [
      {
        categories: ['GROCERY', 'SHOPPING', 'TRAVEL'],
        mccs: ['5411', '5311', '5732', '7011'],
        rewardRate: 0.10, // 10% on Tata Brands
        monthlyCapInr: 10000,
        brandIdentifiers: ['BIGBASKET', 'CROMA', 'WESTSIDE', 'TATA_1MG', 'TAJ_HOTELS', 'TITAN', 'TANISHQ'],
        description: '10% NeuCoins on Tata Brands with NeuPass (BigBasket, Croma, Westside, Taj)',
      },
    ],
  },
  {
    id: 'kiwi_axis_rupay',
    name: 'Kiwi Axis Bank RuPay Credit Card',
    issuer: 'Axis Bank',
    network: 'RuPay',
    type: 'RUPAY_UPI_CREDIT_CARD',
    upiEnabled: true,
    baseRewardRate: 0.02, // 2% flat assured cashback on UPI Scan & Pay
    pointValueInr: 1.0,
    exclusions: ['FUEL', 'RENT', 'PEER_TO_PEER'],
    cardColor: {
      gradient: 'from-emerald-700 via-teal-900 to-black',
      textColor: 'text-emerald-300',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    },
    keyPerks: [
      '2% assured Kiwis (cashback) on all merchant UPI Scan & Pay QR payments',
      'Up to 5% accelerated Kiwis on select partner offline stores',
      'Direct UPI scan via Kiwi App or Google Pay',
    ],
    categoryMultipliers: [
      {
        categories: ['GENERAL', 'DINING', 'GROCERY'],
        mccs: ['5411', '5812', '5814'],
        rewardRate: 0.02,
        monthlyCapInr: 1500,
        description: '2% assured Kiwis directly credited to bank account for UPI QR payments',
      },
    ],
  },
  {
    id: 'amex_plat_travel',
    name: 'American Express Platinum Travel Card',
    issuer: 'American Express',
    network: 'Amex',
    type: 'CREDIT_CARD',
    upiEnabled: false,
    baseRewardRate: 0.015, // 1 Membership Reward point per ₹50 = ~1.5%
    pointValueInr: 0.4, // Baseline MR value, jumps dramatically with milestones
    exclusions: ['FUEL', 'RENT', 'UTILITIES', 'INSURANCE'],
    cardColor: {
      gradient: 'from-slate-300 via-gray-400 to-zinc-600',
      textColor: 'text-zinc-950',
      badgeColor: 'bg-zinc-800 text-zinc-100 border-zinc-700',
    },
    keyPerks: [
      'Top-tier milestone card: 48,000 MR points + ₹10,000 Taj Voucher on ₹4L annual spend',
      'Effective return rate of ~7.5% when ₹4L milestone is achieved',
      '3X points via Amex Reward Multiplier on GyFTR vouchers',
    ],
    annualMilestoneBonus: {
      targetSpendInr: 400000,
      bonusValueInr: 30000, // 48k points (~₹20k) + ₹10,000 Taj voucher
      effectiveBonusWeight: 0.06, // Extra 6% effective value towards milestone
      description: '₹4,00,000 annual spend unlocks 48,000 points + ₹10,000 Taj Stay Voucher (~7.5% return)',
    },
    categoryMultipliers: [],
    voucherOffers: [
      {
        portalId: 'amex_reward_multiplier',
        portalName: 'Amex Reward Multiplier (GyFTR)',
        multiplierRate: 0.045, // 3X points
        monthlyBonusCapInr: 10000,
        eligibleCategories: ['SHOPPING', 'DINING', 'MOVIES'],
        supportedBrands: ['LIFESTYLE', 'SHOPPERS_STOP', 'CROMA', 'WESTSIDE', 'PVR'],
      },
    ],
  },
  {
    id: 'icici_sapphiro',
    name: 'ICICI Bank Sapphiro Credit Card',
    issuer: 'ICICI Bank',
    network: 'Visa',
    type: 'CREDIT_CARD',
    upiEnabled: false,
    baseRewardRate: 0.005, // 2 points per ₹100 domestic = 0.5%
    pointValueInr: 0.25,
    exclusions: ['FUEL', 'RENT'],
    cardColor: {
      gradient: 'from-sky-800 via-indigo-950 to-black',
      textColor: 'text-sky-300',
      badgeColor: 'bg-sky-400/20 text-sky-300 border-sky-400/30',
    },
    keyPerks: [
      'Buy-One-Get-One (BOGO) movie ticket up to ₹500 off on BookMyShow twice a month',
      'Complimentary airport and railway lounge access',
      '4 Reward Points per ₹100 on international spends',
    ],
    bogoOffer: {
      platform: 'BOOKMYSHOW',
      maxDiscountPerTicketInr: 500,
      monthlyTimesLimit: 2,
    },
    categoryMultipliers: [
      {
        categories: ['MOVIES'],
        mccs: ['7832'],
        rewardRate: 0.50, // Effective 50% discount on 2 tickets
        monthlyCapInr: 1000,
        description: 'BOGO up to ₹500 discount on 2nd movie ticket via BookMyShow twice a month',
      },
    ],
  },
];

// -------------------------------------------------------------------------
// 2. DINING AGGREGATORS & STACKING CHANNELS
// -------------------------------------------------------------------------
export const DINING_AGGREGATORS: DiningAggregatorChannel[] = [
  {
    id: 'swiggy_dineout',
    name: 'Swiggy Dineout',
    category: 'DINING',
    typicalBaseDiscount: 0.12, // 12% average restaurant bill discount
    partnerCardBoosts: [
      {
        cardId: 'hdfc_swiggy',
        extraCashbackRate: 0.10,
        monthlyCapInr: 1500,
        description: '10% cashback on total Dineout bill via HDFC Swiggy Card',
      },
      {
        cardId: 'hsbc_live_plus',
        extraCashbackRate: 0.10,
        monthlyCapInr: 1000,
        description: '10% dining cashback on Dineout transaction (MCC 5812)',
      },
      {
        cardId: 'airtel_axis',
        extraCashbackRate: 0.10,
        monthlyCapInr: 500,
        description: '10% cashback on Swiggy Dineout via Airtel Axis',
      },
      {
        cardId: 'sbi_cashback',
        extraCashbackRate: 0.05,
        monthlyCapInr: 5000,
        description: '5% online cashback on Dineout in-app payment',
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
        cardId: 'hsbc_live_plus',
        extraCashbackRate: 0.10,
        monthlyCapInr: 1000,
        description: '10% dining cashback on Zomato Pay bill',
      },
      {
        cardId: 'airtel_axis',
        extraCashbackRate: 0.10,
        monthlyCapInr: 500,
        description: '10% cashback on Zomato platform via Airtel Axis',
      },
      {
        cardId: 'sbi_cashback',
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
        cardId: 'hsbc_live_plus',
        extraCashbackRate: 0.10,
        monthlyCapInr: 1000,
        description: '10% cashback on food and dining spends',
      },
      {
        cardId: 'sbi_cashback',
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
    hackTip: 'DMart does NOT accept GyFTR vouchers and does NOT give 5% on SBI Cashback (offline POS gives only 1%). Best card is HSBC Live+ (10% cashback up to ₹1,000/mo) or Kiwi/Tata Neu RuPay on UPI.',
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
    hackTip: 'Buy Reliance gift vouchers on SmartBuy using Infinia (16.5%) or Regalia Gold (6.65%), or swipe HSBC Live+ for 10% direct cashback.',
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
    hackTip: 'Buy More e-vouchers on HDFC SmartBuy at 16.5% via Infinia or 6.65% via Regalia Gold before paying at counter.',
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
    hackTip: 'Pay via HSBC Live+ (10% cashback) or SBI Cashback Card (5% online cashback).',
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
    hackTip: 'Double-Dip! Pay the bill via Swiggy Dineout (15% restaurant discount) using HDFC Swiggy Card (extra 10% cashback) or HSBC Live+ (10% dining cashback). Total return exceeds 23%!',
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
    hackTip: 'For 2 tickets: Check ICICI Sapphiro on BookMyShow for BOGO up to ₹500 off! For snacks/food: Buy PVR e-voucher on SmartBuy via Infinia (16.5%) or swipe HSBC Live+ (10% dining).',
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
    hackTip: 'Apply ICICI Sapphiro card at checkout for Buy-One-Get-One (up to ₹500 off 2nd ticket), or SBI Cashback for 5% cashback.',
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
export const INSTRUMENT_MAP = new Map<string, PaymentInstrument>(
  INDIAN_PAYMENT_INSTRUMENTS.map((inst) => [inst.id, inst])
);

export const MERCHANT_MAP = new Map<string, MerchantDefinition>(
  INDIAN_MERCHANTS.map((m) => [m.id, m])
);
