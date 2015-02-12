'use strict';

describe('cfOoyalaEditorController', function () {
  var ooyalaClientSpy;

  beforeEach(function() {
    module('contentful/test');
    module(function($provide){
      ooyalaClientSpy = jasmine.createSpyObj('ooyalaClientSpy', ['setOrganizationId']);
      $provide.value('ooyalaClient', ooyalaClientSpy);
    });

    inject(function ($controller, $injector, $q, $rootScope) {
      var scope          = $rootScope.$new();
      scope.spaceContext = {space: {getOrganizationId: sinon.stub().returns('org-123')}};
      $controller('cfOoyalaEditorController', {$scope: scope});
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));
 
  it('calls the #setOrganizationId method of the Ooyala client', function() {
    expect(ooyalaClientSpy.setOrganizationId).toHaveBeenCalledWith('org-123');
  });
});
