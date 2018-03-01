import shouldUseEnvEndpoint from 'data/shouldUseEnvEndpoint';

describe('shouldUseEnvEndpoint', function () {
  it('returns true when should use env endpoint for various input formats', function () {
    [
      'content_types',
      'public/content_types',
      '/content_types',
      ['', 'content_types', 'ctid'],
      ['content_types', 'ctid', 'published'],
      'entries',
      ['assets', 'aid'],
      'ui_config',
      ['ui_config', '/me'],
      'extensions',
      'locales'
    ].forEach(path => {
      expect(shouldUseEnvEndpoint(path)).toBe(true);
    });
  });

  it('returns false when entity belongs directly to a space', function () {
    [
      ['roles', 'rid'],
      '/users/',
      ['webhooks/', 'wid', '/calls/', 'cid']
    ].forEach(path => {
      expect(shouldUseEnvEndpoint(path)).toBe(false);
    });
  });
});
