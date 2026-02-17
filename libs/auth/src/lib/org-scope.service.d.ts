import { Repository } from 'typeorm';
import { User, Organization } from '@secure-task-manage-app-angular/data/entities';
export declare class OrgScopeService {
    private readonly orgRepo;
    constructor(orgRepo: Repository<Organization>);
    getAccessibleOrganizationIds(user: User): Promise<string[]>;
}
