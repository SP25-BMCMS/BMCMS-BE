import { Injectable } from '@nestjs/common';

@Injectable()
export class BuildingsService {
  getHello(): string {
    return 'Hello World!';
  }
}
