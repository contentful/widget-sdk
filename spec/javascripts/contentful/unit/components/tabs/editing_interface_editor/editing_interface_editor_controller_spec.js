'use strict';
describe('EditingInterfaceEditorController', function(){
  var scope, controller, editingInterfaces, $q;

  beforeEach(function() {
    module('contentful/test', function($provide) {
      editingInterfaces = {
        saveForContentType:   sinon.stub(),
        forContentTypeWithId: sinon.stub()
      };
      $provide.value('editingInterfaces', editingInterfaces);
    });
    inject(function($rootScope, $controller, _$q_) {
      $q = _$q_;
      scope = $rootScope.$new();
      scope.tab = { params: {
          editingInterface: {id: 'default', local: true}
        } };
      controller = $controller('EditingInterfaceEditorController', {$scope: scope});
      scope.$apply();
    });
  });

  afterEach(inject(function($log) {
    $log.assertEmpty();
  }));

  it('should reset the interface when saving fails', function(){
    editingInterfaces.saveForContentType.returns($q.reject());
    editingInterfaces.forContentTypeWithId.returns($q.when({id: 'default', remote: true}));
    scope.update();
    scope.$apply();
    expect(scope.editingInterface.remote).toBe(true);
  });

  it('should update the interface after saving', function () {
    editingInterfaces.saveForContentType.returns($q.when({id: 'default', remote: true}));
    scope.update();
    scope.$apply();
    expect(scope.editingInterface.remote).toBe(true);
  });
  
  
});

