import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import {
  RewardOptimizerEngine,
  DEFAULT_USER_WALLET,
  UserWallet,
  QueryContext,
  resolveMerchant,
  OptimizationResult,
} from '@/lib/optimizerEngine';
import { SpendingCategory, PaymentEnvironment } from '@/data/indianPaymentCatalog';
import { formatINR, formatPercent, roundToPaise } from '@/lib/utils';

const RequestSchema = z.object({
  query: z.string().min(1, 'Query text is required'),
  wallet: z
    .object({
      ownedCardIds: z.array(z.string()),
      installedUpiAppIds: z.array(z.string()),
      activeMemberships: z.array(z.string()),
      monthlyCapUsed: z.record(z.string(), z.number()),
      targetMilestoneCards: z.array(z.string()).optional(),
    })
    .optional(),
  location: z.string().optional(),
});

interface ParsedSplitPart {
  description: string;
  billAmount: number;
  category: SpendingCategory;
}

interface ParsedQueryIntent {
  merchantName: string;
  category: SpendingCategory;
  mccEstimate: string;
  billAmount: number;
  isOnline: boolean;
  paymentEnvironment: PaymentEnvironment;
  channelPreferences: string[];
  splitParts?: ParsedSplitPart[];
  parserSource: 'GEMINI_AI' | 'DETERMINISTIC_FALLBACK';
}

/**
 * Deterministic offline NLP fallback parser
 * Accurately extracts amounts, merchants, categories, and split bills without API key
 */
export function parseIntentDeterministic(query: string): ParsedQueryIntent {
  const text = query.trim();
  const lower = text.toLowerCase();

  // 1. Detect Multi-Part Bills (e.g. "tickets 1200 and snacks 600")
  const splitPattern =
    /(?:tickets?|movie tickets?)\s*(?:for|cost|is|of|amount|:)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)?)\s*(?:and|plus|\&|\+)\s*(?:snacks?|food|popcorn|beverage)\s*(?:for|cost|is|of|amount|:)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)?)/i;

  const splitMatch = lower.match(splitPattern);
  let splitParts: ParsedSplitPart[] | undefined;

  if (splitMatch && splitMatch[1] && splitMatch[2]) {
    const tAmt = parseFloat(splitMatch[1].replace(/,/g, ''));
    const sAmt = parseFloat(splitMatch[2].replace(/,/g, ''));
    if (!isNaN(tAmt) && !isNaN(sAmt) && tAmt > 0 && sAmt > 0) {
      splitParts = [
        {
          description: 'Movie Tickets',
          billAmount: tAmt,
          category: 'MOVIES',
        },
        {
          description: 'Snacks & Popcorn',
          billAmount: sAmt,
          category: 'DINING',
        },
      ];
    }
  }

  // 2. Extract Bill Amount
  let billAmount = 0;
  if (splitParts && splitParts.length > 0) {
    billAmount = splitParts.reduce((acc, p) => acc + p.billAmount, 0);
  } else {
    // Regex matches: ₹3,500, 3500 rs, Rs. 4200, 3.5k, bill of 4500, paying 1200
    const kMatch = lower.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*k\b/i);
    if (kMatch && kMatch[1]) {
      billAmount = parseFloat(kMatch[1]) * 1000;
    } else {
      const amountMatch = lower.match(
        /(?:₹|rs\.?|inr|bill(?:\s+is|\s+of)?|paying|amount|for)\s*[:=]?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)?(?:\.\d+)?)/i
      ) || lower.match(/(\d+(?:,\d+)?)\s*(?:₹|rs\.?|inr|rupees)/i) || lower.match(/\b(\d{3,6})\b/);

      if (amountMatch && amountMatch[1]) {
        billAmount = parseFloat(amountMatch[1].replace(/,/g, ''));
      }
    }
  }

  // Default fallback amount if none found
  if (isNaN(billAmount) || billAmount <= 0) {
    billAmount = 2500;
  }

  // 3. Resolve Merchant & Primary Category
  const matchedMerchant = resolveMerchant(lower);
  let merchantName = matchedMerchant?.name || 'Local Store';
  let category: SpendingCategory = matchedMerchant?.primaryCategory || 'GENERAL';
  let mcc = matchedMerchant?.mcc || '0000';

  // Keyword category heuristics if merchant is not catalogued
  if (!matchedMerchant) {
    if (
      lower.includes('grocery') ||
      lower.includes('supermarket') ||
      lower.includes('kirana') ||
      lower.includes('provisions')
    ) {
      category = 'GROCERY';
      mcc = '5411';
      merchantName = 'Supermarket / Grocery';
    } else if (
      lower.includes('dinner') ||
      lower.includes('lunch') ||
      lower.includes('restaurant') ||
      lower.includes('cafe') ||
      lower.includes('food') ||
      lower.includes('bar') ||
      lower.includes('dining')
    ) {
      category = 'DINING';
      mcc = '5812';
      merchantName = 'Restaurant / Dining';
    } else if (
      lower.includes('movie') ||
      lower.includes('cinema') ||
      lower.includes('theatre') ||
      lower.includes('tickets')
    ) {
      category = 'MOVIES';
      mcc = '7832';
      merchantName = 'Cinemas / Movie';
    } else if (
      lower.includes('flight') ||
      lower.includes('airline') ||
      lower.includes('hotel') ||
      lower.includes('trip') ||
      lower.includes('stay')
    ) {
      category = 'TRAVEL';
      mcc = '7011';
      merchantName = 'Travel / Hotel';
    } else if (
      lower.includes('utility') ||
      lower.includes('electricity') ||
      lower.includes('water bill') ||
      lower.includes('gas bill') ||
      lower.includes('broadband') ||
      lower.includes('wifi') ||
      lower.includes('recharge') ||
      lower.includes('dth')
    ) {
      category = 'UTILITIES';
      mcc = '4900';
      merchantName = 'Utilities & Bill Pay';
    } else if (
      lower.includes('fuel') ||
      lower.includes('petrol') ||
      lower.includes('diesel') ||
      lower.includes('gas station')
    ) {
      category = 'FUEL';
      mcc = '5541';
      merchantName = 'Fuel Pump';
    }
  }

  // 4. Payment Environment
  let paymentEnvironment: PaymentEnvironment = 'OFFLINE_POS';
  let isOnline = false;

  if (
    lower.includes('online') ||
    lower.includes('app') ||
    lower.includes('website') ||
    lower.includes('delivery') ||
    lower.includes('swiggy') ||
    lower.includes('zomato') ||
    lower.includes('amazon') ||
    lower.includes('blinkit') ||
    lower.includes('zepto')
  ) {
    paymentEnvironment = 'ONLINE';
    isOnline = true;
  } else if (
    lower.includes('qr') ||
    lower.includes('upi only') ||
    lower.includes('scan') ||
    lower.includes('bharatpe')
  ) {
    paymentEnvironment = 'UPI_QR_ONLY';
  } else if (matchedMerchant && !matchedMerchant.supportedEnvironments.includes('OFFLINE_POS')) {
    paymentEnvironment = matchedMerchant.supportedEnvironments[0] || 'ONLINE';
    isOnline = paymentEnvironment === 'ONLINE';
  }

  return {
    merchantName,
    category,
    mccEstimate: mcc,
    billAmount: roundToPaise(billAmount),
    isOnline,
    paymentEnvironment,
    channelPreferences: [],
    splitParts,
    parserSource: 'DETERMINISTIC_FALLBACK',
  };
}

/**
 * AI Intent Extraction using Gemini 3.8 Flash with Structured Output
 */
async function parseIntentWithGemini(
  query: string,
  apiKey: string
): Promise<ParsedQueryIntent> {
  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
You are a Principal FinTech & Payment Intent Extraction Engine specialized in the Indian payments ecosystem.
Parse the user's natural language payment query into structured parameters for the deterministic RewardOptimizerEngine.

Rules:
1. Identify the merchant (e.g. DMart, Mainland China, PVR Inox, Westside, Starbucks, Blinkit).
2. Infer SpendingCategory: "GROCERY" | "DINING" | "FOOD_DELIVERY" | "SHOPPING" | "MOVIES" | "TRAVEL" | "UTILITIES" | "FUEL" | "GENERAL".
3. Infer MCC (e.g. 5411 for Supermarkets, 5812 for Restaurants, 5814 for Fast Food, 5311 for Department Stores, 7832 for Movies, 7011 for Hotels, 4511 for Airlines).
4. Extract the exact bill amount in INR numbers. If multiple amounts are given (e.g. tickets and snacks), provide splitParts.
5. Infer paymentEnvironment: "OFFLINE_POS" | "ONLINE" | "UPI_QR_ONLY".
Output strictly valid JSON matching the schema.
`;

  const prompt = `User query: "${query}"`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: `${systemInstruction}\n\n${prompt}`,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  });

  const text = response.text || '';
  const parsed = JSON.parse(text);

  return {
    merchantName: parsed.merchantName || 'Merchant',
    category: (parsed.category as SpendingCategory) || 'GENERAL',
    mccEstimate: parsed.mccEstimate || '0000',
    billAmount: roundToPaise(Number(parsed.billAmount) || 2500),
    isOnline: Boolean(parsed.isOnline),
    paymentEnvironment:
      (parsed.paymentEnvironment as PaymentEnvironment) || 'OFFLINE_POS',
    channelPreferences: Array.isArray(parsed.channelPreferences)
      ? parsed.channelPreferences
      : [],
    splitParts: Array.isArray(parsed.splitParts) ? parsed.splitParts : undefined,
    parserSource: 'GEMINI_AI',
  };
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const validated = RequestSchema.safeParse(rawBody);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { query, wallet: customWallet } = validated.data;
    const wallet: UserWallet = customWallet || DEFAULT_USER_WALLET;

    // 1. Hybrid Neuro-Symbolic Parsing
    let parsedIntent: ParsedQueryIntent;
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey.trim().length > 5) {
      try {
        parsedIntent = await parseIntentWithGemini(query, apiKey);
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to deterministic parser:', geminiError);
        parsedIntent = parseIntentDeterministic(query);
      }
    } else {
      parsedIntent = parseIntentDeterministic(query);
    }

    // 2. Multi-Part Bill Splitting or Standard Single-Bill Optimization
    let multiPartResults:
      | Array<{
          part: ParsedSplitPart;
          optimization: OptimizationResult;
        }>
      | undefined;

    let primaryOptimization: OptimizationResult;

    if (parsedIntent.splitParts && parsedIntent.splitParts.length > 1) {
      // Optimize each split part separately
      multiPartResults = parsedIntent.splitParts.map((part) => {
        const partContext: QueryContext = {
          merchantName: parsedIntent.merchantName,
          category: part.category,
          billAmount: part.billAmount,
          paymentEnvironment: parsedIntent.paymentEnvironment,
          notes: part.description,
        };
        return {
          part,
          optimization: RewardOptimizerEngine.optimize(wallet, partContext),
        };
      });

      // Primary optimization on aggregate bill
      primaryOptimization = RewardOptimizerEngine.optimize(wallet, {
        merchantName: parsedIntent.merchantName,
        category: parsedIntent.category,
        billAmount: parsedIntent.billAmount,
        paymentEnvironment: parsedIntent.paymentEnvironment,
      });
    } else {
      primaryOptimization = RewardOptimizerEngine.optimize(wallet, {
        merchantName: parsedIntent.merchantName,
        category: parsedIntent.category,
        billAmount: parsedIntent.billAmount,
        paymentEnvironment: parsedIntent.paymentEnvironment,
      });
    }

    // 3. AI Explanation Synthesis
    const best = primaryOptimization.bestOverall;
    let aiSummary = `Optimal Strategy: Pay via ${best.title} to save ${formatINR(best.netSavingsInr)} (${formatPercent(best.effectiveReturnRate)}) on your ${formatINR(parsedIntent.billAmount)} bill at ${parsedIntent.merchantName}.`;

    if (best.strategyType === 'DINING_AGGREGATOR') {
      aiSummary = `Double-Dip Strategy: Settle bill via ${best.aggregatorName} for an upfront discount of ${formatINR(best.upfrontDiscountInr)} plus ${formatINR(best.cardCashbackInr)} cashback via ${best.instrumentName}. Total net return is ${formatPercent(best.effectiveReturnRate)}.`;
    } else if (best.strategyType === 'INSTANT_VOUCHER') {
      aiSummary = `Instant Voucher Hack: Buy a ${parsedIntent.merchantName} brand e-voucher on ${best.voucherPortalName} using ${best.instrumentName} to earn ${formatPercent(best.effectiveReturnRate)} accelerated reward points (${formatINR(best.netSavingsInr)} value) before paying at the counter.`;
    }

    if (primaryOptimization.missingCardOpportunity) {
      aiSummary += ` Note: ${primaryOptimization.missingCardOpportunity.fomoMessage}`;
    }

    return NextResponse.json({
      success: true,
      query,
      parsedIntent,
      optimization: primaryOptimization,
      multiPartResults,
      aiSummary,
    });
  } catch (error) {
    console.error('API Optimization Route Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error processing optimization query',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
