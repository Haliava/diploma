import { Role } from '../../common/enums/role.enum';

export interface JwtPayload {
  sub: string;
  phone: string;
  role: Role;
}
