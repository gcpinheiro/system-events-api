import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  controllers: [EventsController],
  providers: [EventsService],
  imports: [
    JwtModule.register({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: `${Number(process.env.QR_JWT_EXPIRES_IN)}s` || '12s' },
      })
    ]
})
export class EventsModule {}
