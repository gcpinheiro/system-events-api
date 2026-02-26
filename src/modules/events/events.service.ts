import { BadRequestException, Injectable,Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/persistence/prisma.service';
import { DateTime } from 'luxon';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtService } from '@nestjs/jwt';
import type { SignOptions } from 'jsonwebtoken';
import { randomUUID, createHash } from 'crypto';

type CheckoutStatus = 'CHECKOUT_OPEN' | 'CLOSED';
@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService,) {}

  private fileToBase64(file?: Express.Multer.File): string | null {
    if (!file) return null;

    // validação básica: só imagem
    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Arquivo inválido: envie uma imagem.');
    }

    // opcional: limite de tamanho (ex.: 5MB)
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException('Imagem muito grande (máx. 5MB).');
    }

    const base64 = file.buffer.toString('base64');
    // manter o mime no início ajuda o front (src="data:image/png;base64,...")
    return `data:${file.mimetype};base64,${base64}`;
  }

  private parseDateOrThrow(iso: string, fieldName: 'startsAt' | 'endsAt') {
    const dt = DateTime.fromISO(iso, { zone: 'America/Fortaleza' });
    if (!dt.isValid) throw new BadRequestException(`${fieldName} inválido`);
    return dt;
  }

  async create(dto: CreateEventDto, file?: Express.Multer.File) {
    const startsAt = this.parseDateOrThrow(dto.startsAt, 'startsAt');
    const endsAt = this.parseDateOrThrow(dto.endsAt, 'endsAt');

    if (endsAt <= startsAt) {
      throw new BadRequestException('endsAt deve ser maior que startsAt');
    }

    if (!dto.speaker) {
      throw new BadRequestException('O campo speaker é obrigatório.');
    }

    const imageFromFile = this.fileToBase64(file);
    const imageBase64 = imageFromFile ?? dto.imageBase64 ?? null;

    return this.prisma.event.create({
      data: {
        title: dto.title,
        description: dto.description,
        location: dto.location,
        maxParticipants: dto.maxParticipants,
        targetCourse: dto.targetCourse,
        observations: dto.observations ?? null,
        imageBase64,
        startsAt: startsAt.toJSDate(),
        endsAt: endsAt.toJSDate(),
        speaker: dto.speaker,
      },
    });
  }

  async getAll() {
    return this.prisma.event.findMany({
      orderBy: { startsAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateEventDto, file?: Express.Multer.File) {
    const exists = await this.prisma.event.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Evento não encontrado.');

    // se vier arquivo, ele manda; se não vier, respeita dto.imageBase64 (inclusive null)
    const imageFromFile = this.fileToBase64(file);

    // datas: se vierem, valida com Luxon (mantém consistência)
    const startsAt =
      dto.startsAt !== undefined ? this.parseDateOrThrow(dto.startsAt, 'startsAt') : null;

    const endsAt =
      dto.endsAt !== undefined ? this.parseDateOrThrow(dto.endsAt, 'endsAt') : null;

    // se mandar as duas no update, valida relação
    if (startsAt && endsAt && endsAt <= startsAt) {
      throw new BadRequestException('endsAt deve ser maior que startsAt');
    }

    // se mandar só uma, valida contra a outra existente
    if (startsAt && !endsAt) {
      const currentEndsAt = DateTime.fromJSDate(exists.endsAt, { zone: 'America/Fortaleza' });
      if (currentEndsAt <= startsAt) {
        throw new BadRequestException('endsAt deve ser maior que startsAt');
      }
    }

    if (endsAt && !startsAt) {
      const currentStartsAt = DateTime.fromJSDate(exists.startsAt, { zone: 'America/Fortaleza' });
      if (endsAt <= currentStartsAt) {
        throw new BadRequestException('endsAt deve ser maior que startsAt');
      }
    }

    return this.prisma.event.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.location !== undefined ? { location: dto.location } : {}),
        ...(dto.maxParticipants !== undefined ? { maxParticipants: dto.maxParticipants } : {}),
        ...(dto.targetCourse !== undefined ? { targetCourse: dto.targetCourse } : {}),
        ...(dto.observations !== undefined ? { observations: dto.observations ?? null } : {}),

        ...(dto.startsAt !== undefined ? { startsAt: startsAt!.toJSDate() } : {}),
        ...(dto.endsAt !== undefined ? { endsAt: endsAt!.toJSDate() } : {}),

        // prioridade: arquivo; se não tiver arquivo, respeita dto.imageBase64 (inclusive null pra remover)
        ...(imageFromFile !== null
          ? { imageBase64: imageFromFile }
          : dto.imageBase64 !== undefined
            ? { imageBase64: dto.imageBase64 ?? null }
            : {}),
      },
    });
  }

  async remove(id: string) {
    const exists = await this.prisma.event.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Evento não encontrado.');

    await this.prisma.event.delete({ where: { id } });
    return { ok: true };
  }

  async getEvent(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Evento não encontrado.');
    return event;
  }

  private qrSecret() {
    const s = process.env.QR_JWT_SECRET;
    if (!s) throw new Error('QR_JWT_SECRET is not set');
    return s;
  }

  async getCheckoutStatus(eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    // sessão “ativa” = última criada (simples). Se quiser, pegue a mais recente não CLOSED.
    const session = await this.prisma.eventSession.findFirst({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });

    const status = session?.status ?? 'CLOSED';
    const isOpen = status === 'CHECKOUT_OPEN';

    return {
      eventId,
      sessionId: session?.id ?? null,
      status,
      isOpen,
    };
  }

  // async getCheckoutQr(eventId: string) {
  //   const session = await this.prisma.eventSession.findFirst({
  //     where: { eventId },
  //     orderBy: { createdAt: 'desc' },
  //   });

  //   if (!session) throw new NotFoundException('No session found for this event');
  //   if (session.status !== 'CHECKOUT_OPEN') {
  //     throw new BadRequestException('Checkout is not open');
  //   }

  //   const jti = randomUUID();

  //   // const expiresIn: SignOptions['expiresIn'] =
  //   //   (process.env.QR_JWT_EXPIRES_IN as SignOptions['expiresIn']) || '12s';

  //   const expiresIn: SignOptions['expiresIn'] = '60s'

  //   const token = await this.jwt.signAsync(
  //     { typ: 'attendance_qr', sid: session.id, eid: eventId, jti } as Record<string, any>,
  //     { secret: this.qrSecret(), expiresIn },
  //   );

  //   return { qrToken: token, sessionId: session.id };
  // }

  

async getCheckoutQr(eventId: string) {
  const session = await this.prisma.eventSession.findFirst({
    where: { eventId },
    orderBy: { createdAt: 'desc' },
  });

  if (!session) {
    throw new NotFoundException('No session found for this event');
  }

  if (session.status !== 'CHECKOUT_OPEN') {
    throw new BadRequestException('Checkout is not open');
  }

  const jti = randomUUID();

  // 🔎 TTL aumentado para teste (mude depois para 12s se quiser)
  const expiresIn: SignOptions['expiresIn'] = '1m';

  const secret = this.qrSecret();
  const secretFingerprint = createHash('sha256')
    .update(secret)
    .digest('hex')
    .slice(0, 12);

  const token = await this.jwt.signAsync(
    {
      typ: 'attendance_qr',
      sid: session.id,
      eid: eventId,
      jti,
    },
    {
      secret,
      expiresIn,
    },
  );

  Logger.debug(`[QR SIGN] secret=${secretFingerprint}`);
  Logger.debug(`[QR SIGN] tokenPrefix=${token.slice(0, 20)}`);

  return {
    qrToken: token,
    sessionId: session.id,
  };
}

  // ...

  async openCheckout(eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    let session = await this.prisma.eventSession.findUnique({
      where: { eventId },
    });

    // Se não existe, cria já aberta
    if (!session) {
      session = await this.prisma.eventSession.create({
        data: { eventId, status: 'CHECKOUT_OPEN' },
      });

      return {
        eventId,
        sessionId: session.id,
        status: session.status,
        isOpen: true,
      };
    }

    // Se já está aberta, mantém (idempotente)
    if (session.status === 'CHECKOUT_OPEN') {
      return {
        eventId,
        sessionId: session.id,
        status: session.status,
        isOpen: true,
      };
    }

    // Se existe e está fechada, abre
    session = await this.prisma.eventSession.update({
      where: { id: session.id },
      data: { status: 'CHECKOUT_OPEN' as CheckoutStatus },
    });

    return {
      eventId,
      sessionId: session.id,
      status: session.status,
      isOpen: true,
    };
  }

  async closeCheckout(eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const session = await this.prisma.eventSession.findUnique({
      where: { eventId },
    });

    // Decisão de regra: fechar sem sessão existente
    // Opção A (mais correta): não existe sessão -> não dá pra fechar
    if (!session) {
      throw new BadRequestException('No checkout session found for this event');
    }

    // Se já está fechada, mantém (idempotente)
    if (session.status === 'CLOSED') {
      return {
        eventId,
        sessionId: session.id,
        status: session.status,
        isOpen: false,
      };
    }

    const updated = await this.prisma.eventSession.update({
      where: { id: session.id },
      data: { status: 'CLOSED' as CheckoutStatus },
    });

    return {
      eventId,
      sessionId: updated.id,
      status: updated.status,
      isOpen: false,
    };
  }
}
