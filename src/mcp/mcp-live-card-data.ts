/**
 * PayWise India — MCP Live Card Data Service
 * Implements Model Context Protocol (MCP) compatible tools and resources for querying
 * all 60 Indian Credit & RuPay UPI cards, category accelerators, and active devaluation alerts.
 */

import {
  INDIAN_CARDS_60_CATALOG,
  CARDS_60_MAP,
  CARDS_BY_CATEGORY,
  CardCategoryGroup,
  DevaluationWarning,
} from '@/data/indian-cards-catalog';

export interface McpToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<
      string,
      {
        type: string;
        description: string;
        enum?: string[];
      }
    >;
    required?: string[];
  };
}

export interface McpResourceDefinition {
  uri: string;
  name: string;
  mimeType: string;
  description: string;
}

export interface McpToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

export interface MerchantQueryRecommendation {
  cardSlug: string;
  cardName: string;
  issuer: string;
  network: string;
  effectiveYieldPercent: number;
  monthlyCapInr: number | null;
  channelRequired?: string;
  promoCode?: string;
  reason: string;
}

/**
 * Standard MCP Tool Definitions for AI Agents
 */
export const MCP_CARD_TOOLS: McpToolDefinition[] = [
  {
    name: 'search_cards',
    description:
      'Search across all 60 Indian Credit & RuPay UPI cards by query keywords (e.g. "0% forex", "PhonePe", "Zomato", "Grocery", "DMart", "Lounge", "RuPay UPI").',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search keyword, brand name, bank name, or benefit category',
        },
        categoryGroup: {
          type: 'string',
          description: 'Optional filter by category group',
          enum: [
            'FOOD_DINING_GROCERY',
            'UPI_TELECOM_FINTECH',
            'ECOMMERCE_CASHBACK',
            'PREMIUM_TRAVEL_ZERO_FOREX',
            'FUEL_ENTERTAINMENT_LIFESTYLE',
          ],
        },
        upiOnly: {
          type: 'boolean',
          description: 'If true, returns only RuPay cards linkable to UPI Apps',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_card_details',
    description:
      'Fetch full rules, fee structures, accelerators, caps, and devaluation warnings for a specific card by slug.',
    parameters: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'The unique card slug identifier (e.g., "hdfc-phonepe-ultimo" or "federal-paisaback")',
        },
      },
      required: ['slug'],
    },
  },
  {
    name: 'get_devaluation_alerts',
    description:
      'Audit and retrieve all structured devaluation warnings across the 60 Indian cards (e.g., lounge removals, discontinued cards, slashed international rewards).',
    parameters: {
      type: 'object',
      properties: {
        severity: {
          type: 'string',
          description: 'Filter alerts by severity level',
          enum: ['HIGH', 'MEDIUM', 'LOW'],
        },
      },
    },
  },
  {
    name: 'find_best_cards_for_merchant',
    description:
      'Evaluate all 60 Indian cards to find the highest-yielding payment instruments for a specific merchant or category (e.g., DMart, Swiggy, Airtel, BPCL).',
    parameters: {
      type: 'object',
      properties: {
        merchantName: {
          type: 'string',
          description: 'Name of the merchant (e.g. "DMart", "Swiggy", "Airtel Thanks", "PVR", "BPCL")',
        },
        category: {
          type: 'string',
          description: 'Spending category (e.g. "GROCERY", "DINING", "UTILITIES", "TRAVEL", "FUEL")',
        },
        isOfflinePos: {
          type: 'boolean',
          description: 'Whether the transaction is at an offline POS counter',
        },
      },
      required: ['merchantName'],
    },
  },
  {
    name: 'filter_cards_by_category',
    description: 'Retrieve all cards belonging to one of the 5 official card categories.',
    parameters: {
      type: 'object',
      properties: {
        categoryGroup: {
          type: 'string',
          description: 'The category group identifier',
          enum: [
            'FOOD_DINING_GROCERY',
            'UPI_TELECOM_FINTECH',
            'ECOMMERCE_CASHBACK',
            'PREMIUM_TRAVEL_ZERO_FOREX',
            'FUEL_ENTERTAINMENT_LIFESTYLE',
          ],
        },
      },
      required: ['categoryGroup'],
    },
  },
];

/**
 * Standard MCP Resources
 */
export const MCP_CARD_RESOURCES: McpResourceDefinition[] = [
  {
    uri: 'cards://all-catalog',
    name: 'Complete 60 Indian Cards Master Catalog',
    mimeType: 'application/json',
    description: 'Exhaustive rule catalog of all 60 Indian credit and RuPay UPI cards with yield bps and caps.',
  },
  {
    uri: 'cards://devaluation-bulletin',
    name: 'Indian Cards Devaluation Bulletin',
    mimeType: 'application/json',
    description: 'Active and upcoming bank devaluations, lounge removals, and program discontinuations.',
  },
  {
    uri: 'cards://categories',
    name: 'Indian Cards by Category Groups',
    mimeType: 'application/json',
    description: 'Cards grouped into Food/Dining, UPI/Fintech, E-commerce, Travel/Zero-Forex, and Fuel/Lifestyle.',
  },
];

/**
 * MCP Tool Executor
 */
export async function executeMcpTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<McpToolResult> {
  try {
    switch (toolName) {
      case 'search_cards': {
        const query = String(args.query || '').toLowerCase().trim();
        const categoryGroup = args.categoryGroup as CardCategoryGroup | undefined;
        const upiOnly = Boolean(args.upiOnly);

        let results = INDIAN_CARDS_60_CATALOG;

        if (categoryGroup) {
          results = results.filter((c) => c.categoryGroup === categoryGroup);
        }

        if (upiOnly) {
          results = results.filter((c) => c.upiLinkable);
        }

        if (query) {
          results = results.filter((c) => {
            const inName = c.name.toLowerCase().includes(query);
            const inIssuer = c.issuer.toLowerCase().includes(query);
            const inSlug = c.slug.toLowerCase().includes(query);
            const inPerks = c.keyPerks.some((p) => p.toLowerCase().includes(query));
            const inTags = c.searchTags?.some((t) => t.toLowerCase().includes(query)) || false;
            const inAccelerators = c.categoryAccelerators.some((a) =>
              a.categoryOrMerchant.toLowerCase().includes(query)
            );
            return inName || inIssuer || inSlug || inPerks || inTags || inAccelerators;
          });
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  count: results.length,
                  cards: results.map((c) => ({
                    slug: c.slug,
                    name: c.name,
                    issuer: c.issuer,
                    network: c.network,
                    upiLinkable: c.upiLinkable,
                    annualFeeInr: c.annualFeeInr,
                    baseRewardRate: `${(c.baseRewardRateBps / 100).toFixed(2)}%`,
                    forexMarkup: `${(c.forexMarkupBps / 100).toFixed(2)}%`,
                    keyPerks: c.keyPerks,
                    devaluationsCount: c.devaluationWarnings.length,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_card_details': {
        const slug = String(args.slug || '').toLowerCase().trim();
        const card = CARDS_60_MAP.get(slug);

        if (!card) {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: `Card not found with slug: "${slug}". Valid slugs include "hdfc-phonepe-ultimo", "federal-paisaback", "hsbc-live-plus", etc.`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(card, null, 2),
            },
          ],
        };
      }

      case 'get_devaluation_alerts': {
        const severityFilter = args.severity ? String(args.severity).toUpperCase() : undefined;
        const alerts: Array<{
          cardSlug: string;
          cardName: string;
          issuer: string;
          warning: DevaluationWarning;
        }> = [];

        for (const card of INDIAN_CARDS_60_CATALOG) {
          for (const warning of card.devaluationWarnings) {
            if (!severityFilter || warning.severity === severityFilter) {
              alerts.push({
                cardSlug: card.slug,
                cardName: card.name,
                issuer: card.issuer,
                warning,
              });
            }
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  totalDevaluationAlerts: alerts.length,
                  alerts,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'find_best_cards_for_merchant': {
        const merchant = String(args.merchantName || '').toLowerCase().trim();
        const category = String(args.category || '').toUpperCase().trim();
        const isOffline = args.isOfflinePos !== undefined ? Boolean(args.isOfflinePos) : true;

        const recommendations: MerchantQueryRecommendation[] = [];

        for (const card of INDIAN_CARDS_60_CATALOG) {
          // Check accelerators
          for (const acc of card.categoryAccelerators) {
            const matchesMerchant = acc.categoryOrMerchant.toLowerCase().includes(merchant);
            const matchesCategory =
              category && acc.categoryOrMerchant.toUpperCase().includes(category);

            // Check offline constraint
            if (acc.isOnlineOnly && isOffline) continue;

            if (matchesMerchant || matchesCategory) {
              recommendations.push({
                cardSlug: card.slug,
                cardName: card.name,
                issuer: card.issuer,
                network: card.network,
                effectiveYieldPercent: acc.effectiveYieldBps / 100,
                monthlyCapInr: acc.monthlyCapInr,
                channelRequired: acc.requiresAppChannel,
                promoCode: acc.promoCode,
                reason: acc.description || `${acc.effectiveYieldBps / 100}% on ${acc.categoryOrMerchant}`,
              });
            }
          }
        }

        // Sort by highest effective yield
        recommendations.sort((a, b) => b.effectiveYieldPercent - a.effectiveYieldPercent);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  merchantQuery: merchant,
                  topRecommendations: recommendations.slice(0, 8),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'filter_cards_by_category': {
        const group = args.categoryGroup as CardCategoryGroup;
        const cards = CARDS_BY_CATEGORY[group] || [];

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  categoryGroup: group,
                  count: cards.length,
                  cards: cards.map((c) => ({
                    slug: c.slug,
                    name: c.name,
                    issuer: c.issuer,
                    network: c.network,
                    upiLinkable: c.upiLinkable,
                    annualFeeInr: c.annualFeeInr,
                    baseRewardRate: `${(c.baseRewardRateBps / 100).toFixed(2)}%`,
                    keyPerks: c.keyPerks,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Unknown MCP tool: "${toolName}". Available tools: ${MCP_CARD_TOOLS.map((t) => t.name).join(', ')}`,
            },
          ],
        };
    }
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Error executing MCP tool "${toolName}": ${(error as Error).message}`,
        },
      ],
    };
  }
}

/**
 * MCP Resource Reader
 */
export async function readMcpResource(uri: string): Promise<string> {
  switch (uri) {
    case 'cards://all-catalog':
      return JSON.stringify(INDIAN_CARDS_60_CATALOG, null, 2);
    case 'cards://devaluation-bulletin': {
      const allDevaluations = INDIAN_CARDS_60_CATALOG.flatMap((c) =>
        c.devaluationWarnings.map((w) => ({
          cardSlug: c.slug,
          cardName: c.name,
          warning: w,
        }))
      );
      return JSON.stringify(allDevaluations, null, 2);
    }
    case 'cards://categories':
      return JSON.stringify(CARDS_BY_CATEGORY, null, 2);
    default:
      throw new Error(`Unknown resource URI: ${uri}`);
  }
}
