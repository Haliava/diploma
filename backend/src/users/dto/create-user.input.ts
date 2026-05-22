import { Role } from '../../common/enums/role.enum';

export interface CreateUserInput {
  phone: string;
  passwordHash: string;
  name: string;
  role?: Role;
}
