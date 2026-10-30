import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrg(name: string, slug: string) {
    const existing = await this.prisma.organization.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException('Slug already in use.');
    }

    return this.prisma.organization.create({
      data: { name, slug },
    });
  }

  async getOrg(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: { memberships: { include: { user: true } } },
    });

    if (!org) {
      throw new NotFoundException('Organization not found.');
    }
    return org;
  }

  async listOrgs() {
    return this.prisma.organization.findMany();
  }
}
