'use strict';

angular.module('contentful').factory('MarkdownEditor/customRenderer', ['$injector', function ($injector) {

  var marked   = $injector.get('marked');
  var Renderer = marked.Renderer;
  var renderer = new Renderer();

  renderer._image = renderer.image;
  renderer.image  = renderImage;
  renderer.link   = renderLink;

  return function (source) {
    return marked(source, { renderer: renderer });
  };

  function renderImage(href, title, text) {
    var hrefResized = '' + href + '?h=200';
    var markup = renderer._image(hrefResized, title, text);
    return '<div class="markdown-image-placeholder">' + markup + '</div>';
  }

  function renderLink (href, title, text) {
    var link = '<a href="' + href + '" target="_blank"';
    if (title) { link += ' title="' + title + '"'; }
    link += '>' + text + '</a>';
    return link;
  }
}]);
