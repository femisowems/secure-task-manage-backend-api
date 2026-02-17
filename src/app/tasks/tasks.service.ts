
import { Injectable, ForbiddenException, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task, User } from '@secure-task-manage-app-angular/data/entities';
import { RbacService } from '@secure-task-manage-app-angular/auth/rbac.service';
import { OrgScopeService } from '@secure-task-manage-app-angular/auth/org-scope.service';
import { AuditService } from '../audit/audit.service';
import { ActionType, UserRole } from '@secure-task-manage-app-angular/data/enums';

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(Task)
        private tasksRepo: Repository<Task>,
        @Inject(RbacService)
        private rbacService: RbacService,
        @Inject(OrgScopeService)
        private orgScopeService: OrgScopeService,
        @Inject(AuditService)
        private auditService: AuditService
    ) { }

    async create(user: User, taskData: Partial<Task>): Promise<Task> {
        // CreateTask: All roles allowed, orgId must match user's org
        if (taskData.organizationId && taskData.organizationId !== user.organizationId) {
            throw new ForbiddenException('Cannot create task in another organization');
        }

        const newTask = this.tasksRepo.create({
            ...taskData,
            organizationId: user.organizationId,
            createdBy: user.id
        });

        // Explicitly define organization relationship if needed by TypeORM cascade, 
        // but setting ID column usually enough.

        const saved = await this.tasksRepo.save(newTask);
        this.auditService.logAction(user.id, ActionType.CREATE, 'Task', saved.id);
        return saved;
    }

    async findAll(user: User): Promise<Task[]> {
        // ReadTasks
        // Owner/Admin -> tasks where organizationId IN accessibleOrgIds
        // Viewer -> tasks where createdBy = user.id (AND implicitly in their org)

        if (user.role === UserRole.VIEWER) {
            return this.tasksRepo.find({
                where: {
                    createdBy: user.id
                }
            });
        }

        // Owner/Admin
        const accessibleOrgs = await this.orgScopeService.getAccessibleOrganizationIds(user);
        if (accessibleOrgs.length === 0) return [];

        return this.tasksRepo.find({
            where: {
                organizationId: In(accessibleOrgs)
            }
        });
    }

    async update(user: User, id: string, updateData: Partial<Task>): Promise<Task> {
        const task = await this.tasksRepo.findOne({ where: { id } });
        if (!task) throw new NotFoundException('Task not found');

        const allowed = await this.rbacService.canUpdateTask(user, task);
        if (!allowed) throw new ForbiddenException('Cannot update this task');

        Object.assign(task, updateData);
        const updated = await this.tasksRepo.save(task);

        this.auditService.logAction(user.id, ActionType.UPDATE, 'Task', id);
        return updated;
    }

    async delete(user: User, id: string): Promise<void> {
        const task = await this.tasksRepo.findOne({ where: { id } });
        if (!task) throw new NotFoundException('Task not found');

        const allowed = await this.rbacService.canDeleteTask(user, task);
        if (!allowed) throw new ForbiddenException('Cannot delete this task');

        await this.tasksRepo.remove(task);
        this.auditService.logAction(user.id, ActionType.DELETE, 'Task', id);
    }
}
