import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { UserRole } from 'generated/prisma/enums';
import { CreateStudentDto } from './dto/create-student.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private async hashPassword(raw: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(raw, saltRounds);
  }

  private generateRandomPassword(bytes = 18): string {
    // forte, URL-safe
    return crypto.randomBytes(bytes).toString('base64url');
  }

  private sanitizeUser(user: any) {
    // remove passwordHash do retorno
    const { passwordHash, ...rest } = user;
    return rest;
  }

  async createStudent(dto: CreateStudentDto) {
    // regra: student é sempre STUDENT
    const role = UserRole.STUDENT;

    // senha aleatória (não vamos retornar)
    const randomPassword = this.generateRandomPassword();
    const passwordHash = await this.hashPassword(randomPassword);

    try {
      const user = await this.prisma.user.create({
        data: {
          studentId: dto.studentId,
          name: dto.name,
          email: dto.email,
          role,
          passwordHash,
        },
      });

      return this.sanitizeUser(user);
    } catch (err: any) {
      // erros comuns: unique constraint (email/studentId)
      throw new BadRequestException('Não foi possível criar o aluno. Verifique se email/studentId já existe.');
    }
  }

  async createAdmin(dto: CreateAdminDto) {
    if (dto.role !== UserRole.ADMIN) {
      throw new BadRequestException('Admin deve ter role ADMIN.');
    }

    const passwordHash = await this.hashPassword(dto.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          // admin não precisa de studentId? no seu model é obrigatório.
          // então você tem 2 opções:
          // 1) manter studentId obrigatório e criar um "admin-xxxx"
          // 2) tornar studentId opcional no schema
          //
          // Como seu schema atual exige studentId, vou gerar um valor único:
          studentId: `admin-${crypto.randomUUID()}`,

          name: dto.name,
          email: dto.email,
          role: UserRole.ADMIN,
          passwordHash,
        },
      });

      return this.sanitizeUser(user);
    } catch {
      throw new BadRequestException('Não foi possível criar o admin. Verifique se email já existe.');
    }
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return this.sanitizeUser(user);
  }

  async findByStudentId(studentId: string) {
    const user = await this.prisma.user.findUnique({ where: { studentId } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return this.sanitizeUser(user);
  }

  async list() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u) => this.sanitizeUser(u));
  }
}
