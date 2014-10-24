'use strict';
describe('EditingInterfaceEditorController', function(){
  var scope, controller, editingInterfaces, $q;

  beforeEach(function() {
    module('contentful/test', function($provide) {
      editingInterfaces = {
        save: sinon.stub(),
        forContentTypeWithId: sinon.stub()
      };
      $provide.value('editingInterfaces', editingInterfaces);
    });
    inject(function($rootScope, $controller, _$q_) {
      $q = _$q_;
      scope = $rootScope.$new();
      scope.tab = { params: {
          editingInterface: {
            data: {id: 'default', local: true}
          } } };
      controller = $controller('EditingInterfaceEditorController', {$scope: scope});
      scope.$apply();
    });
  });

  afterEach(inject(function($log) {
    $log.assertEmpty();
  }));

  it('should reset the interface when saving fails', function(){
    editingInterfaces.save.returns($q.reject());
    editingInterfaces.forContentTypeWithId.returns($q.when({data: {id: 'default', remote: true}}));
    scope.update();
    scope.$apply();
    expect(scope.editingInterface.data.remote).toBe(true);
  });

  it('should update the interface after saving', function () {
    editingInterfaces.save.returns($q.when({data: {id: 'default', remote: true}}));
    scope.update();
    scope.$apply();
    expect(scope.editingInterface.data.remote).toBe(true);
  });
  
  it('should close the tab when the content type is deleted', function () {
    scope.tab.params.contentType = {};
    scope.tab.close = sinon.stub();
    scope.$broadcast('entityDeleted', scope.tab.params.contentType);
    expect(scope.tab.close).toBeCalled();
  });

  it('should mark widgets without fields as invisible', function() {
    scope.contentType = {
      data: {fields: [
        {id: 'foo', disabled: true}
      ]}
    };
    var visibility = controller.isWidgetVisible({fieldId: 'bar'});
    expect(visibility).toBeFalsy()
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

