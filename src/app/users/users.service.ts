import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@secure-task-manage-app-angular/data/entities';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>
    ) { }

    async updateUser(id: string, updateData: any) {
        await this.usersRepository.update(id, updateData);
        return this.usersRepository.findOne({ where: { id } });
    }
}
