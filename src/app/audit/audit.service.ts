
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '@secure-task-manage-app-angular/data/entities';
import { ActionType } from '@secure-task-manage-app-angular/data/enums';

@Injectable()
export class AuditService {
    constructor(
        @InjectRepository(AuditLog)
        private auditRepo: Repository<AuditLog>
    ) { }

    async logAction(userId: string, action: ActionType, resourceType: string, resourceId?: string) {
        const log = this.auditRepo.create({
            userId,
            action,
            resourceType,
            resourceId,
        });
        console.log(`[AUDIT] User ${userId} performed ${action} on ${resourceType}:${resourceId}`);
        return this.auditRepo.save(log);
    }

    async findAll() {
        return this.auditRepo.find({ order: { timestamp: 'DESC' } });
    }
}
