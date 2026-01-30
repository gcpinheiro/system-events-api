import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/persistence/prisma.service';
import { IntegrationsService } from '../integrations/integrations.service';

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
        email: student.email
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
}