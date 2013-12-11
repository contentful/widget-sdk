'use strict';

describe('The Space context', function () {

  var spaceContext;
  var broadcastSpy;

  beforeEach(function () {
    module('contentful/test');
    inject(function ($rootScope, SpaceContext, cfStub) {
      spaceContext = new SpaceContext(cfStub.space('test'));
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

  it('fires and handles an event on the tablistButton directive', inject(function ($rootScope, $compile) {
    var container = $('<div class="tablist-button" />');
    var dropdownToggle = $('<div class="dropdown-toggle" />');
    container.append(dropdownToggle);
    container.appendTo($('body'));

    var compiled = $compile(container);
    compiled($rootScope.$new());

    var tooltipSpy = sinon.spy($.fn, 'tooltip');
    var oneSpy = sinon.spy($.fn, 'one');

    spaceContext.registerPublishedContentType(window.createMockEntity('content'));

    expect(tooltipSpy.calledTwice).toBeTruthy();
    expect(oneSpy.called).toBeTruthy();

    container.remove();
    tooltipSpy.restore();
    oneSpy.restore();
  }));

});
