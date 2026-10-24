import { describe, it, expect } from 'vitest';
import { parseIntentDeterministic, POST } from '@/app/api/optimize/route';
import { NextRequest } from 'next/server';

describe('/api/optimize - Intent Parser & API Route', () => {
  describe('Deterministic Offline Intent Parser', () => {
    it('parses "I\'m at DMart with a ₹3,500 bill"', () => {
      const intent = parseIntentDeterministic("I'm at DMart with a ₹3,500 bill");
      expect(intent.merchantName).toBe('DMart (Avenue Supermarts)');
      expect(intent.category).toBe('GROCERY');
      expect(intent.mccEstimate).toBe('5411');
      expect(intent.billAmount).toBe(3500);
      expect(intent.paymentEnvironment).toBe('OFFLINE_POS');
      expect(intent.parserSource).toBe('DETERMINISTIC_FALLBACK');
    });

    it('parses "Dinner at Mainland China with 4200 bill"', () => {
      const intent = parseIntentDeterministic('Dinner at Mainland China with 4200 bill');
      expect(intent.merchantName).toBe('Mainland China Restaurant');
      expect(intent.category).toBe('DINING');
      expect(intent.mccEstimate).toBe('5812');
      expect(intent.billAmount).toBe(4200);
    });

    it('parses multi-part split bill: "Watching a movie at PVR with 3 friends, tickets 1200 and snacks 600"', () => {
      const intent = parseIntentDeterministic(
        'Watching a movie at PVR with 3 friends, tickets 1200 and snacks 600'
      );
      expect(intent.splitParts).toBeDefined();
      expect(intent.splitParts?.length).toBe(2);
      expect(intent.splitParts?.[0]?.description).toBe('Movie Tickets');
      expect(intent.splitParts?.[0]?.billAmount).toBe(1200);
      expect(intent.splitParts?.[1]?.description).toBe('Snacks & Popcorn');
      expect(intent.splitParts?.[1]?.billAmount).toBe(600);
      expect(intent.billAmount).toBe(1800);
    });

    it('detects UPI QR environment from "280 at local cafe (UPI QR only)"', () => {
      const intent = parseIntentDeterministic('280 at local cafe (UPI QR only)');
      expect(intent.billAmount).toBe(280);
      expect(intent.paymentEnvironment).toBe('UPI_QR_ONLY');
    });
  });

  describe('POST /api/optimize Handler', () => {
    it('returns successful optimization for standard single bill', async () => {
      const req = new NextRequest('http://localhost:3000/api/optimize', {
        method: 'POST',
        body: JSON.stringify({
          query: "I'm at DMart with a ₹3,500 bill",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.parsedIntent.merchantName).toContain('DMart');
      expect(data.optimization.bestOverall).toBeDefined();
      expect(data.aiSummary).toContain('Optimal Strategy');
    });

    it('returns multi-part optimization breakdown for split bills', async () => {
      const req = new NextRequest('http://localhost:3000/api/optimize', {
        method: 'POST',
        body: JSON.stringify({
          query: 'At PVR cinemas, tickets 1200 and snacks 600',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.multiPartResults).toBeDefined();
      expect(data.multiPartResults?.length).toBe(2);
    });

    it('returns 400 when query is empty', async () => {
      const req = new NextRequest('http://localhost:3000/api/optimize', {
        method: 'POST',
        body: JSON.stringify({
          query: '',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });
});
