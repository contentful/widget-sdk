import { random, times } from 'lodash';

const LETTERS = 'abcdefghijklmnopqvwxyzABCDEFGHIJKLMNOPQVWXYZ';
const NUMS = '0123456789';
const ALNUM = NUMS + LETTERS;

export function id() {
  return letter(1) + alnum(15);
}

function fromArray(a) {
  return a[random(0, a.length - 1)];
}

export function letter(count) {
  return times(count, () => fromArray(LETTERS)).join('');
}

export function alnum(count) {
  return times(count, () => fromArray(ALNUM)).join('');
}
