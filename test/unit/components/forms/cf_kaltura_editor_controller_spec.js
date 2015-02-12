'use strict';

describe('Kaltura Editor Controller', function () {
  var kalturaMultiVideoEditorController, kalturaClientWrapperMock, scope;

  beforeEach(function() {
    module('contentful/test');
    module(function($provide){
      kalturaClientWrapperMock = jasmine.createSpyObj('kalturaClientWrapperMock', ['setOrganizationId']);
      $provide.value('kalturaClientWrapper', kalturaClientWrapperMock);
    });

    inject(function($controller, $rootScope){
      scope = $rootScope.$new();
      scope.spaceContext = {space: { getOrganizationId: sinon.stub() }};
      scope.spaceContext.space.getOrganizationId.returns('org-123');

      kalturaMultiVideoEditorController = $controller('cfKalturaEditorController', {$scope: scope});
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('calls the #setOrganizationId method of the kaltura client wrapper', function() {
    expect(kalturaClientWrapperMock.setOrganizationId).toHaveBeenCalledWith('org-123');
  });
});

