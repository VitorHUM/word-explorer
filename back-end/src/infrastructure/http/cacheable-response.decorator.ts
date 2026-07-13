import { SetMetadata } from '@nestjs/common';

export const CACHEABLE_RESPONSE_METADATA_KEY = 'cacheable-response';

export const CacheableResponse = (): MethodDecorator =>
  SetMetadata(CACHEABLE_RESPONSE_METADATA_KEY, true);
