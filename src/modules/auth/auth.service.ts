import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/persistence/prisma.service';
import { IntegrationsService } from '../integrations/integrations.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly integrationsService: IntegrationsService,
  ) {}

  async exchange(institutionalToken: string){
    const student = await this.integrationsService.validateToken(institutionalToken);

    if(!student){
      throw new UnauthorizedException('Invalid institutional token');
    }

    const user = await this.prisma.user.upsert({
      where: { studentId: student.studentId },
      update: { name: student.name, email: student.email },
      create: {
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        passwordHash: await this.hashPassword(this.generateRandomPassword()),
      },
    }); 

    const accessToken = this.jwtService.sign({
      sub: user.id,
      studentId: user.studentId,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        studentId: user.studentId,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    }
  }

  private generateRandomPassword(bytes = 18) {
    return crypto.randomBytes(bytes).toString('base64url');
  }

  private async hashPassword(raw: string) {
    return bcrypt.hash(raw, 12);
  }


  async loginAdmin(email: string, password: string) {
    const admin = await this.prisma.user.findUnique({ where: { email } });

    // não vaza se email existe ou não
    if (!admin || admin.role !== 'ADMIN') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.jwtService.sign({
      sub: admin.id,
      role: admin.role,
    });

    return {
      accessToken,
      user: {
        id: admin.id,
        studentId: admin.studentId ?? null,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    };
  }

}