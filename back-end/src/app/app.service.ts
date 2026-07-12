import { Injectable } from '@nestjs/common';
import { RootResponseDto } from './dto/root-response.dto';

@Injectable()
export class AppService {
  getRootMessage(): RootResponseDto {
    return { message: 'English Dictionary' };
  }
}
