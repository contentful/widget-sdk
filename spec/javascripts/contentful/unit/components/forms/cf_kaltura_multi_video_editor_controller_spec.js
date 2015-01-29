'use strict';

describe('Kaltura Multi Video Editor Controller', function () {
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

      kalturaMultiVideoEditorController = $controller('cfKalturaMultiVideoEditorController', {$scope: scope});
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('calls the #setOrganizationId method of the kaltura client wrapper', function() {
    expect(kalturaClientWrapperMock.setOrganizationId).toHaveBeenCalledWith('org-123');
  });

  describe('overwrites the #customAttrsForPlayer method', function() {
    var attrs;
    beforeEach(function() {
      attrs = kalturaMultiVideoEditorController.customAttrsForPlayer({assetId: 'assedId-1'});
    });

    it('sets the entryId property of the returnerd object to the value of the assetId property of the passed object', function() {
      expect(attrs.entryId).toEqual('assedId-1');
    });
  });
});
