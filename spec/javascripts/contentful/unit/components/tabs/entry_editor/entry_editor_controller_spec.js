'use strict';

describe('Entry Editor Controller', function () {
  var controller, scope;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeControllers('PermissionController');
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
      scope.tab = { params: { entry: entry } };
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
    expect(scope.validate).toBeCalled();
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
      var oldTitle = scope.tab.title;
      scope.spaceContext.entryTitle.returns('bar');
      scope.$digest();
      expect(scope.tab.title).toEqual('bar');
      expect(scope.tab.title).not.toEqual(oldTitle);
    });
  });

  describe('when it receives an entityDeleted event', function () {
    var closeSpy, otherScope;
    beforeEach(function () {
      closeSpy = scope.tab.close = sinon.spy();
      otherScope = scope.$new();
    });
    it('should close the tab', function () {
      otherScope.$emit('entityDeleted', null);
      expect(closeSpy).not.toBeCalled(); // wrong entry
      scope.$broadcast('entityDeleted', scope.entry);
      expect(closeSpy).not.toBeCalled(); // own scope
      otherScope.$emit('entityDeleted', scope.entry);
      expect(closeSpy).toBeCalled();
    });
  });

  describe('when the published version changes', function () {
    it('should validate', function () {
      scope.validate = sinon.spy();
      scope.entry.data.sys.publishedVersion++;
      scope.$digest();
      expect(scope.validate).toBeCalled();
    });
  });

  describe('setting the tab dirty state', function () {
    beforeEach(function () {
      scope.otDoc = {};
      scope.$digest();
    });
    it('should be false by default', function () {
      expect(scope.tab.dirty).toBe(false);
    });
    it('should be true when modified', function () {
      scope.otDoc.version = scope.entry.getPublishedVersion() + 2;
      scope.$digest();
      expect(scope.tab.dirty).toBe(true);
    });
    it('should be "draft" when no published version available', function () {
      scope.entry.getPublishedVersion = sinon.stub().returns(undefined);
      scope.$digest();
      expect(scope.tab.dirty).toBe('draft');
    });
  });

  it('should validate when ot became editable', function () {
    scope.validate = sinon.stub();
    scope.entry.data.fields = {foo: {'en-US': 'bar'}};
    scope.$broadcast('otBecameEditable');
    expect(scope.validate).toBeCalled();
  });

});

