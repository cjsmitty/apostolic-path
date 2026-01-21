import type { ListUsersOptions, PaginatedResult, User } from '@apostolic-path/shared';
import { UserRepository } from '../repositories/user.repository.js';

export class UserService {
  private repository: UserRepository;

  constructor() {
    this.repository = new UserRepository();
  }

  async getById(userId: string, churchId: string): Promise<User | null> {
    return this.repository.findById(userId, churchId);
  }

  async listByChurch(
    churchId: string,
    options: ListUsersOptions
  ): Promise<PaginatedResult<User>> {
    return this.repository.listByChurch(churchId, options);
  }

  async create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const now = new Date().toISOString();
    return this.repository.create({
      ...data,
      createdAt: now,
      updatedAt: now,
    });
  }

  async update(
    userId: string,
    churchId: string,
    data: Partial<User>
  ): Promise<User> {
    return this.repository.update(userId, churchId, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }
}
