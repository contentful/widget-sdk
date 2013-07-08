'use strict';

describe('The Space context', function () {

  var spaceContext;
  var broadcastSpy;

  beforeEach(function () {
    module('contentful/test');
    inject(function ($rootScope, SpaceContext) {
      spaceContext = new SpaceContext(window.createMockSpace('test'));
      broadcastSpy = sinon.spy($rootScope, '$broadcast');
    });
  });

  afterEach(function () {
    broadcastSpy.restore();
  });

  it('registers a new published content type', function () {
    spaceContext.registerPublishedContentType(window.createMockEntity('content'));
    expect(broadcastSpy.calledWith('newContentTypePublished')).toBeTruthy();
  });

});
