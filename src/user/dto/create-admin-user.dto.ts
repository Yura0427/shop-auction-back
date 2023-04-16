import { CreateBaseUserDto } from './create-base-user.dto';

/**
 * Makes it possible to use CreateAdminUserDto or Create User dto in the places where as an argument is used CreateBaseUsedDto
 * accordingly to the OOP principe (Inheritance - means that each child classes can be used in the place where as an argument used parent class).
 *
 * For avoiding using some abstract CreateBaseUser dto was created CreateAdminUserDto class. But there are no fields because
 * all fields which needs for CreateAdminUserDto already declared in the CreateBaseUserDto.
 */
export class CreateAdminUserDto extends CreateBaseUserDto {

}