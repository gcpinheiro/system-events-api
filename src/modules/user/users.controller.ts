import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('students')
  createStudent(@Body() dto: CreateStudentDto) {
    return this.usersService.createStudent(dto);
  }

  @Post('admins')
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.usersService.createAdmin(dto);
  }

  @Get()
  list() {
    return this.usersService.list();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get('student/:studentId')
  findByStudentId(@Param('studentId') studentId: string) {
    return this.usersService.findByStudentId(studentId);
  }
}
