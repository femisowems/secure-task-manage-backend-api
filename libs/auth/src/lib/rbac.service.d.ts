import { User, Task } from '@secure-task-manage-app-angular/data/entities';
import { UserRole } from '@secure-task-manage-app-angular/data/enums';
import { OrgScopeService } from './org-scope.service';
export declare class RbacService {
    private readonly orgScopeService;
    constructor(orgScopeService: OrgScopeService);
    hasRequiredRole(userRole: UserRole, requiredRoles: UserRole[]): boolean;
    canCreateTask(_user: User): boolean;
    canReadTasks(_user: User): Promise<boolean>;
    canUpdateTask(user: User, task: Task): Promise<boolean>;
    canDeleteTask(user: User, task: Task): Promise<boolean>;
}
