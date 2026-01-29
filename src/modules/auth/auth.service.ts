import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/persistence/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async test() {
    return this.prisma.event.findMany();
  }
}
