export type UserRole = 'student' | 'teacher' | 'admin';
export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  group: string;
}


export type ManagedUserDraft = Pick<ManagedUser, 'name' | 'email' | 'role'>;
