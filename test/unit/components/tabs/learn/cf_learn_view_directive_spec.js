'use strict';

describe('cfLearnView directive', function() {

  var controller, stubs, $rootScope;

  beforeEach(function() {

    var element;

    stubs = {
      spaceContext: {
        space: {
          getEntries: sinon.stub(),
          getDeliveryApiKeys: sinon.stub()
        },
        refreshContentTypes: sinon.stub(),
        getFilteredAndSortedContentTypes: sinon.stub()
      },
      accessChecker: {
        getSectionVisibility: function() {
          return {
            contentType: sinon.stub(),
            entry: sinon.stub(),
            apiKey: sinon.stub()
          };
        },
        shouldDisable: sinon.stub()
      }
    };

    module('contentful/test', function($provide) {
      $provide.value('spaceContext', stubs.spaceContext);
      $provide.value('accessChecker', stubs.accessChecker);
    });

    $rootScope = this.$inject('$rootScope');

    stubs.accessChecker.getSectionVisibility().contentType.returns(true);
    stubs.accessChecker.getSectionVisibility().entry.returns(true);
    stubs.accessChecker.getSectionVisibility().apiKey.returns(true);
    stubs.accessChecker.shouldDisable.returns(false);
    stubs.spaceContext.refreshContentTypes.resolves();

    this.compile = function() {
      element = this.$compile('<cf-learn-view />', {
        context: {}
      });
      controller = element.scope().learn;
      $rootScope.$digest();
    };
  });

  describe('no content types', function() {
    beforeEach(function() {
      stubs.spaceContext.getFilteredAndSortedContentTypes.returns([]);
      stubs.spaceContext.space.getDeliveryApiKeys.resolves([]);
      this.compile();
    });

    it('requests content types', function() {
      sinon.assert.calledOnce(stubs.spaceContext.getFilteredAndSortedContentTypes);
      expect(controller.hasContentTypes).toBe(false);
    });

    it('requests delivery API keys', function() {
      sinon.assert.calledOnce(stubs.spaceContext.space.getDeliveryApiKeys);
    });

    it('does not request entries', function() {
      sinon.assert.notCalled(stubs.spaceContext.space.getEntries);
      expect(controller.hasEntries).toBe(false);
    });
  });


  describe('has accessible content types', function() {
    beforeEach(function() {
      stubs.accessChecker.canPerformActionOnEntryOfType = sinon.stub().returns(true);
      stubs.spaceContext.getFilteredAndSortedContentTypes.returns([{getId: _.noop}]);
      stubs.spaceContext.space.getEntries.resolves(true);
      stubs.spaceContext.space.getDeliveryApiKeys.resolves([]);
      this.compile();
    });

    it('sets content type data', function() {
      sinon.assert.calledOnce(stubs.spaceContext.getFilteredAndSortedContentTypes);
      expect(controller.accessibleContentTypes.length).toBe(1);
      expect(controller.hasContentTypes).toBe(true);
      expect(controller.hasAccessibleContentTypes).toBe(true);
    });
  });

  describe('has non accessible content types', function() {
    beforeEach(function() {
      stubs.accessChecker.canPerformActionOnEntryOfType = sinon.stub().returns(false);
      stubs.spaceContext.getFilteredAndSortedContentTypes.returns([{getId: _.noop}]);
      stubs.spaceContext.space.getEntries.resolves(true);
      stubs.spaceContext.space.getDeliveryApiKeys.resolves([]);
      this.compile();
    });

    it('sets content type data', function() {
      sinon.assert.calledOnce(stubs.spaceContext.getFilteredAndSortedContentTypes);
      expect(controller.accessibleContentTypes.length).toBe(0);
      expect(controller.hasContentTypes).toBe(true);
      expect(controller.hasAccessibleContentTypes).toBe(false);
    });

    it('refreshes when `cfAfterOnboarding` is broadcast', function() {
      $rootScope.$broadcast('cfAfterOnboarding');
      $rootScope.$digest();
      sinon.assert.calledTwice(stubs.spaceContext.getFilteredAndSortedContentTypes);
    });
  });

  describe('select language', function() {
    beforeEach(function() {
      stubs.spaceContext.getFilteredAndSortedContentTypes.returns([]);
      stubs.spaceContext.space.getDeliveryApiKeys.resolves([]);
      this.compile();
      controller.selectLanguage(controller.languageData[0]);
    });
    it('shows selected language', function() {
      controller.selectedLanguage.name = 'Javascript';
    });
  });
});
