import { Body, Controller, Post } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CheckinDto } from './dto/checkin.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('checkin')
  checkin(@Body() dto: CheckinDto) {
    return this.attendanceService.checkin(dto.qrToken);
  }
}
