import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateEventDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsString()
  @MinLength(1)
  startsAt: string;

  @IsString()
  @MinLength(1)
  endsAt: string;

  @IsString()
  @MinLength(3)
  location: string;

  @IsInt()
  @Transform(({ value }) => (value === '' || value === undefined ? undefined : Number(value)))
  @IsOptional()
  @Min(1)
  maxParticipants: number;

  @IsString()
  @IsOptional()
  @MinLength(1)
  targetCourse: string;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsString()
  imageBase64?: string;
}
