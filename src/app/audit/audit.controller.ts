
import { Controller, Get, Post, Body, Req, UseGuards, Inject } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Assume this will be created or standard
import { RolesGuard } from '@secure-task-manage-app-angular/auth/roles.guard';
import { Roles } from '@secure-task-manage-app-angular/auth/roles.decorator'; // Need this too
import { UserRole, ActionType } from '@secure-task-manage-app-angular/data/enums';
// Re-using existent guards from previous steps or creating new ones if needed.
// Requirement says "JwtAuthGuard - protect ALL task and audit endpoints"

@Controller('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
    constructor(@Inject(AuditService) private auditService: AuditService) { }

    @Get()
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    async findAll() {
        // Basic implementation to return logs
        // Assuming auditService has findAll method, or we use repo directly if service was minimal
        // The service I created in step 151 only has logAction. I should add findAll to service first or just use repo here?
        // Better to update service.
        return this.auditService.findAll();
    }

    @Post()
    async create(@Req() req: any, @Body() body: { action: string, resourceType?: string, resourceId?: string }) {
        let action: ActionType = ActionType.UPDATE; // Default
        let resourceType = body.resourceType || 'UNKNOWN';

        const actionUpper = body.action.toUpperCase();
        if (Object.values(ActionType).includes(body.action as ActionType)) {
            action = body.action as ActionType;
        } else if (actionUpper.includes('UPDATE')) {
            action = ActionType.UPDATE;
        } else if (actionUpper.includes('CREATE')) {
            action = ActionType.CREATE;
        } else if (actionUpper.includes('DELETE')) {
            action = ActionType.DELETE;
        } else if (actionUpper.includes('READ')) {
            action = ActionType.READ;
        }

        if (body.action.includes('Profile')) {
            resourceType = 'USER';
        } else if (body.action.includes('Task')) {
            resourceType = 'TASK';
        } else if (body.action.includes('Organization')) {
            resourceType = 'ORGANIZATION';
        }

        return this.auditService.logAction(req.user.id, action, resourceType, body.resourceId);
    }
}
