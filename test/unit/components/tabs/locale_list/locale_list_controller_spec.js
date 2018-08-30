'use strict';

describe('Locale List Controller', () => {
  beforeEach(function() {
    module('contentful/test');
    this.scope = this.$inject('$rootScope').$new();
    this.apiErrorHandler = this.$inject('ReloadNotification').apiErrorHandler;
    this.$inject('access_control/AccessChecker').hasFeature = sinon.stub().resolves(true);

    this.scope.context = {};

    this.localeStore = this.$inject('TheLocaleStore');
    this.localeStore.refresh = sinon.stub().resolves([{}]);

    this.organization = {
      usage: {
        permanent: {
          locale: 1
        }
      },
      subscriptionPlan: {
        limits: {
          features: {},
          permanent: {
            locale: 1
          }
        }
      },
      sys: {
        id: 'org_1234'
      }
    };

    this.space = {
      sys: {
        id: 'space_1234',
        createdBy: {
          sys: {
            id: '1234'
          }
        }
      },
      organization: this.organization
    };

    this.mockService('services/TokenStore.es6', {
      getSpace: sinon.stub().resolves(this.space),
      getOrganization: sinon.stub().resolves(this.organization)
    });

    const spaceContext = this.$inject('spaceContext');

    spaceContext.organizationContext = {
      organization: this.organization
    };

    spaceContext.space = {
      data: this.space,
      getId: sinon.stub().returns(this.space.sys.id),
      getOrganizationId: sinon.stub().returns(this.organization.sys.id)
    };

    this.createController = () => {
      this.$inject('$controller')('LocaleListController', { $scope: this.scope });
      this.$apply();
    };
  });

  describe('refreshing locales', () => {
    beforeEach(function() {
      this.createController();
    });

    it('refreshes and gets locales', function() {
      sinon.assert.calledOnce(this.localeStore.refresh);
    });

    it('places locales on scope', function() {
      expect(this.scope.locales).toEqual([{}]);
    });
  });

  describe('refreshing locales fails', () => {
    beforeEach(function() {
      this.localeStore.refresh.rejects({ statusCode: 500 });
      this.createController();
    });

    it('results in an error message', function() {
      sinon.assert.called(this.apiErrorHandler);
    });
  });
});
