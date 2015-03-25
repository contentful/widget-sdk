'use strict';

describe('Entry Editor Controller', function () {
  var controller, scope;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeControllers('PermissionController');
      $provide.removeController('FormWidgetsController', function () {
        return {
          updateWidgets: sinon.stub()
        };
      });
    });
    inject(function ($compile, $rootScope, $controller, cfStub){
      scope = $rootScope;
      scope.user = {
        features: {}
      };
      var space = cfStub.space('testSpace');
      var contentTypeData = cfStub.contentTypeData('testType');
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);
      var entry = cfStub.entry(space, 'testEntry', 'testType', {}, {
        sys: { publishedVersion: 1 }
      });
      scope.context = {};
      scope.entry = entry;
      scope.permissionController = { can: sinon.stub() };
      scope.permissionController.can.returns({can: true});
      controller = $controller('EntryEditorController', {$scope: scope});
      scope.$digest();
    });
  });

  it('should validate if the published version has changed', function () {
    scope.validate = sinon.spy();
    scope.entry.data.sys.publishedVersion = 2;
    scope.$digest();
    sinon.assert.called(scope.validate);
  });

  describe('sets the otDisabled flag', function () {
    it('to disabled', function () {
      scope.permissionController.can.withArgs('update', scope.entry.data).returns({can: true});
      scope.$apply();
      expect(scope.otDisabled).toBe(false);
    });

    it('to enabled', function () {
      scope.permissionController.can.withArgs('update', scope.entry.data).returns({can: false});
      scope.$apply();
      expect(scope.otDisabled).toBe(true);
    });
  });

  describe('when the entry title changes', function () {
    beforeEach(function () {
      scope.spaceContext.entryTitle = sinon.stub().returns('foo');
    });
    it('should update the tab title', function () {
      var oldTitle = scope.context.title;
      scope.spaceContext.entryTitle.returns('bar');
      scope.$digest();
      expect(scope.context.title).toEqual('bar');
      expect(scope.context.title).not.toEqual(oldTitle);
    });
  });

  describe('when it receives an entityDeleted event', function () {
    var closeSpy, otherScope;
    beforeEach(function () {
      closeSpy = scope.closeState = sinon.spy();
      otherScope = scope.$new();
    });
    it('should close the tab', function () {
      otherScope.$emit('entityDeleted', null);
      sinon.assert.notCalled(closeSpy); // wrong entry
      scope.$broadcast('entityDeleted', scope.entry);
      sinon.assert.notCalled(closeSpy); // own scope
      otherScope.$emit('entityDeleted', scope.entry);
      sinon.assert.called(closeSpy);
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
      scope.otDoc = {};
      scope.$digest();
    });
    it('should be false by default', function () {
      expect(scope.context.dirty).toBe(false);
    });
    it('should be true when modified', function () {
      scope.otDoc.version = scope.entry.getPublishedVersion() + 2;
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
      scope.spaceContext.publishedTypeForEntry = sinon.stub();
      scope.spaceContext.publishedTypeForEntry.returns({
        data: {
          fields: [
            {id: 'field1'},
            {id: 'field2'},
            {id: 'field3', localized: true}
          ]
        }
      });
      this.atStub = sinon.stub();
      this.setStub = sinon.stub();
      this.atStub.returns({
        set: this.setStub
      });
      scope.otDoc = {
        at: this.atStub
      };
      scope.entry.data.fields = {
        field1: {'en-US': 'field1'},
        field2: null,
        field3: null
      };
      scope.$digest();
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

