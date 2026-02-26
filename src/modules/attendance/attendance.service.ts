import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private qrSecret() {
    const s = process.env.QR_JWT_SECRET;
    if (!s) throw new Error('QR_JWT_SECRET is not set');
    return s;
  }

  // async checkin(qrToken: string) {
  //   // 1) validar token do QR
  //   let payload: any;
  //   try {
  //     Logger.debug(`Verifying QR token: ${this.qrSecret()}, token: ${qrToken}`);
  //     payload = await this.jwt.verifyAsync(qrToken, { secret: this.qrSecret() });
  //   } catch (e) {
  //     Logger.debug(`QR verification failed: ${e}`);
  //     throw new UnauthorizedException('QR inválido ou expirado');
  //   }

  //   if (payload?.typ !== 'attendance_qr' || !payload?.sid) {
  //     throw new BadRequestException('QR inválido');
  //   }

  //   const sessionId = payload.sid as string;

  //   // 2) validar sessão aberta
  //   const session = await this.prisma.eventSession.findUnique({ where: { id: sessionId } });
  //   if (!session) throw new BadRequestException('Sessão não encontrada');
  //   if (session.status !== 'CHECKOUT_OPEN') {
  //     throw new BadRequestException('Presença não está aberta');
  //   }

  //   // 3) aluno (mock por enquanto)
  //   const studentId = '202012345';
  //   const email = 'aluno@fariasbrito.com.br';

  //   // 4) registrar presença (idempotente)
  //   try {
  //     const created = await this.prisma.attendance.create({
  //       data: { sessionId, studentId, email },
  //     });

  //     // 5) TODO: enfileirar e-mail
  //     return { ok: true, alreadyCheckedIn: false, attendanceId: created.id };
  //   } catch (e: any) {
  //     // Prisma unique constraint
  //     if (e?.code === 'P2002') {
  //       return { ok: true, alreadyCheckedIn: true };
  //     }
  //     throw e;
  //   }
  // }


  async checkin(qrToken: string) {
    // 🧼 limpeza do token
    qrToken = (qrToken ?? '').trim();
    if (qrToken.startsWith('Bearer ')) {
      qrToken = qrToken.slice(7).trim();
    }

    const secret = this.qrSecret();
    const secretFingerprint = createHash('sha256')
      .update(secret)
      .digest('hex')
      .slice(0, 12);

    Logger.debug(`[QR VERIFY] secret=${secretFingerprint}`);
    Logger.debug(`[QR VERIFY] tokenPrefix=${qrToken.slice(0, 20)}`);

    let payload: any;

    try {
      payload = await this.jwt.verifyAsync(qrToken, { secret });
    } catch (e: any) {
      Logger.debug(
        `QR verification failed: ${e?.name} - ${e?.message}`,
      );
      throw new UnauthorizedException('QR inválido ou expirado');
    }

    if (payload?.typ !== 'attendance_qr' || !payload?.sid) {
      throw new BadRequestException('QR inválido');
    }

    const sessionId = payload.sid as string;

    const session = await this.prisma.eventSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new BadRequestException('Sessão não encontrada');
    }

    if (session.status !== 'CHECKOUT_OPEN') {
      throw new BadRequestException('Presença não está aberta');
    }

    // Mock aluno
    const studentId = '202012345';
    const email = 'aluno@fariasbrito.com.br';

    try {
      const created = await this.prisma.attendance.create({
        data: { sessionId, studentId, email },
      });

      return {
        ok: true,
        alreadyCheckedIn: false,
        attendanceId: created.id,
      };
    } catch (e: any) {
      if (e?.code === 'P2002') {
        return {
          ok: true,
          alreadyCheckedIn: true,
        };
      }
      throw e;
    }
  }
}
