'use strict';

describe('The Space context', function () {

  var space, spaceContext, contentType;
  var broadcastSpy;

  beforeEach(function () {
    module('contentful/test');
    inject(function ($rootScope, SpaceContext, cfStub) {
      space = cfStub.space('test');
      spaceContext = new SpaceContext(space);
      contentType = cfStub.contentType(space, 'content_type1', 'contentType');
      broadcastSpy = sinon.spy($rootScope, '$broadcast');
    });
  });

  afterEach(inject(function ($log) {
    broadcastSpy.restore();
    $log.assertEmpty();
  }));

  it('registers a new published content type', function () {
    spaceContext.registerPublishedContentType(contentType);
    expect(broadcastSpy).toBeCalledWith('newContentTypePublished');
  });

  describe('fires and handles an event on the addDropdownButton directive', function () {
    var tooltipSpy, oneSpy;
    var container;
    beforeEach(inject(function ($rootScope, $compile) {
      container = $('<div class="add-dropdown-button" />');
      var dropdownToggle = $('<div class="dropdown-toggle" />');
      container.append(dropdownToggle);
      container.appendTo($('body'));

      var compiled = $compile(container);
      compiled($rootScope.$new());

      tooltipSpy = sinon.spy($.fn, 'tooltip');
      oneSpy = sinon.spy($.fn, 'one');

      spaceContext.registerPublishedContentType(contentType);
    }));

    afterEach(function () {
      container.remove();
      tooltipSpy.restore();
      oneSpy.restore();
    });

    it('shows a tooltip', function () {
      expect(tooltipSpy.calledTwice).toBeTruthy();
    });

    it('removes the menu', function () {
      expect(oneSpy).toBeCalled();
    });
  });

});
