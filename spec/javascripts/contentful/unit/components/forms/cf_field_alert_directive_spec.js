'use strict';

describe('cfFieldAlert Directive', function () {
  var element, scope;

  beforeEach(function () {
    module('contentful/test');

    inject(function ($compile, $rootScope) {
      scope = $rootScope.$new();

      element = $compile('<div cf-field-alert="message"></div>')(scope);
      scope.$digest();
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('element exists', function() {
    expect(element.get(0)).toBeDefined();
  });

  it('element exists and has class name', function() {
    expect(element).toHaveClass('cf-field-alert');
  });

  it('tag was replaced', function() {
    expect(element.get(0).tagName.toLowerCase()).toBe('i');
  });

  it('has tooltip message via attr', function() {
    expect(element.attr('tooltip')).toEqual('message');
  });

});
