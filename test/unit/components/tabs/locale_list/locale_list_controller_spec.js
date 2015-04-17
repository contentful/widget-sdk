'use strict';

describe('Locale List Controller', function () {
  var controller;
  beforeEach(function () {
    module('contentful/test');
    this.scope = this.$inject('$rootScope').$new();
    this.$q = this.$inject('$q');
    this.apiErrorHandler = this.$inject('ReloadNotification').apiErrorHandler;

    this.scope.spaceContext = {
      space: {
        getLocales: sinon.stub().returns(this.$q.when({}))
      }
    };

    controller = this.$inject('$controller')('LocaleListController', {$scope: this.scope});
  });

  describe('refreshing locales', function () {
    beforeEach(function () {
      this.scope.refreshLocales();
      this.scope.$apply();
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
      this.scope.refreshLocales();
      this.scope.$apply();
    });

    it('results in an error message', function () {
      sinon.assert.called(this.apiErrorHandler);
    });
  });
});
