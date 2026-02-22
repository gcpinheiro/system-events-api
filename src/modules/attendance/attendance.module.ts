import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  controllers: [AttendanceController],
  providers: [AttendanceService],
  imports: [
    JwtModule.register({
      secret: process.env.QR_JWT_SECRET,
      signOptions: { expiresIn: `1H` },
    }),
  ]
})
export class AttendanceModule {}
