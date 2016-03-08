'use strict';

describe('Locale List Controller', function () {
  beforeEach(function () {
    module('contentful/test');
    this.scope = this.$inject('$rootScope').$new();
    this.$q = this.$inject('$q');
    this.apiErrorHandler = this.$inject('ReloadNotification').apiErrorHandler;

    this.scope.context = {};
    this.scope.spaceContext = {
      space: {
        getLocales: sinon.stub().returns(this.$q.when({})),
        getOrganizationId: sinon.stub()
      }
    };

    this.createController = function () {
      this.$inject('$controller')('LocaleListController', {$scope: this.scope});
      this.scope.$digest();
    };
  });

  describe('refreshing locales', function () {
    beforeEach(function() {
      this.createController();
    });

    it('calls locales getter', function () {
      sinon.assert.called(this.scope.spaceContext.space.getLocales);
    });

    it('places locales on scope', function () {
      expect(this.scope.locales).toEqual({});
    });
  });

  describe('refreshing locales fails', function () {
    beforeEach(function () {
      this.scope.spaceContext.space.getLocales.returns(this.$q.reject({statusCode: 500}));
      this.createController();
    });

    it('results in an error message', function () {
      sinon.assert.called(this.apiErrorHandler);
    });
  });
});
