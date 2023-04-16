import { getRepository, MigrationInterface, QueryRunner } from 'typeorm';
import { User, UserStatus } from '../../src/user/user.entity';
import { Role } from '../../src/user/role/role.entity';
import { UserRoleEnum } from '../../src/user/user.enum';
import { hashSync } from 'bcrypt';

export class AdminUserSeed1631873570779 implements MigrationInterface {
  userRepository = getRepository(User, 'seeds');
  roleRepository = getRepository(Role, 'seeds');

  public async up(queryRunner: QueryRunner): Promise<void> {
    const adminRole = await this.roleRepository.findOne({
      name: UserRoleEnum.admin,
    });
    const adminFields = this.userRepository.create({
      email: process.env.ADMIN_LOGIN,
      password: hashSync(process.env.ADMIN_PASS, JSON.parse(process.env.SALT)),
      firstName: 'Shop Admin',
      lastName: 'Waf',
      status: UserStatus.CONFIRMED,
      role: adminRole,
    });

    await this.userRepository.save(adminFields);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.userRepository.delete({ email: process.env.ADMIN_LOGIN });
  }
}
