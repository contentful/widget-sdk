'use strict';

describe('Entry Editor Controller', function () {
  var controller, scope, accessChecker;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeControllers(
        'FormWidgetsController',
        'entityEditor/LocalesController',
        'entityEditor/StatusNotificationsController'
      );
      $provide.value('TheLocaleStore', {
        getLocalesState: sinon.stub().returns({}),
        getDefaultLocale: sinon.stub().returns({internal_code: 'en-US'}),
        getPrivateLocales: sinon.stub().returns([{internal_code: 'en-US'}, {internal_code: 'de-DE'}])
      });
    });
    inject(function ($compile, $rootScope, $controller, cfStub, _accessChecker_){
      scope = $rootScope;
      scope.otDoc = {doc: {}, state: {}};
      var ctData = cfStub.contentTypeData();
      scope.contentType = {data: ctData, getId: _.constant(ctData.sys.id)};
      scope.context = {};

      var space = cfStub.space('testSpace');
      var entry = cfStub.entry(space, 'testEntry', 'testType', {}, {
        sys: { publishedVersion: 1 }
      });
      scope.entry = entry;
      accessChecker = _accessChecker_;
      accessChecker.canUpdateEntry = sinon.stub().returns(true);
      controller = $controller('EntryEditorController', {$scope: scope});
      this.$apply();
    });
  });

  it('should validate if the published version has changed', function () {
    scope.validate = sinon.spy();
    scope.entry.data.sys.publishedVersion = 2;
    scope.$digest();
    sinon.assert.called(scope.validate);
  });

  describe('sets the otDoc.state.disabled flag', function () {
    beforeEach(function(){
      scope.otDoc = {
        state: { disabled: false }
      };
    });

    it('to disabled', function () {
      accessChecker.canUpdateEntry.returns(true);
      scope.$apply();
      expect(scope.otDoc.state.disabled).toBe(false);
    });

    it('to enabled', function () {
      accessChecker.canUpdateEntry.returns(false);
      scope.$apply();
      expect(scope.otDoc.state.disabled).toBe(true);
    });
  });

  describe('when the entry title changes', function () {
    it('should update the tab title', function () {
      var spaceContext = this.$inject('spaceContext');
      spaceContext.entryTitle = sinon.stub();

      spaceContext.entryTitle.returns('foo');
      this.$apply();
      expect(scope.context.title).toEqual('foo');

      spaceContext.entryTitle.returns('bar');
      this.$apply();
      expect(scope.context.title).toEqual('bar');
    });
  });


  describe('when the published version changes', function () {
    it('should validate', function () {
      scope.validate = sinon.spy();
      scope.entry.data.sys.publishedVersion++;
      scope.$digest();
      sinon.assert.called(scope.validate);
    });
  });

  describe('setting the tab dirty state', function () {
    beforeEach(function () {
      scope.otDoc = {doc: {}, state: {}};
      scope.$digest();
    });
    it('should be false by default', function () {
      expect(scope.context.dirty).toBe(false);
    });
    it('should be true when modified', function () {
      scope.otDoc.doc.version = scope.entry.getPublishedVersion() + 2;
      scope.$digest();
      expect(scope.context.dirty).toBe(true);
    });
    it('should be "draft" when no published version available', function () {
      scope.entry.getPublishedVersion = sinon.stub().returns(undefined);
      scope.$digest();
      expect(scope.context.dirty).toBe('draft');
    });
  });

  it('should validate when ot became editable', function () {
    scope.validate = sinon.stub();
    scope.entry.data.fields = {foo: {'en-US': 'bar'}};
    scope.$broadcast('otBecameEditable');
    sinon.assert.called(scope.validate);
  });


  /**
   * This tests that the EntryEditorController creates placeholders for
   * primitive types and empty collections. See `setupFieldLocales()`.
   * The test is very flaky and requires a new controller for each test
   * due to the placeholder validation being done when the controller is being
   * created. See BUG#6696
   */
  describe('ensures that placeholders are created for empty fields',
  function() {
    //We are creating a controller with a specific set of scope data for each
    //test because the controller does validation upon creation.
    var $controller, scope;
    beforeEach(function() {
      /**
       * Since the controller runs validations on the data as soon as it's
       * created, we need to create the controller manually in each test to
       * ensure that the `cleanupEntryFields()` function is called. It seems
       * like having a global controller doesn't work because of the `::` eval
       * once feature of the `$watchGroup()` in `cleanupEntryFields()`
       */
      $controller = this.$inject('$controller');
      // Start off with a fresh scope just to be safe since the watcher may
      // have been executed before.
      var $rootScope = this.$inject('$rootScope');
      scope = $rootScope.$new();
      this.setStub = sinon.stub();
      this.atStub = sinon.stub().returns({set: this.setStub});
      scope.otDoc = {doc: {at: this.atStub}, state: {}};
    });

    it('should check that placeholders are created for empty objects',
    function() {
      scope.contentType.data = {
        fields: [
          {id: 'a', localized: true},
        ]
      };
      scope.entry.data.fields = {
        'a': {},
      };
      $controller('EntryEditorController', {$scope:scope});
      scope.$apply();
      sinon.assert.calledWith(this.setStub,
        {'en-US': undefined, 'de-DE': undefined});
    });

    it('should check that placeholders are created for empty arrays and ' +
      'that the default locale is set for a non-localized field',
    function(){
      scope.contentType.data = {
        fields: [
          {id: 'a', localized: false},
        ]
      };
      scope.entry.data.fields = {
        'a': [],
      };
      $controller('EntryEditorController', {$scope:scope});
      scope.$apply();
      sinon.assert.calledWith(this.setStub, {'en-US': undefined});
    });

    it('should check that placeholders are created for primitive types',
    function() {
      scope.contentType.data = {
        fields: [
          {id: 'a', localized: true},
          {id: 'b', localized: true},
          {id: 'c', localized: true},
        ]
      };
      scope.entry.data.fields = {
        'a': 3,
        'b': 'string',
        'c': true
      };
      $controller('EntryEditorController', {$scope:scope});
      scope.$apply();
      sinon.assert.calledWith(this.setStub,
        {'en-US': undefined, 'de-DE': undefined});
      sinon.assert.calledThrice(this.setStub);
    });
  });

});
