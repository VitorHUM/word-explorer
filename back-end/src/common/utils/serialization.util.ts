import { plainToInstance, type ClassConstructor } from 'class-transformer';

const SERIALIZATION_OPTIONS = {
  excludeExtraneousValues: true,
};

export function serializeDto<T, V>(dtoClass: ClassConstructor<T>, value: V): T {
  return plainToInstance(dtoClass, value, SERIALIZATION_OPTIONS);
}

export function serializeDtoArray<T, V>(
  dtoClass: ClassConstructor<T>,
  values: V[],
): T[] {
  return plainToInstance(dtoClass, values, SERIALIZATION_OPTIONS);
}
