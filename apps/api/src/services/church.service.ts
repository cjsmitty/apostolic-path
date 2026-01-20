import type { Church, ChurchStats } from '@apostolic-path/shared';
import { ChurchRepository } from '../repositories/church.repository.js';

export class ChurchService {
  private repository: ChurchRepository;

  constructor() {
    this.repository = new ChurchRepository();
  }

  async getById(churchId: string): Promise<Church | null> {
    return this.repository.findById(churchId);
  }

  async listAll(): Promise<Church[]> {
    return this.repository.listAll();
  }

  async update(churchId: string, data: Partial<Church>): Promise<Church> {
    return this.repository.update(churchId, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }

  async getStats(churchId: string): Promise<ChurchStats> {
    return this.repository.getStats(churchId);
  }
}
