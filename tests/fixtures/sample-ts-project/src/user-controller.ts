import { UserService } from './user-service.js';
import type { User } from './types.js';

export class UserController {
  private service: UserService;

  constructor() {
    this.service = new UserService();
  }

  /**
   * Handle GET /users/:id
   */
  handleGetUser(id: number): { status: number; data?: User; error?: string } {
    const user = this.service.getUser(id);
    if (!user) {
      return { status: 404, error: 'User not found' };
    }
    return { status: 200, data: user };
  }

  /**
   * Handle POST /users
   */
  handleCreateUser(body: { name: string; email: string; role: 'admin' | 'user' | 'guest' }): {
    status: number;
    data?: User;
  } {
    const user = this.service.createUser(body.name, body.email, body.role);
    return { status: 201, data: user };
  }

  /**
   * Handle GET /users
   */
  handleListUsers(): { status: number; data: User[] } {
    const users = this.service.getAllUsers();
    return { status: 200, data: users };
  }
}
