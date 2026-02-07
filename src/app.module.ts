import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MailModule } from './modules/mail/mail.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { AuthModule } from './modules/auth/auth.module';
import { EventsModule } from './modules/events/events.module';
import { PersistenceModule } from './persistence/persistence.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { UsersModule } from './modules/user/users.module';

@Module({
  imports: [
    AuthModule, 
    EventsModule, 
    AttendanceModule, 
    MailModule, 
    IntegrationsModule, 
    PersistenceModule, UsersModule, 
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
