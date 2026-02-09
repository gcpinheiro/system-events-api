import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { PrismaService } from 'src/persistence/prisma.service';
import { DateTime } from 'luxon';
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
}
