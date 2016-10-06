describe('Config', function () {
  beforeEach(function () {
    module('contentful/test');
    this.settings = this.$inject('environment').settings;
    this.settings.base_host = 'basehost';
    this.Config = this.$inject('Config');
  });

  it('provides authUrl with parameters', function () {
    expect(this.Config.authUrl('path', {q: 'true'})).toEqual('//basehost/path?q=true');
  });


  it('provides websiteUrl', function () {
    this.settings.marketing_url = 'http://www';
    expect(this.Config.websiteUrl('path/a')).toEqual('http://www/path/a');
  });

  it('provides accountUrl', function () {
    expect(this.Config.accountUrl('path')).toEqual('//basehost/account/path');
  });

  it('provides supportUrl', function () {
    expect(this.Config.supportUrl).toEqual('//basehost/integrations/zendesk/login');
  });
});
