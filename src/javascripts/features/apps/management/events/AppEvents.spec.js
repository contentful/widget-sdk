const { validate } = require('./AppEvents');

describe('validate', () => {
  it('ignores empty targetUrl when disabled', () => {
    const events = {
      enabled: false,
      targetUrl: '',
      topics: [],
    };

    const result = validate(events, []);
    expect(result).toHaveLength(0);
  });

  it('accepts https targetUrl', () => {
    const events = {
      enabled: true,
      targetUrl: 'https://example.com',
      topics: [],
    };

    const result = validate(events, []);
    expect(result).toHaveLength(0);
  });

  it('rejects http targetUrl', () => {
    const events = {
      enabled: true,
      targetUrl: 'http://example.com',
      topics: [],
    };

    const result = validate(events, []);
    expect(result).toHaveLength(1);
  });
});
