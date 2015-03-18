'use strict';

describe('cfTemplate Directive', function() {

  beforeEach(function() {
    module('contentful/test');
    var $compile = this.$inject('$compile');
    var templateDirective =
      '<div id=wrapper>' +
      '  <div id=tpl cf-template=test_template>' +
      '</div>';
    this.scope = this.$inject('$rootScope').$new();
    this.compile = function(templateString) {
      JST.test_template = function() { return templateString; };
      return $compile(templateDirective)(this.scope).children();
    };
  });

  it('wraps simple string', function() {
    var compiled = this.compile('Foo');

    expect(compiled.text()).toEqual('Foo');
    expect(compiled.children().length).toEqual(0);
    expect(compiled.is('#tpl')).toBe(true);
  });

  it('wraps multiple elements', function() {
    var compiled = this.compile('<li>foo</li><li>bar</li>');

    expect(compiled.text()).toEqual('foobar');
    expect(compiled.children().length).toEqual(2);
    expect(compiled.is('#tpl')).toBe(true);
  });

  it('links the scope', function() {
    var compiled = this.compile('<div data="{{bar}}">{{foo}}</div>');
    var content = compiled.children();
    expect(content.text()).toEqual('{{foo}}');
    expect(content.attr('data')).toEqual('{{bar}}');

    this.scope.foo = 'applied';
    this.scope.bar = 'applied data';
    this.scope.$apply();
    expect(content.text()).toEqual('applied');
    expect(content.attr('data')).toEqual('applied data');
  });
});
