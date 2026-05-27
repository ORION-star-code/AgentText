import type { User, UserRole } from './types.js';

export class UserService {
  private users: User[] = [];

  /**
   * Find a user by ID
   */
  getUser(id: number): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  /**
   * Create a new user
   */
  createUser(name: string, email: string, role: UserRole): User {
    const user: User = {
      id: this.users.length + 1,
      name,
      email,
      role,
    };
    this.users.push(user);
    return user;
  }

  /**
   * Get all users
   */
  getAllUsers(): User[] {
    return [...this.users];
  }

  /**
   * Delete a user by ID
   */
  deleteUser(id: number): boolean {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return false;
    this.users.splice(index, 1);
    return true;
  }
}
