'use strict';

describe('cfKalturaEditor directive', function () {
  var kalturaClientWrapperMock;

  beforeEach(function() {
    module('contentful/test', function ($provide) {
      kalturaClientWrapperMock = jasmine.createSpyObj('kalturaClientWrapperMock', ['setOrganizationId']);
      $provide.value('kalturaClientWrapper', kalturaClientWrapperMock);
    });

    var spaceContext = this.$inject('spaceContext');
    spaceContext.space = { getOrganizationId: sinon.stub().returns('org-123') };
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
    kalturaClientWrapperMock = null;
  }));

  it('calls the #setOrganizationId method of the kaltura client wrapper', function() {
    this.$compile('<cf-kaltura-editor />', {}, {
      cfWidgetApi: {
        field: {
          onValueChanged: sinon.stub()
        }
      }
    });
    expect(kalturaClientWrapperMock.setOrganizationId).toHaveBeenCalledWith('org-123');
  });
});

