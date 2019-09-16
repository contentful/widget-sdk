import sinon from 'sinon';

export function stubAll(object) {
  /* eslint prefer-const: off */
  for (let key in object) {
    if (typeof object[key] === 'function') {
      sinon.stub(object, key);
    }
  }
  return object;
}
