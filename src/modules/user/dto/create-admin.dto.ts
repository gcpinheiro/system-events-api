import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { UserRole } from '../enum/user-role.enum';
export class CreateAdminDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @MinLength(8)
  @IsString()
  password: string;

  @IsEnum(UserRole)
  role: UserRole; // você pode forçar ADMIN no controller, se quiser
}
