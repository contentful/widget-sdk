describe('Config.es6', () => {
  beforeEach(function() {
    module('contentful/test');
    this.settings = this.$inject('environment').settings;
    this.settings.authUrl = '//basehost';
    this.settings.marketingUrl = 'https://website';
    this.Config = this.$inject('Config.es6');
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
