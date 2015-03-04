'use strict';

describe('New content type published', function () {

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

  afterEach(function () {
    broadcastSpy.restore();
  });

  it('registers a new published content type', function () {
    spaceContext.registerPublishedContentType(contentType);
    sinon.assert.calledWith(broadcastSpy, 'contentTypePublished');
  });

  describe('fires and handles an event on the addDropdownButton directive', function () {
    var tooltipSpy, oneSpy;
    var container;
    beforeEach(inject(function ($rootScope, $compile) {
      container = $('<div class="add-dropdown-button" cf-add-dropdown-button />');
      var dropdownToggle = $('<div cd-dropdown-toggle class="dropdown-toggle" />');
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
      expect(tooltipSpy).toBeCalledTwice();
    });

    it('removes the menu', function () {
      sinon.assert.called(oneSpy);
    });
  });

});
