describe('The ApiKey list directive', () => {
  beforeEach(function() {
    module('contentful/test', $provide => {
      $provide.removeDirectives('relative', 'cfKnowledgeBase');
      $provide.value('$state', {
        href: sinon.stub(),
        current: { name: 'test.api.foo' }
      });
    });

    this.accessChecker = this.$inject('access_control/AccessChecker');
    this.accessChecker.shouldDisable = sinon.stub().returns(false);

    this.LD = this.$inject('utils/LaunchDarkly');
    this.LD.getCurrentVariation = sinon.stub().resolves(false);

    const resource = {
      usage: 0,
      limits: {
        included: 0,
        maximum: 0
      }
    };

    this.ResourceService = this.$inject('services/ResourceService.es6');
    this.ResourceService.default = sinon.stub().returns({
      get: sinon.stub().resolves(resource)
    });

    this.setUsageLimit = (usage, limit) => {
      resource.usage = usage;
      resource.limits.included = limit;
      resource.limits.maximum = limit;
    };

    this.organization = {
      pricingVersion: 'pricing_version_1'
    };

    const spaceContext = this.$inject('mocks/spaceContext').init();
    spaceContext.apiKeyRepo.getAll = sinon
      .stub()
      .resolves([{ sys: { id: 1 }, name: 'key1' }, { sys: { id: 2 }, name: 'key2' }]);
    spaceContext.organization = this.organization;

    this.setup = function() {
      this.container = this.$compile('<cf-api-key-list />', {
        context: {}
      });
      this.sidebar = this.container.find('.entity-sidebar');
      this.$inject('$rootScope').$apply();
    };
  });

  afterEach(function() {
    this.container.remove();
  });

  it('should have a usage and limits in v1 orgs', function() {
    // sets usage to null since the view is using apiKeys.length
    // to show the number of keys
    this.setUsageLimit(null, 5);
    this.setup();

    expect(this.sidebar.find('> div > p').text()).toEqual(
      'Your space is using 2 out of 5 API Keys.'
    );
  });

  it('should have only usage in v2 orgs', function() {
    this.organization.pricingVersion = 'pricing_version_2';
    this.setUsageLimit(2, 3);
    this.setup();

    expect(this.sidebar.find('> div > p').text()).toBe('Your space is using 2 API Keys.');
  });

  it('should have have proper pluralization', function() {
    this.organization.pricingVersion = 'pricing_version_2';
    this.setUsageLimit(1, 3);
    this.setup();

    expect(this.sidebar.find('> div > p').text()).toBe('Your space is using 1 API Key.');
    this.setUsageLimit(2, 3);
    this.setup();
    expect(this.sidebar.find('> div > p').text()).toBe('Your space is using 2 API Keys.');
  });

  it('should disable the button if the limit is reached for v1 orgs', function() {
    this.setUsageLimit(2, 2);
    this.setup();

    expect(this.sidebar.find('button.btn-action').attr('disabled')).toBe('disabled');
  });

  it('list has 2 elements', function() {
    this.setup();
    const list = this.container.find('.api-key-list');
    expect(list.find('.entity-list__item').length).toBe(2);
  });

  it('save button is disabled', function() {
    this.accessChecker.shouldDisable.returns(true);
    this.setup();
    expect(this.sidebar.find('.btn-action').attr('aria-disabled')).toBe('true');
  });

  it('save button is enabled', function() {
    this.setup();
    expect(this.sidebar.find('.btn-action').attr('aria-disabled')).toBeUndefined();
  });
});
