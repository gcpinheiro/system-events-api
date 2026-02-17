import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { PrismaService } from 'src/persistence/prisma.service';
import { DateTime } from 'luxon';
import { UpdateEventDto } from './dto/update-event.dto';
@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEventDto) {
    const startsAt = DateTime.fromISO(dto.startsAt, {
      zone: 'America/Fortaleza',
    });

    const endsAt = DateTime.fromISO(dto.endsAt, {
      zone: 'America/Fortaleza',
    });

    if (!startsAt.isValid || !endsAt.isValid) {
      throw new BadRequestException('Datas inválidas');
    }

    if (endsAt <= startsAt) {
      throw new BadRequestException('endsAt deve ser maior que startsAt');
    }


    return this.prisma.event.create({
      data: {
        title: dto.title,
        description: dto.description,
        location: dto.location,
        maxParticipants: dto.maxParticipants,
        targetCourse: dto.targetCourse,
        observations: dto.observations ?? null,
        imageBase64: dto.imageBase64 ?? null,
        startsAt,
        endsAt,
      },
    });
  }

  async getAll() {
    return this.prisma.event.findMany({
      orderBy: {
        startsAt: 'desc',
      },
    });
  }

  async update(id: string, dto: UpdateEventDto) {
    const exists = await this.prisma.event.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Evento não encontrado.');

    return this.prisma.event.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.startsAt !== undefined ? { startsAt: new Date(dto.startsAt) } : {}),
        ...(dto.endsAt !== undefined ? { endsAt: new Date(dto.endsAt) } : {}),
        ...(dto.location !== undefined ? { location: dto.location } : {}),
        ...(dto.maxParticipants !== undefined
          ? { maxParticipants: dto.maxParticipants }
          : {}),
        ...(dto.targetCourse !== undefined ? { targetCourse: dto.targetCourse } : {}),
        ...(dto.observations !== undefined
          ? { observations: dto.observations ?? null }
          : {}),
        ...(dto.imageBase64 !== undefined ? { imageBase64: dto.imageBase64 ?? null } : {}),
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
}
