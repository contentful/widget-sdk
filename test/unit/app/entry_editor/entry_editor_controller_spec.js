'use strict';

describe('Entry Editor Controller', function () {
  var controller, scope;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeControllers(
        'FormWidgetsController',
        'PermissionController',
        'entityEditor/LocalesController',
        'entityEditor/StatusNotificationsController'
      );
      $provide.value('TheLocaleStore', {
        getLocalesState: sinon.stub().returns({}),
        getDefaultLocale: sinon.stub().returns({internal_code: 'en-US'}),
        getPrivateLocales: sinon.stub().returns([{internal_code: 'en-US'}, {internal_code: 'de-DE'}])
      });
    });
    inject(function ($compile, $rootScope, $controller, cfStub){
      scope = $rootScope;
      scope.otDoc = {doc: {}, state: {}};
      scope.contentType = {data: cfStub.contentTypeData()};
      scope.context = {};

      var space = cfStub.space('testSpace');
      var entry = cfStub.entry(space, 'testEntry', 'testType', {}, {
        sys: { publishedVersion: 1 }
      });
      scope.entry = entry;
      scope.permissionController = {
        can: sinon.stub().returns({can: true})
      };
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
      scope.permissionController.can.withArgs('update', scope.entry.data).returns({can: true});
      scope.$apply();
      expect(scope.otDoc.state.disabled).toBe(false);
    });

    it('to enabled', function () {
      scope.permissionController.can.withArgs('update', scope.entry.data).returns({can: false});
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

  // Prevents badly created fields via the API from breaking the editor
  describe('creates field structure if any fields are null', function() {
    beforeEach(function() {
      var $controller = this.$inject('$controller');
      scope.contentType.data = {
        fields: [
          {id: 'field1'},
          {id: 'field2'},
          {id: 'field3', localized: true}
        ]
      };
      controller = $controller('EntryEditorController', {$scope: scope});

      this.atStub = sinon.stub();
      this.setStub = sinon.stub();
      this.atStub.returns({
        set: this.setStub
      });
      scope.otDoc = {
        doc: {
          at: this.atStub
        },
        state: {}
      };
      scope.entry.data.fields = {
        field1: {'en-US': 'field1'},
        field2: null,
        field3: null
      };
      this.$apply();
    });

    it('calls set twice', function() {
      sinon.assert.calledTwice(this.setStub);
    });

    it('calls set for field2', function() {
      sinon.assert.calledWith(this.setStub, {'en-US': null});
    });

    it('calls set for field3', function() {
      sinon.assert.calledWith(this.setStub, {'en-US': null, 'de-DE': null});
    });

  });

});
