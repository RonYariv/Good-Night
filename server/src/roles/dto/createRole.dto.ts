import { ApiProperty } from '@nestjs/swagger';
import { WinCondition } from '../../shared/enums/winCondition.enum';

export class CreateRoleDto {
  @ApiProperty({ example: 'Detective' })
  name: string;

  @ApiProperty({ enum: WinCondition })
  winCondition: WinCondition;

  @ApiProperty({ example: 1 })
  nightOrder: number;
}