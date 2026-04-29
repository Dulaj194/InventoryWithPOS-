import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis(
      this.configService.get<string>('REDIS_URL', 'redis://localhost:6379'),
    );
  }

  async onModuleInit(): Promise<void> {
    await this.client.ping();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  get redis(): Redis {
    return this.client;
  }
}
