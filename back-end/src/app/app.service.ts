import { Injectable } from '@nestjs/common';
import { HealthResponseDto } from './dto/health-response.dto';
import { RootResponseDto } from './dto/root-response.dto';

@Injectable()
export class AppService {
  getRootMessage(): RootResponseDto {
    return RootResponseDto.fromMessage('English Dictionary');
  }

  getHealth(): HealthResponseDto {
    return HealthResponseDto.ok();
  }
}
