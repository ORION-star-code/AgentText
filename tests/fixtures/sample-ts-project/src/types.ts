export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export type UserRole = 'admin' | 'user' | 'guest';

export enum Status {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending',
}
