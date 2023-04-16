import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { Repository } from 'typeorm';
import { IDeleteMessage } from '../../interfaces/delete-message.interface';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  public async findByNames(names: string[]): Promise<Role[]> {
    const findConditions = names.map((name) => ({ name }));

    return this.roleRepository.find({
      where: findConditions,
    });
  }

  public async findByName(name: string): Promise<Role> {
    return this.roleRepository.findOne({
      where: {
        name: name,
      },
    });
  }

  public async findById(id: number): Promise<Role> {
    return this.roleRepository.findOne({ where: { id } });
  }

  public async updateRoleById(
    id: number,
    createRoleDto: CreateRoleDto,
  ): Promise<Role> {
    const role = await this.roleRepository.findOne(id);

    if (!role) {
      throw new NotFoundException(`Роль з ід: ${id} не знайдено`);
    }

    await this.roleRepository.update(id, createRoleDto);
    return this.roleRepository.findOne({ where: { id } });
  }

  public async deleteById(id: number): Promise<IDeleteMessage> {
    await this.roleRepository.delete({ id });

    return { message: `Роль з айді ${id} успішно видалено.` };
  }

  public async findAll(): Promise<Role[]> {
    return this.roleRepository.find();
  }
}
