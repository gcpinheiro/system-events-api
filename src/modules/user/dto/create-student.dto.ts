import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateStudentDto {
  @IsString()
  studentId: string;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  // opcional: normalmente STUDENT, mas deixo travado por padrão
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
