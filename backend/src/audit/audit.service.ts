import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../database/entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  async log(
    userId: string | null | undefined,
    action: string,
    module: string,
    description?: string,
    ip?: string,
    ua?: string,
  ): Promise<AuditLog> {
    const entry = this.auditRepo.create({
      userId: userId ?? undefined,
      action,
      module,
      description: description ?? undefined,
      ipAddress: ip,
      userAgent: ua,
    });
    return this.auditRepo.save(entry);
  }

  async findAll(filters?: {
    module?: string;
    userId?: string;
    limit?: number;
  }): Promise<AuditLog[]> {
    const query = this.auditRepo.createQueryBuilder('log');
    if (filters?.module) query.andWhere('log.module = :module', { module: filters.module });
    if (filters?.userId !== undefined) query.andWhere('log.userId = :userId', { userId: filters.userId });
    return query.orderBy('log.createdAt', 'DESC').take(filters?.limit ?? 100).getMany();
  }

  async findByUser(userId: string): Promise<AuditLog[]> {
    return this.auditRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByModule(moduleName: string): Promise<AuditLog[]> {
    return this.auditRepo.find({
      where: { module: moduleName },
      order: { createdAt: 'DESC' },
    });
  }
}
