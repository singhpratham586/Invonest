import { NotFoundException } from '@nestjs/common';
import { RiskEngineService } from './risk-engine.service';

/**
 * Unit tests for the credit risk engine. The scoring math lives inside
 * Prisma-backed methods, so we drive it with a mocked Prisma client and assert
 * the real computed outputs (health score, risk level, payment reliability,
 * credit limit, invoice risk score and probability curve).
 */

const DAY = 24 * 60 * 60 * 1000;

function makePrisma() {
  return {
    client: { findUnique: jest.fn() },
    invoice: { aggregate: jest.fn(), findUnique: jest.fn() },
    clientRiskProfile: { upsert: jest.fn().mockResolvedValue({}) },
    // echo the created row back so we can assert on the computed prediction
    riskPrediction: {
      upsert: jest.fn().mockImplementation((args: any) => Promise.resolve(args.create)),
    },
  };
}

function paidInvoice(amount: number, delayDays: number) {
  const dueDate = new Date('2026-01-01T00:00:00Z');
  const paidAt = new Date(dueDate.getTime() + delayDays * DAY);
  return { amount, status: 'PAID', dueDate, paidAt, payments: [] };
}

describe('RiskEngineService.calculateClientHealthScore', () => {
  it('scores a perfectly reliable client at 100 / HEALTHY', async () => {
    const prisma = makePrisma();
    prisma.client.findUnique.mockResolvedValue({
      id: 'c1',
      name: 'Acme',
      organizationId: 'org1',
      outstandingBalance: 0,
      invoices: [paidInvoice(100000, 0), paidInvoice(100000, 0), paidInvoice(100000, 0)],
    });
    prisma.invoice.aggregate.mockResolvedValue({ _sum: { amount: 300000 } });

    const svc = new RiskEngineService(prisma as any);
    const r = await svc.calculateClientHealthScore('c1');

    expect(r.healthScore).toBe(100);
    expect(r.riskLevel).toBe('HEALTHY');
    expect(r.paymentReliability).toBe(100);
    expect(r.hasSufficientHistory).toBe(true);
    expect(r.paidInvoiceCount).toBe(3);
    expect(r.averageDelayDays).toBe(0);
    expect(r.creditLimit).toBe(300000); // 3x avg invoice, unscaled at 100% reliability
    expect(r.creditConfidence).toBe(0.72); // 0.7 + (3/50)*0.28
  });

  it('withholds the reliability number below the minimum paid-invoice history', async () => {
    const prisma = makePrisma();
    prisma.client.findUnique.mockResolvedValue({
      id: 'c2',
      name: 'Newcomer',
      organizationId: 'org1',
      outstandingBalance: 0,
      invoices: [paidInvoice(100000, 0)],
    });
    prisma.invoice.aggregate.mockResolvedValue({ _sum: { amount: 100000 } });

    const svc = new RiskEngineService(prisma as any);
    const r = await svc.calculateClientHealthScore('c2');

    expect(r.hasSufficientHistory).toBe(false);
    expect(r.paymentReliability).toBeNull();
    expect(r.paidInvoiceCount).toBe(1);
  });

  it('penalizes a consistently late payer and lowers the credit limit', async () => {
    const prisma = makePrisma();
    prisma.client.findUnique.mockResolvedValue({
      id: 'c3',
      name: 'Slowpay',
      organizationId: 'org1',
      outstandingBalance: 0,
      invoices: [paidInvoice(100000, 20), paidInvoice(100000, 20), paidInvoice(100000, 20)],
    });
    prisma.invoice.aggregate.mockResolvedValue({ _sum: { amount: 300000 } });

    const svc = new RiskEngineService(prisma as any);
    const r = await svc.calculateClientHealthScore('c3');

    expect(r.paymentReliability).toBe(50); // 100 - 20*2.5
    expect(r.averageDelayDays).toBe(20);
    expect(r.healthScore).toBe(75); // 50*.5 + 100*.3 + 100*.2
    expect(r.riskLevel).toBe('MONITOR');
    expect(r.creditLimit).toBe(150000); // 3x avg invoice scaled by 50% reliability
  });

  it('throws when the client does not exist', async () => {
    const prisma = makePrisma();
    prisma.client.findUnique.mockResolvedValue(null);
    const svc = new RiskEngineService(prisma as any);
    await expect(svc.calculateClientHealthScore('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('requires 3 paid invoices before reliability is trusted', () => {
    expect(RiskEngineService.MIN_PAID_INVOICES_FOR_RELIABILITY).toBe(3);
  });
});

describe('RiskEngineService.predictInvoiceRisk', () => {
  it('computes risk, probability curve and predicted date for an in-terms invoice', async () => {
    const prisma = makePrisma();
    const dueDate = new Date('2099-01-01T00:00:00Z'); // future → not overdue
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'inv1',
      amount: 100000,
      dueDate,
      status: 'SENT',
      client: { riskProfile: { riskScore: 30, averageDelayDays: 5, riskLevel: 'MONITOR' } },
    });

    const svc = new RiskEngineService(prisma as any);
    const r: any = await svc.predictInvoiceRisk('inv1');

    expect(r.riskScore).toBe(15); // 30*0.5, no amount/overdue penalty
    expect(r.probabilityCurve).toEqual({ day7: '84%', day14: '89%', day30: '95%' });
    expect(r.confidence).toBe(0.95); // low risk (<30) adds confidence
    const bufferDays = Math.round((r.predictedPaymentDate.getTime() - dueDate.getTime()) / DAY);
    expect(bufferDays).toBe(7); // avgDelay 5 + riskScore/10
  });

  it('throws when the invoice does not exist', async () => {
    const prisma = makePrisma();
    prisma.invoice.findUnique.mockResolvedValue(null);
    const svc = new RiskEngineService(prisma as any);
    await expect(svc.predictInvoiceRisk('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
