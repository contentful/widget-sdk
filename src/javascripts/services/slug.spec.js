import { forEach } from 'lodash';
import { slugify } from './slug';

describe('slugify(text)', () => {
  const cases = {
    'We ♥ $ & €': 'we-love-usd-and-eur',
    'it`s a Slug': 'its-a-slug',
    'it’S a slug': 'its-a-slug',
    "it's a SLUG": 'its-a-slug'
  };

  forEach(cases, (expected, input) => {
    it(`converts "${input}" to "${expected}"`, () => {
      expect(slugify(input)).toBe(expected);
    });
  });
});
