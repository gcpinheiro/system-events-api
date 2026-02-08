import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthExchangeDto } from './dto/auth-exchange.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService){}

  @Post('exchange')
  exchange(@Body() dto: AuthExchangeDto){
    return this.authService.exchange(dto.token);
  }

  @Post('login-admin')
  loginAdmin(@Body() email: string, password: string){
    return this.authService.loginAdmin(email, password);
  }
}
