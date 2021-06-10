import { transformEventForSnowplow, getSnowplowSchemaForEvent } from './transform';

jest.mock('./transformers/Generic', () => () => ({ foo: 'bar' }));

describe('Events transformation', () => {
  it('#transformEventForSnowplow()', function () {
    const transformed = transformEventForSnowplow('tracking:invalid_event', {});
    expect(transformed).toEqual({ foo: 'bar' });
  });

  it('#getSnowplowSchemaForEvent()', function () {
    expect(getSnowplowSchemaForEvent('tracking:invalid_event').name).toBe('generic');
  });
});
