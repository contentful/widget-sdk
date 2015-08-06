'use strict';

angular.module('contentful').factory('MarkdownEditor/createMarkdownRenderer', [function () {

  return function createRenderer(marked) {
    var Renderer = marked.Renderer;
    var renderer = new Renderer();

    renderer._image = renderer.image;
    renderer.image  = renderImage;
    renderer.link   = renderLink;

    return function (source) {
      return marked(source, {
        // use renderer with altered methods for links and images
        renderer: renderer,
        // turn on Github-flavored MD goodies
        gfm: true,
        tables: true,
        breaks: true,
        // we use ng-bind-html that automatically $sanitizes source scope property
        sanitize: false
      });
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
  };
}]);
