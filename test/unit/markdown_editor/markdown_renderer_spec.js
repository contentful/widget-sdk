'use strict';

describe('Markdown renderer', function () {
  var render;
  var marked = window.cfLibs.markdown.marked;

  function assertRenderedContains(md, html) {
    expect(render(md).indexOf(html) > -1).toBe(true);
  }

  beforeEach(function () {
    module('contentful/test');
    var create = this.$inject('MarkdownEditor/renderer');
    render = create(marked);
  });

  it('renders links with target=_blank', function () {
    var md = '[x](http://test.com)';
    var html = '<a href="http://test.com" target="_blank">x</a>';
    assertRenderedContains(md, html);
  });

  it('renders image in a wrapper', function () {
    var md = '![x](/favicon.gif)';
    var html = '<div class="markdown-image-placeholder"><img';
    assertRenderedContains(md, html);
  });

  it('supports GFM tables', function () {
    var md = ' x | y \n - | - \n 1 | 2';
    var html = '<table>';
    assertRenderedContains(md, html);
  });

  // don't be scared, we use ng-sanitize later on..
  // so we just don't want to perform the same work twice
  it('does not sanitize output', function () {
    var md = '**test** <a onclick="alert(1)">x</a>';
    var html = '<a onclick="alert(1)';
    assertRenderedContains(md, html);
  });

});
