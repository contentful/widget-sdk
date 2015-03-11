'use strict';
describe('EditingInterfaceEditorController', function(){
  var scope, controller, editingInterfaces, $q, notification;

  beforeEach(function() {
    module('contentful/test', function($provide) {
      editingInterfaces = {
        save: sinon.stub(),
        syncWidgets: sinon.stub(),
        forContentTypeWithId: sinon.stub()
      };
      $provide.value('editingInterfaces', editingInterfaces);
    });
    inject(function($rootScope, $controller, _$q_, _notification_) {
      $q = _$q_;
      notification = _notification_;
      scope = $rootScope.$new();
      scope.spaceContext = {space: {}};
      scope.tab = { params: {
          editingInterface: {
            data: {id: 'default', local: true},
            getId: _.constant('default')
          } } };
      controller = $controller('EditingInterfaceEditorController', {$scope: scope});
      scope.$apply();
    });
  });

  it('should sync the widgets when the fields change', function() {
    editingInterfaces.syncWidgets.reset();
    scope.contentType = {data: {fields: ['newField']}};
    scope.$apply();
    sinon.assert.called(editingInterfaces.syncWidgets);
  });

  describe('saving the interface but failing with VersionMismatch', function() {
    beforeEach(function() {
      editingInterfaces.save.returns($q.reject({body: {sys: {type: 'Error', id: 'VersionMismatch'}}}));
      editingInterfaces.forContentTypeWithId.returns($q.when({data: {id: 'default', remote: true}}));
      scope.update();
      scope.$apply();
    });

    it('should reset the interface', function(){
      expect(scope.editingInterface.data.remote).toBe(true);
    });

    it('should show a warning', function() {
      sinon.assert.called(notification.warn);
    });
  });

  describe('saving the interface but failing with other errors', function() {
    beforeEach(function() {
      editingInterfaces.save.returns($q.reject());
      scope.update();
      scope.$apply();
    });

    it('should not reset the interface', function(){
      sinon.assert.notCalled(editingInterfaces.forContentTypeWithId);
    });

    it('show show an error', function() {
      sinon.assert.called(notification.error);
    });
  });

  describe('saving the interface successfully', function () {
    beforeEach(function() {
      editingInterfaces.save.returns($q.when({data: {id: 'default', remote: true}}));
      scope.update();
      scope.$apply();
    });

    it('should update the interface', function () {
      expect(scope.editingInterface.data.remote).toBe(true);
    });

    it('should show a notification', function() {
      sinon.assert.called(notification.info);
    });

  });

  it('should close the tab when the content type is unpublished', function () {
    scope.tab.params.contentType = {};
    scope.tab.close = sinon.stub();
    scope.$broadcast('contentTypeUnpublished', scope.tab.params.contentType);
    sinon.assert.called(scope.tab.close);
  });

  it('should mark widgets without fields as invisible', function() {
    scope.contentType = {
      data: {fields: [
        {id: 'foo', disabled: true}
      ]}
    };
    var visibility = controller.isWidgetVisible({fieldId: 'bar'});
    expect(visibility).toBeFalsy();
  });

  it('should mark disabled widgets as invisible', function() {
    scope.preferences = {showDisabledFields:  false};
    scope.contentType = {
      data: {fields: [
        {id: 'foo', disabled: true}
      ]}
    };
    var visibility = controller.isWidgetVisible({fieldId: 'foo'});
    expect(visibility).toBeFalsy();
    scope.preferences.showDisabledFields = true;
    visibility = controller.isWidgetVisible({fieldId: 'foo'});
    expect(visibility).toBeTruthy();
  });
  
});

