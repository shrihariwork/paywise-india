import { describe, it, expect } from 'vitest';
import {
  INDIAN_CARDS_60_CATALOG,
  CARDS_BY_CATEGORY,
  CARDS_60_MAP,
} from '@/data/indian-cards-catalog';
import {
  executeMcpTool,
  readMcpResource,
  MCP_CARD_TOOLS,
  MCP_CARD_RESOURCES,
} from '@/mcp/mcp-live-card-data';
import {
  RewardOptimizerEngine,
  UserWallet,
  QueryContext,
} from '@/lib/optimizerEngine';

describe('60-Card Indian Catalog & Devaluation Engine', () => {
  it('contains exactly 60 Indian credit and RuPay UPI cards', () => {
    expect(INDIAN_CARDS_60_CATALOG.length).toBe(60);
    expect(CARDS_60_MAP.size).toBe(60);
  });

  it('correctly partitions cards into 5 distinct category groups', () => {
    expect(CARDS_BY_CATEGORY.FOOD_DINING_GROCERY.length).toBe(10);
    expect(CARDS_BY_CATEGORY.UPI_TELECOM_FINTECH.length).toBe(12);
    expect(CARDS_BY_CATEGORY.ECOMMERCE_CASHBACK.length).toBe(10);
    expect(CARDS_BY_CATEGORY.PREMIUM_TRAVEL_ZERO_FOREX.length).toBe(18);
    expect(CARDS_BY_CATEGORY.FUEL_ENTERTAINMENT_LIFESTYLE.length).toBe(10);
  });

  it('validates critical devaluations explicitly required in specification', () => {
    // 1. RBL Zomato Edition discontinued
    const rblZomato = CARDS_60_MAP.get('rbl-zomato-edition');
    expect(rblZomato).toBeDefined();
    expect(rblZomato?.devaluationWarnings.some((w) => w.type === 'DISCONTINUED')).toBe(true);

    // 2. Flipkart Axis lounge removed June 2025
    const flipkartAxis = CARDS_60_MAP.get('axis-flipkart');
    expect(flipkartAxis).toBeDefined();
    expect(
      flipkartAxis?.devaluationWarnings.some(
        (w) => w.type === 'LOUNGE_REMOVAL' && w.date.startsWith('2025-06')
      )
    ).toBe(true);

    // 3. IndusInd Legend lounge removed March 2025
    const indusindLegend = CARDS_60_MAP.get('indusind-legend');
    expect(indusindLegend).toBeDefined();
    expect(
      indusindLegend?.devaluationWarnings.some(
        (w) => w.type === 'LOUNGE_REMOVAL' && w.date.startsWith('2025-03')
      )
    ).toBe(true);

    // 4. IndusInd EazyDiner lounge removed July 2025
    const indusindEazyDiner = CARDS_60_MAP.get('indusind-eazydiner');
    expect(indusindEazyDiner).toBeDefined();
    expect(
      indusindEazyDiner?.devaluationWarnings.some(
        (w) => w.type === 'LOUNGE_REMOVAL' && w.date.startsWith('2025-07')
      )
    ).toBe(true);

    // 5. Scapia 0% rewards on international spends
    const scapia = CARDS_60_MAP.get('federal-scapia');
    expect(scapia).toBeDefined();
    expect(
      scapia?.devaluationWarnings.some(
        (w) => w.type === 'REWARD_REDUCTION' && w.message.includes('0%')
      )
    ).toBe(true);
  });

  it('identifies 0% Forex cards accurately', () => {
    const zeroForexCards = INDIAN_CARDS_60_CATALOG.filter((c) => c.forexMarkupBps === 0);
    const slugs = zeroForexCards.map((c) => c.slug);
    expect(slugs).toContain('federal-scapia');
    expect(slugs).toContain('au-ixigo');
    expect(slugs).toContain('idfc-mayura');
  });

  it('identifies RuPay UPI cards properly', () => {
    const rupayUpiCards = INDIAN_CARDS_60_CATALOG.filter((c) => c.upiLinkable);
    const slugs = rupayUpiCards.map((c) => c.slug);
    expect(slugs).toContain('federal-paisaback');
    expect(slugs).toContain('hdfc-phonepe-ultimo');
    expect(slugs).toContain('sbi-phonepe-black');
    expect(slugs).toContain('hdfc-tataneu-infinity');
    expect(slugs).toContain('kiwi-rupay-upi');
    expect(slugs).toContain('jupiter-edge-rupay');
    expect(slugs).toContain('idfc-power-plus');
  });
});

describe('MCP Live Card Data Service', () => {
  it('exposes standard tool and resource lists', () => {
    expect(MCP_CARD_TOOLS.length).toBeGreaterThanOrEqual(5);
    expect(MCP_CARD_RESOURCES.length).toBe(3);
  });

  it('executes search_cards tool for keyword queries', async () => {
    const result = await executeMcpTool('search_cards', { query: 'PhonePe' });
    expect(result.isError).toBeFalsy();
    const data = JSON.parse(result.content[0].text);
    expect(data.count).toBeGreaterThanOrEqual(4);
  });

  it('executes search_cards tool with upiOnly filter', async () => {
    const result = await executeMcpTool('search_cards', { query: '', upiOnly: true });
    expect(result.isError).toBeFalsy();
    const data = JSON.parse(result.content[0].text);
    expect(data.cards.every((c: { upiLinkable: boolean }) => c.upiLinkable)).toBe(true);
  });

  it('executes get_card_details tool for specific slug', async () => {
    const result = await executeMcpTool('get_card_details', { slug: 'hsbc-live-plus' });
    expect(result.isError).toBeFalsy();
    const card = JSON.parse(result.content[0].text);
    expect(card.name).toContain('HSBC Live+');
    expect(card.categoryAccelerators[0].effectiveYieldBps).toBe(1000);
  });

  it('executes get_devaluation_alerts tool', async () => {
    const result = await executeMcpTool('get_devaluation_alerts', { severity: 'HIGH' });
    expect(result.isError).toBeFalsy();
    const data = JSON.parse(result.content[0].text);
    expect(data.totalDevaluationAlerts).toBeGreaterThanOrEqual(5);
  });

  it('executes find_best_cards_for_merchant tool', async () => {
    const result = await executeMcpTool('find_best_cards_for_merchant', {
      merchantName: 'DMart',
      category: 'GROCERY',
      isOfflinePos: true,
    });
    expect(result.isError).toBeFalsy();
    const data = JSON.parse(result.content[0].text);
    expect(data.topRecommendations.length).toBeGreaterThan(0);
    const top = data.topRecommendations[0];
    expect(top.effectiveYieldPercent).toBeGreaterThanOrEqual(7.5);
  });

  it('reads MCP resources correctly', async () => {
    const allCardsJson = await readMcpResource('cards://all-catalog');
    const allCards = JSON.parse(allCardsJson);
    expect(allCards.length).toBe(60);

    const devaluationsJson = await readMcpResource('cards://devaluation-bulletin');
    const devaluations = JSON.parse(devaluationsJson);
    expect(devaluations.length).toBeGreaterThan(0);
  });
});

describe('Engine 60-Card Integration & Specialized Rules', () => {
  // Offline grocery queries (DMart, Reliance Fresh, LuLu, More)
  describe('Offline Grocery Queries (DMart, Reliance Fresh, LuLu, More)', () => {
    it('evaluates hsbc-live-plus (10%), federal-paisaback (7.5%), idfc-power-plus (5%), rbl-shoprite (5%), sbi-bpcl-octane (2.5%) against RuPay UPI', () => {
      const wallet: UserWallet = {
        ownedCardIds: [
          'hsbc-live-plus',
          'federal-paisaback',
          'idfc-power-plus',
          'rbl-shoprite',
          'sbi-bpcl-octane',
          'kiwi-rupay-upi',
        ],
        installedUpiAppIds: ['super_money'],
        activeMemberships: [],
        monthlyCapUsed: {},
      };

      const query: QueryContext = {
        merchantName: 'LuLu Hypermarket',
        category: 'GROCERY',
        billAmount: 4000,
        paymentEnvironment: 'OFFLINE_POS',
      };

      const result = RewardOptimizerEngine.optimize(wallet, query);

      // Best overall should be HSBC Live+ (10% up to ₹1,000 cap = ₹400 savings)
      expect(result.bestOverall.instrumentId).toBe('hsbc-live-plus');
      expect(result.bestOverall.netSavingsInr).toBe(400);
      expect(result.bestOverall.effectiveReturnRate).toBe(0.10);

      // Find Federal Paisaback in pathways (7.5% = ₹300)
      const paisaback = result.allWalletPathways.find((p) => p.instrumentId === 'federal-paisaback');
      expect(paisaback).toBeDefined();
      expect(paisaback?.netSavingsInr).toBe(300);

      // Find IDFC Power+ in pathways (5% = ₹200)
      const powerPlus = result.allWalletPathways.find((p) => p.instrumentId === 'idfc-power-plus');
      expect(powerPlus).toBeDefined();
      expect(powerPlus?.netSavingsInr).toBe(200);

      // Find RBL Shoprite in pathways (5% = ₹200)
      const shoprite = result.allWalletPathways.find((p) => p.instrumentId === 'rbl-shoprite');
      expect(shoprite).toBeDefined();
      expect(shoprite?.netSavingsInr).toBe(200);

      // Find SBI BPCL Octane in pathways (2.5% = ₹100)
      const bpclOctane = result.allWalletPathways.find((p) => p.instrumentId === 'sbi-bpcl-octane');
      expect(bpclOctane).toBeDefined();
      expect(bpclOctane?.netSavingsInr).toBe(100);

      // Find Kiwi RuPay UPI (2% = ₹80)
      const kiwiUpi = result.allWalletPathways.find((p) => p.instrumentId === 'kiwi-rupay-upi');
      expect(kiwiUpi).toBeDefined();
      expect(kiwiUpi?.netSavingsInr).toBe(80);
    });
  });

  // Utility/Recharge queries
  describe('Utility & Recharge Queries (Airtel, PhonePe, Tata Neu)', () => {
    it('evaluates axis-airtel (25%/10%), hdfc-phonepe-ultimo (10%), sbi-phonepe-black (10%), axis-ace (5%), hdfc-tataneu-infinity (5%)', () => {
      const wallet: UserWallet = {
        ownedCardIds: [
          'axis-airtel',
          'hdfc-phonepe-ultimo',
          'sbi-phonepe-black',
          'axis-ace',
          'hdfc-tataneu-infinity',
        ],
        installedUpiAppIds: ['tata_neu_upi'],
        activeMemberships: [],
        monthlyCapUsed: {},
      };

      // 1. Airtel Thanks Mobile/Broadband recharge (₹1,000 bill)
      const airtelQuery: QueryContext = {
        merchantName: 'Airtel Thanks',
        category: 'UTILITIES',
        mccEstimate: '4814',
        billAmount: 1000,
        paymentEnvironment: 'ONLINE',
      };

      const airtelResult = RewardOptimizerEngine.optimize(wallet, airtelQuery);
      // Airtel Axis gives 25% capped at ₹250
      expect(airtelResult.bestOverall.instrumentId).toBe('axis-airtel');
      expect(airtelResult.bestOverall.netSavingsInr).toBe(250);

      // 2. Electricity bill on PhonePe (₹2,500 bill)
      const phonepeQuery: QueryContext = {
        merchantName: 'PhonePe',
        category: 'UTILITIES',
        mccEstimate: '4900',
        billAmount: 2500,
        paymentEnvironment: 'ONLINE',
      };

      const phonepeResult = RewardOptimizerEngine.optimize(wallet, phonepeQuery);
      // PhonePe Ultimo gives 10% (₹250 savings)
      const ultimo = phonepeResult.allWalletPathways.find(
        (p) => p.instrumentId === 'hdfc-phonepe-ultimo'
      );
      expect(ultimo).toBeDefined();
      expect(ultimo?.netSavingsInr).toBe(250);

      // Axis ACE gives 5% (₹125 savings)
      const ace = phonepeResult.allWalletPathways.find((p) => p.instrumentId === 'axis-ace');
      expect(ace).toBeDefined();
      expect(ace?.netSavingsInr).toBe(125);
    });
  });

  // Food/Dining queries
  describe('Food & Dining Queries', () => {
    it('evaluates hdfc-swiggy (10%), hsbc-live-plus (10%), axis-airtel (10%), yes-paisasave (6%), and indusind-eazydiner (25%)', () => {
      const wallet: UserWallet = {
        ownedCardIds: [
          'hdfc-swiggy',
          'hsbc-live-plus',
          'axis-airtel',
          'yes-paisasave',
          'indusind-eazydiner',
        ],
        installedUpiAppIds: [],
        activeMemberships: ['SWIGGY_ONE', 'EAZYDINER_PRIME'],
        monthlyCapUsed: {},
      };

      const query: QueryContext = {
        merchantName: 'Mainland China',
        category: 'DINING',
        billAmount: 4000,
        paymentEnvironment: 'OFFLINE_POS',
      };

      const result = RewardOptimizerEngine.optimize(wallet, query);

      // EazyDiner Prime with IndusInd EazyDiner should give 25% upfront (₹1000) + 25% PayEazy discount (₹750 capped) = massive savings > ₹1,500!
      expect(result.bestOverall.netSavingsInr).toBeGreaterThanOrEqual(1500);

      // Check Swiggy Dineout with HDFC Swiggy (12% table discount ₹480 + 10% cashback ₹352 = ₹832)
      const dineoutSwiggy = result.allWalletPathways.find(
        (p) => p.aggregatorId === 'swiggy_dineout' && p.instrumentId === 'hdfc-swiggy'
      );
      expect(dineoutSwiggy).toBeDefined();
      expect(dineoutSwiggy?.netSavingsInr).toBe(832);

      // Check Yes PaisaSave direct dining swipe (6% of ₹4,000 = ₹240)
      const paisasave = result.allWalletPathways.find(
        (p) => p.instrumentId === 'yes-paisasave' && p.strategyType === 'DIRECT_CARD'
      );
      expect(paisasave).toBeDefined();
      expect(paisasave?.netSavingsInr).toBe(240);
    });
  });
});
