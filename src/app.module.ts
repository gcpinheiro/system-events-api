import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MailModule } from './modules/mail/mail.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { AuthModule } from './modules/auth/auth.module';
import { EventsModule } from './modules/events/events.module';
import { AttendanceModule } from './attendance/attendance.module';
import { PersistenceModule } from './persistence/persistence.module';

@Module({
  imports: [AuthModule, EventsModule, AttendanceModule, MailModule, IntegrationsModule, PersistenceModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
