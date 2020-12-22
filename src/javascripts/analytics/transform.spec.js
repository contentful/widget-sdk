import { transformEvent, getSchemaForEvent } from './transform';

jest.mock('./transformers/Generic', () => () => ({ foo: 'bar' }));

describe('Events transformation', () => {
  it('#transformEvent()', function () {
    const transformed = transformEvent('learn:language_selected', {});
    expect(transformed).toEqual({ foo: 'bar' });
  });

  it('#getSchemaForEvent()', function () {
    expect(getSchemaForEvent('learn:language_selected').name).toBe('generic');
  });
});
