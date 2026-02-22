import { IsString, MinLength } from 'class-validator';

export class CheckinDto {
  @IsString()
  @MinLength(10)
  qrToken: string;
}
