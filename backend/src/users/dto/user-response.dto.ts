import { ApiProperty } from '@nestjs/swagger';

import { Role } from '../../common/enums/role.enum';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: Role })
  role: Role;
}
