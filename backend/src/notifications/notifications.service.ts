import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async createNotification(orgId: string, title: string, message: string, type: string, userId?: string) {
    const notification = await this.prisma.notification.create({
      data: {
        organizationId: orgId,
        userId,
        title,
        message,
        type,
      },
    });

    this.gateway.broadcastToOrg(orgId, 'notification', notification);
    return notification;
  }

  async getUnread(orgId: string) {
    return this.prisma.notification.findMany({
      where: {
        organizationId: orgId,
        read: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }
}
