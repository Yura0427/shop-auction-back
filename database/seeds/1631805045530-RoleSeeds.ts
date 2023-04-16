import { getRepository, MigrationInterface, QueryRunner } from 'typeorm';
import { Role } from '../../src/user/role/role.entity';
import { UserRoleEnum } from '../../src/user/user.enum';

export class RoleSeeds1631805045530 implements MigrationInterface {
  roleRepository = getRepository(Role, 'seeds');

  public async up(queryRunner: QueryRunner): Promise<void> {
    const Roles = [
      { name: UserRoleEnum.admin },
      { name: UserRoleEnum.moderator },
      { name: UserRoleEnum.user },
    ];

    await this.roleRepository.save(Roles);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const findRoles = await this.roleRepository.find({
      where: [
        { name: UserRoleEnum.admin },
        { name: UserRoleEnum.moderator },
        { name: UserRoleEnum.user },
      ],
    });

    await this.roleRepository.remove(findRoles);
  }
}
