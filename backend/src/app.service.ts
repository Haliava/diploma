import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'diploma-scanner-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
