import type { IdentifiedEntity } from '@contentful/types';

export function indexById<T extends IdentifiedEntity>(entities: T[]): Record<string, T> {
  const rval: Record<string, T> = {};
  entities.forEach((entity) => (rval[entity.sys.id] = entity));

  return rval;
}
