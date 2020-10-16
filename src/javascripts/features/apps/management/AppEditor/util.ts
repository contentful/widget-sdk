import { isEqual } from 'lodash';

export function arrayStartsWith<T>(array: T[], target: T[]): boolean {
  return isEqual(array.slice(0, target.length), target);
}
