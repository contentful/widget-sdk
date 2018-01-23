'use strict';

describe('Locale List Controller', function () {
  beforeEach(function () {
    module('contentful/test');
    this.scope = this.$inject('$rootScope').$new();
    this.apiErrorHandler = this.$inject('ReloadNotification').apiErrorHandler;

    this.scope.context = {};

    this.localeStore = this.$inject('TheLocaleStore');
    this.localeStore.refresh = sinon.stub().resolves([{}]);

    this.createController = () => {
      this.$inject('$controller')('LocaleListController', {$scope: this.scope});
      this.$apply();
    };
  });

  describe('refreshing locales', function () {
    beforeEach(function () {
      this.createController();
    });

    it('refreshes and gets locales', function () {
      sinon.assert.calledOnce(this.localeStore.refresh);
    });

    it('places locales on scope', function () {
      expect(this.scope.locales).toEqual([{}]);
    });
  });

  describe('refreshing locales fails', function () {
    beforeEach(function () {
      this.localeStore.refresh.rejects({statusCode: 500});
      this.createController();
    });

    it('results in an error message', function () {
      sinon.assert.called(this.apiErrorHandler);
    });
  });
});
