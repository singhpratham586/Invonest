import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportType } from '@prisma/client';
import { ForecastingService } from '../forecasting/forecasting.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly forecasting: ForecastingService,
  ) {}

  async generateAgingReport(orgId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        organizationId: orgId,
        status: { not: 'PAID' },
      },
    });

    const today = new Date();
    const buckets = {
      current: 0,
      bracket30: 0, // 1-30 days overdue
      bracket60: 0, // 31-60 days overdue
      bracket90: 0, // 61-90 days overdue
      bracket90Plus: 0, // 91+ days overdue
    };

    invoices.forEach((inv) => {
      const amount = Number(inv.amount);
      const dueDate = new Date(inv.dueDate);

      if (today <= dueDate) {
        buckets.current += amount;
      } else {
        const delayDays = Math.ceil(
          (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (delayDays <= 30) {
          buckets.bracket30 += amount;
        } else if (delayDays <= 60) {
          buckets.bracket60 += amount;
        } else if (delayDays <= 90) {
          buckets.bracket90 += amount;
        } else {
          buckets.bracket90Plus += amount;
        }
      }
    });

    return {
      organizationId: orgId,
      computedAt: today,
      agingReport: {
        current: Math.round(buckets.current),
        '1-30_days': Math.round(buckets.bracket30),
        '31-60_days': Math.round(buckets.bracket60),
        '61-90_days': Math.round(buckets.bracket90),
        '90+_days': Math.round(buckets.bracket90Plus),
        totalOutstanding: Math.round(
          buckets.current +
            buckets.bracket30 +
            buckets.bracket60 +
            buckets.bracket90 +
            buckets.bracket90Plus,
        ),
      },
    };
  }

  async generateExecutiveWeeklySummary(orgId: string) {
    const forecast = await this.forecasting.getForecast(orgId, 30);
    const aging = await this.generateAgingReport(orgId);

    const reportParams = {
      generatedAt: new Date().toISOString(),
      revenueSummary: {
        expectedCollections: forecast.expectedCollections,
        forecastCash: forecast.predictedCashPosition,
        outstandingDebt: aging.agingReport.totalOutstanding,
        atRiskExposure: forecast.atRiskRevenue,
      },
      agingBuckets: aging.agingReport,
    };

    const dbReport = await this.prisma.report.create({
      data: {
        organizationId: orgId,
        type: ReportType.CASHFLOW,
        generatedBy: 'SYSTEM_SCHEDULER',
        fileUrl: `/reports/download/executive_weekly_${orgId}_${Date.now()}.pdf`,
        parameters: reportParams as any,
      },
    });

    return dbReport;
  }
}
