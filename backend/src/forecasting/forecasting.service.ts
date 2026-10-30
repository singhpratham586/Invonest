import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ForecastingService {
  constructor(private readonly prisma: PrismaService) {}

  async getForecast(orgId: string, rangeDays: number = 30) {
    // 1. Gather all invoices not paid in organization
    const invoices = await this.prisma.invoice.findMany({
      where: {
        organizationId: orgId,
        status: { not: 'PAID' },
      },
      include: {
        client: { include: { riskProfile: true } },
      },
    });

    const today = new Date();
    const rangeLimitDate = new Date();
    rangeLimitDate.setDate(today.getDate() + rangeDays);

    let expectedCollections = 0;
    let expectedRevenue = 0; // Invoiced within this range
    let atRiskRevenue = 0;

    const collectionsTimeline = [];

    invoices.forEach((inv) => {
      const amount = Number(inv.amount);
      const dueDate = new Date(inv.dueDate);
      const isWithinRange = dueDate <= rangeLimitDate && dueDate >= today;

      // Classify risk exposure
      const riskScore = inv.client.riskProfile ? inv.client.riskProfile.riskScore : 30;

      if (isWithinRange) {
        expectedRevenue += amount;
      }

      if (inv.status === 'OVERDUE') {
        atRiskRevenue += amount;
      } else if (riskScore > 70) {
        atRiskRevenue += amount * 0.7; // Weighted at-risk
        expectedCollections += amount * 0.3;
      } else if (riskScore > 40) {
        atRiskRevenue += amount * 0.3;
        expectedCollections += amount * 0.7;
      } else {
        expectedCollections += amount * 0.95;
        atRiskRevenue += amount * 0.05;
      }
    });

    // Subtotal calculations
    const predictedCashPosition = 1200000 + expectedCollections - atRiskRevenue; // Base 12L + forecast

    // Construct Confidence Bands (Best, Expected, Worst cases)
    // Best case: High recovery rate, no delays
    // Worst case: Defaults, delayed recovery
    const confidenceBands = {
      bestCase: Math.round(predictedCashPosition + atRiskRevenue * 0.8),
      expectedCase: Math.round(predictedCashPosition),
      worstCase: Math.round(predictedCashPosition - atRiskRevenue * 0.5),
    };

    // Store in DB history for analytical graphs
    const forecast = await this.prisma.cashflowForecast.create({
      data: {
        organizationId: orgId,
        forecastDate: today,
        expectedCollections,
        expectedRevenue,
        atRiskRevenue,
        predictedCashPosition,
        confidenceBands: confidenceBands as any,
        confidence: 0.88,
        rangeDays,
      },
    });

    return {
      ...forecast,
      expectedCollections: Math.round(expectedCollections),
      expectedRevenue: Math.round(expectedRevenue),
      atRiskRevenue: Math.round(atRiskRevenue),
      predictedCashPosition: Math.round(predictedCashPosition),
      confidenceBands,
    };
  }

  async runScenarioSimulation(orgId: string, scenario: string, clientName?: string, percentageChange?: number, valueAmount?: number) {
    // Fetches baseline metrics first
    const baseline = await this.getForecast(orgId, 30);
    const originalCash = baseline.predictedCashPosition;

    let simulationResult = {
      scenario,
      originalCash,
      simulatedCash: originalCash,
      impactAmount: 0,
      confidence: 0.9,
      explanation: '',
    };

    switch (scenario) {
      case 'DELAYED_PAYMENT':
        // Case: Client XYZ pays 20 days late (Cash flow drops by client's total invoice value temporarily)
        const delayClient = clientName || 'XYZ Corp';
        const client = await this.prisma.client.findFirst({
          where: {
            organizationId: orgId,
            name: { contains: delayClient, mode: 'insensitive' },
          },
          include: { invoices: { where: { status: { not: 'PAID' } } } },
        });

        const delayedAmt = client
          ? client.invoices.reduce((sum, inv) => sum + Number(inv.amount), 0)
          : 120000; // Mock default if client not seeded

        simulationResult.impactAmount = -delayedAmt;
        simulationResult.simulatedCash = originalCash - delayedAmt;
        simulationResult.explanation = `If client ${delayClient} delays payment, cash inflow of ₹${delayedAmt.toLocaleString()} shifts past the 30-day forecast horizon.`;
        break;

      case 'COLLECTIONS_IMPROVEMENT':
        // Case: Recovery rate increases (outstanding collections improve by percentage)
        const improvementFactor = (percentageChange || 15) / 100;
        const totalOutstanding = baseline.atRiskRevenue;
        const gainedLiquidity = Math.round(totalOutstanding * improvementFactor);

        simulationResult.impactAmount = gainedLiquidity;
        simulationResult.simulatedCash = originalCash + gainedLiquidity;
        simulationResult.explanation = `Improving collection efficiency by ${percentageChange || 15}% recovers ₹${gainedLiquidity.toLocaleString()} of at-risk accounts receivable.`;
        break;

      case 'SALES_DROP':
        // Case: Revenue shrinks by sales drop factor
        const dropFactor = (percentageChange || 15) / 100;
        const baselineRevenue = baseline.expectedRevenue;
        const revenueLoss = Math.round(baselineRevenue * dropFactor);

        simulationResult.impactAmount = -revenueLoss;
        simulationResult.simulatedCash = originalCash - revenueLoss;
        simulationResult.explanation = `A ${percentageChange || 15}% drop in new invoiced bookings reduces cash reserves by ₹${revenueLoss.toLocaleString()}.`;
        break;

      case 'PAYROLL_INCREASE':
        // Case: Payroll overhead shifts up
        const payrollBump = valueAmount || 50000;
        simulationResult.impactAmount = -payrollBump;
        simulationResult.simulatedCash = originalCash - payrollBump;
        simulationResult.explanation = `Increasing headcounts/payroll overhead shifts baseline operating costs up by ₹${payrollBump.toLocaleString()} monthly.`;
        break;

      case 'CLIENT_DEFAULT':
        // Case: Client defaults (entire exposure lost permanently)
        const defaultClient = clientName || 'XYZ Corp';
        const dClient = await this.prisma.client.findFirst({
          where: {
            organizationId: orgId,
            name: { contains: defaultClient, mode: 'insensitive' },
          },
          include: { invoices: { where: { status: { not: 'PAID' } } } },
        });

        const writeOffAmt = dClient
          ? dClient.invoices.reduce((sum, inv) => sum + Number(inv.amount), 0)
          : 180000; // Mock default if client not seeded

        simulationResult.impactAmount = -writeOffAmt;
        simulationResult.simulatedCash = originalCash - writeOffAmt;
        simulationResult.explanation = `A complete write-off/default by client ${defaultClient} forces a bad-debt adjustment of -₹${writeOffAmt.toLocaleString()} immediately.`;
        break;

      default:
        simulationResult.explanation = 'Unknown scenario specified.';
    }

    return simulationResult;
  }
}
