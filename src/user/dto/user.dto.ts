import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    description: 'The name of the user',
    example: 'Miles Ryker',
  })
  @IsString()
  @IsOptional()
  name: string;
}
