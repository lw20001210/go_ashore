import { Injectable } from '@nestjs/common';

export interface ErrorRecord {
  requestId: string;
  statusCode: number;
  message: string;
  detail: string;
  stack?: string;
  path: string;
  method: string;
  createdAt: string;
}

@Injectable()
export class ErrorLogService {
  private readonly logs = new Map<string, ErrorRecord>();
  private readonly maxSize = 200;

  record(entry: ErrorRecord) {
    this.logs.set(entry.requestId, entry);

    if (this.logs.size > this.maxSize) {
      const oldestKey = this.logs.keys().next().value;
      if (oldestKey) this.logs.delete(oldestKey);
    }
  }

  get(requestId: string) {
    return this.logs.get(requestId);
  }

  listRecent(limit = 30) {
    return [...this.logs.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }
}
