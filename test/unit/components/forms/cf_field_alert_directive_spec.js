'use strict';

describe('cfFieldAlert Directive', () => {
  beforeEach(function () {
    module('contentful/test');
    this.element = this.$compile('<div cf-field-alert="message" class="cf-field-alert"></div>');
  });

  it('element exists', function () {
    expect(this.element.get(0)).toBeDefined();
  });

  it('element exists and has class name', function () {
    expect(this.element).toHaveClass('cf-field-alert');
  });

  it('tag was replaced', function () {
    expect(this.element.get(0).tagName.toLowerCase()).toBe('i');
  });

  it('has tooltip message via attr', function () {
    expect(this.element.attr('tooltip')).toEqual('message');
  });
});
