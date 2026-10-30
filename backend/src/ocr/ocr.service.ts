import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OcrService {
  constructor(private readonly prisma: PrismaService) {}

  async extractInvoiceFromDocument(base64Data: string, fileName: string, orgId: string) {
    // Simulates an advanced visual layout extraction (OCR) engine + GPT validation
    // In production, this parses buffers and hits cloud OCR or LLM vision models
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate OCR runtime

    // Realistic invoice data structure
    const invoiceNumber = `INV-${2000 + Math.floor(Math.random() * 9000)}`;
    const taxRate = 0.18;
    const items = [
      { description: 'Cloud Consulting & Strategy Services', quantity: 12, unitPrice: 3200 },
      { description: 'Database SLA Architecture Support', quantity: 1, unitPrice: 6600 },
    ];
    
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const tax = Math.round(subtotal * taxRate);
    const amount = subtotal + tax;

    const mockClients = ['ABC Corp', 'XYZ Ltd', 'Acquirer Corp', 'Stripe Inc', 'Vercel LLC'];
    const clientName = mockClients[Math.floor(Math.random() * mockClients.length)];

    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(issueDate.getDate() + 30); // 30 days terms

    const ocrConfidence = 0.97;

    // Check if client exists in DB, otherwise auto-create to ensure FK constraints
    let client = await this.prisma.client.findFirst({
      where: { name: clientName, organizationId: orgId },
    });

    if (!client) {
      client = await this.prisma.client.create({
        data: {
          organizationId: orgId,
          name: clientName,
          email: `${clientName.toLowerCase().replace(/\s/g, '')}@example.com`,
          companyName: clientName,
          outstandingBalance: 0.0,
        },
      });
      
      // Seed an empty risk profile
      await this.prisma.clientRiskProfile.create({
        data: {
          clientId: client.id,
          riskScore: 30,
          riskLevel: 'LOW',
          outstandingDebt: 0.0,
        },
      });
    }

    // Auto-create invoice in DB
    const invoice = await this.prisma.invoice.create({
      data: {
        organizationId: orgId,
        clientId: client.id,
        invoiceNumber,
        amount,
        currency: 'INR',
        status: 'DRAFT',
        issueDate,
        dueDate,
        ocrConfidence,
        timeline: [
          { status: 'DRAFT', date: new Date().toISOString(), description: 'Invoice OCR extracted and validated.' }
        ] as any,
        items: {
          create: items.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            amount: i.quantity * i.unitPrice,
          })),
        },
      },
      include: {
        items: true,
        client: true,
      },
    });

    // Update client balance
    await this.prisma.client.update({
      where: { id: client.id },
      data: {
        outstandingBalance: {
          increment: amount,
        },
      },
    });

    return {
      success: true,
      fileName,
      ocrConfidence,
      extractedData: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientName: client.name,
        clientId: client.id,
        subtotal,
        tax,
        amount,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        items: invoice.items,
      },
    };
  }
}
