import { Role } from '../enums/role.enum';

export interface AuthenticatedUser {
  id: string;
  phone: string;
  name: string;
  role: Role;
}
