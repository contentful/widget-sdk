describe('The Webhook Definition list directive', function () {
  beforeEach(function () {
    this.webhooks = [
      {
        name: 'https://example.com/hook_one',
        sys: {
          id: 1
        }
      },
      {
        name: 'https://example.com/hook_two',
        sys: {
          id: 2
        }
      }
    ];

    this.resource = {
      usage: this.webhooks.length,
      limits: {
        included: 5,
        maximum: 5
      }
    };

    this.setWebhooks = webhooks => {
      this.webhooks = webhooks;
      this.resource.usage = webhooks.length;
    };

    module('contentful/test', ($provide) => {
      $provide.removeDirectives('cfWebhookHealth');
      $provide.value('WebhookRepository', {
        getInstance: () => {
          return {
            getAll: sinon.stub().resolves(this.webhooks)
          };
        }
      });
      $provide.value('services/ResourceService', {
        default: () => {
          return {
            get: sinon.stub().resolves(this.resource)
          };
        }
      });
    });

    this.LD = this.$inject('utils/LaunchDarkly');
    this.LD.getCurrentVariation = sinon.stub().resolves(false);

    this.$q = this.$inject('$q');

    this.organization = {
      pricingVersion: 'pricing_version_1',
      sys: {
        id: 'org_1234'
      }
    };

    this.space = {
      organization: this.organization,
      sys: {
        id: 'space_1234'
      }
    };

    const spaceContext = this.$inject('spaceContext');

    spaceContext.organizationContext = {
      organization: this.organization
    };

    spaceContext.space = {
      data: this.space,
      getId: sinon.stub().returns(this.space.sys.id)
    };

    this.compile = function () {
      this.container = this.$compile('<cf-webhook-list />', {
        context: {}
      });
    };
  });

  afterEach(function () {
    this.container.remove();
  });

  it('should have a list that cooresponds to the number of webhooks in the list', function () {
    this.compile();

    let list;

    // Two webhooks
    list = this.container.find('.table__body tbody');
    expect(list.find('tr').length).toBe(2);

    // Three webhooks
    this.webhooks.push({
      name: 'Webhook 3',
      sys: {
        id: 3
      }
    });

    this.compile();

    list = this.container.find('.table__body tbody');
    expect(list.find('tr').length).toBe(3);
  });

  it('should only show the sidebar for non-legacy organizations', function () {
    // Legacy organization
    this.compile();

    expect(this.container.find('.entity-sidebar').length).toBe(0);

    // Newer organization
    this.organization.pricingVersion = 'pricing_version_2';
    this.compile();

    expect(this.container.find('.entity-sidebar').length).toBe(1);
  });

  describe('Version 1 organizations', function () {
    it('should show the number of webhooks in the list in the header', function () {
      this.compile();

      const text = this.container.find('h1.workbench-header__title').text();

      expect(text).toBe('Webhooks (2)');
    });

    it('should show the button if the limit is not reached', function () {
      this.compile();

      const button = this.container.find('.workbench-header__actions > button');
      expect(button.length).toBe(1);
    });

    it('should show no button and an error if the limit is reached', function () {
      this.resource.limits.included = 2;
      this.resource.limits.maximum = 2;

      this.compile();

      const actions = this.container.find('.workbench-header__actions');

      const button = actions.find('> button');
      expect(button.length).toBe(0);

      const text = actions.text();
      expect(text).toBe("You can't create more than 2 webhooks.");
    });
  });

  describe('Version 2 organizations', function () {
    beforeEach(function () {
      this.organization.pricingVersion = 'pricing_version_2';
    });

    it('should show an "empty" message when there are no webhooks', function () {
      // No webhooks
      this.setWebhooks([]);
      this.compile();

      const sidebar = this.container.find('.entity-sidebar');
      const text = sidebar.find('> div > p').eq(0).text();

      expect(text).toBe("Your space isn't using any webhooks.");
    });

    it('should handle pluralization', function () {
      this.setWebhooks([
        {
          name: 'https://example.com/hook_one',
          sys: {
            id: 1
          }
        }
      ]);

      this.compile();

      let sidebar;
      let text;

      sidebar = this.container.find('.entity-sidebar');
      text = sidebar.find('> div > p').eq(0).text();

      expect(text).toBe('Your space is using 1 webhook.');

      this.setWebhooks([
        {
          name: 'https://example.com/hook_one',
          sys: {
            id: 1
          }
        },
        {
          name: 'https://example.com/hook_two',
          sys: {
            id: 2
          }
        }
      ]);

      this.compile();

      sidebar = this.container.find('.entity-sidebar');
      text = sidebar.find('> div > p').eq(0).text();

      expect(text).toBe('Your space is using 2 webhooks.');
    });
  });
});
