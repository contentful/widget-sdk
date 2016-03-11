'use strict';

describe('cfLearnView directive', function() {

  var controller, stubs;

  beforeEach(function() {

    var $rootScope, element;

    stubs = {
      spaceContext: {
        space: {
          getEntries: sinon.stub(),
          getContentTypes: sinon.stub(),
          getDeliveryApiKeys: sinon.stub()
        }
      },
      accessChecker: {
        getSectionVisibility: function() {
          return {
            contentType: sinon.stub(),
            entry: sinon.stub(),
            apiKey: sinon.stub()
          };
        }
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
      stubs.spaceContext.space.getContentTypes.resolves([]);
      stubs.spaceContext.space.getDeliveryApiKeys.resolves([]);
      this.compile();
    });

    it('requests content types', function() {
      sinon.assert.calledOnce(stubs.spaceContext.space.getContentTypes);
      expect(controller.hasContentTypes).toBe(false);
    });

    it('requests delivery API keys', function() {
      sinon.assert.calledOnce(stubs.spaceContext.space.getDeliveryApiKeys);
      // expect(controller.hasContentTypes).toBe(false);
    });

    it('does not request entries', function() {
      sinon.assert.notCalled(stubs.spaceContext.space.getEntries);
      expect(controller.hasEntries).toBe(false);
    });
  });


  describe('has accessible content types', function() {
    beforeEach(function() {
      stubs.accessChecker.canPerformActionOnEntryOfType = sinon.stub().returns(true);
      stubs.spaceContext.space.getContentTypes.resolves([{getId: _.noop}]);
      stubs.spaceContext.space.getEntries.resolves(true);
      stubs.spaceContext.space.getDeliveryApiKeys.resolves([]);
      this.compile();
    });

    it('sets content type data', function() {
      sinon.assert.calledOnce(stubs.spaceContext.space.getContentTypes);
      expect(controller.accessibleContentTypes.length).toBe(1);
      expect(controller.hasContentTypes).toBe(true);
      expect(controller.hasAccessibleContentTypes).toBe(true);
    });
  });

  describe('has non accessible content types', function() {
    beforeEach(function() {
      stubs.accessChecker.canPerformActionOnEntryOfType = sinon.stub().returns(false);
      stubs.spaceContext.space.getContentTypes.resolves([{getId: _.noop}]);
      stubs.spaceContext.space.getEntries.resolves(true);
      stubs.spaceContext.space.getDeliveryApiKeys.resolves([]);
      this.compile();
    });

    it('sets content type data', function() {
      sinon.assert.calledOnce(stubs.spaceContext.space.getContentTypes);
      expect(controller.accessibleContentTypes.length).toBe(0);
      expect(controller.hasContentTypes).toBe(true);
      expect(controller.hasAccessibleContentTypes).toBe(false);
    });
  });

  describe('select language', function() {
    beforeEach(function() {
      controller.selectIndex(0);
    });
    it('shows selected language', function() {
      controller.selectedLanguageName = 'Javascript';
    });
  });
});
