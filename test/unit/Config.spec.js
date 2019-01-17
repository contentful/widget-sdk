import { createIsolatedSystem } from 'test/helpers/system-js';

describe('Config.es6', () => {
  beforeEach(async function() {
    const system = createIsolatedSystem();

    const getModule = sinon.stub();
    getModule.withArgs('environment').returns({
      settings: {
        authUrl: '//basehost',
        marketingUrl: 'https://website'
      }
    });
    system.set('NgRegistry.es6', { getModule });

    this.Config = await system.import('Config.es6');
  });

  it('provides authUrl with parameters', function() {
    expect(this.Config.authUrl('path', { q: 'true' })).toEqual('//basehost/path?q=true');
  });

  it('provides websiteUrl', function() {
    expect(this.Config.websiteUrl('path/a')).toEqual('https://website/path/a');
  });

  it('provides accountUrl', function() {
    expect(this.Config.accountUrl('path')).toEqual('//basehost/account/path');
  });

  it('provides supportUrl', function() {
    expect(this.Config.supportUrl).toEqual('https://website/support');
  });
});
