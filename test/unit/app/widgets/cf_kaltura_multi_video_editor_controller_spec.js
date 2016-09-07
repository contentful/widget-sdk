'use strict';

describe('Kaltura Multi Video Editor Controller', function () {
  let kalturaMultiVideoEditorController, kalturaClientWrapperMock;

  beforeEach(function () {
    module('contentful/test');
    module(function ($provide) {
      kalturaClientWrapperMock = jasmine.createSpyObj('kalturaClientWrapperMock', ['setOrganizationId']);
      $provide.value('kalturaClientWrapper', kalturaClientWrapperMock);
    });

    const spaceContext = this.$inject('spaceContext');
    spaceContext.space = {
      getOrganizationId: sinon.stub().returns('org-123')
    };

    const $controller = this.$inject('$controller');
    kalturaMultiVideoEditorController = $controller('cfKalturaMultiVideoEditorController');
  });

  afterEach(inject(function ($log) {
    kalturaMultiVideoEditorController = kalturaClientWrapperMock = null;
    $log.assertEmpty();
  }));

  it('calls the #setOrganizationId method of the kaltura client wrapper', function () {
    expect(kalturaClientWrapperMock.setOrganizationId).toHaveBeenCalledWith('org-123');
  });

  describe('overwrites the #customAttrsForPlayer method', function () {
    let attrs;
    beforeEach(function () {
      attrs = kalturaMultiVideoEditorController.customAttrsForPlayer({assetId: 'assedId-1'});
    });

    it('sets the entryId property of the returnerd object to the value of the assetId property of the passed object', function () {
      expect(attrs.entryId).toEqual('assedId-1');
    });
  });
});
