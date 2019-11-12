import { caseofEq } from 'sum-types';
import { constant } from 'lodash';

export default function escape(t) {
  return t.replace(/<|>|&/g, c => {
    return caseofEq(c, [
      ['<', constant('&lt;')],
      ['>', constant('&gt;')],
      ['&', constant('&amp;')]
    ]);
  });
}
