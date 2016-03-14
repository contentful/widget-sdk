'use strict';

describe('Kaltura Editor Controller', function () {
  var kalturaMultiVideoEditorController, kalturaClientWrapperMock;

  beforeEach(function() {
    module('contentful/test');
    module(function($provide){
      kalturaClientWrapperMock = jasmine.createSpyObj('kalturaClientWrapperMock', ['setOrganizationId']);
      $provide.value('kalturaClientWrapper', kalturaClientWrapperMock);
    });

    inject(function($controller, spaceContext){
      spaceContext.space = { getOrganizationId: sinon.stub().returns('org-123') };
      kalturaMultiVideoEditorController = $controller('cfKalturaEditorController');
    });
  });

  afterEach(inject(function ($log) {
    kalturaMultiVideoEditorController = kalturaClientWrapperMock;
    $log.assertEmpty();
  }));

  it('calls the #setOrganizationId method of the kaltura client wrapper', function() {
    expect(kalturaClientWrapperMock.setOrganizationId).toHaveBeenCalledWith('org-123');
  });
});

