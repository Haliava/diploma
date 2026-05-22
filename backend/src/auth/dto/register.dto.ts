import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: '+79991234567' })
  @IsString()
  @Matches(/^\+?\d{10,15}$/)
  phone: string;

  @ApiProperty({ example: 'Ivan Fomin' })
  @IsString()
  @Length(2, 80)
  name: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
