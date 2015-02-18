'use strict';
angular.module('contentful').directive('cfMarkdownGuide', function(){
  return {
    restrict: 'A',
    template: JST['cf_markdown_guide'](),
    link: function(scope, elem){
      var $main = elem.find('.markdown-guide-main');
      var $nav= elem.find('.markdown-guide-nav');

      function onScroll() {
        var scrollTop = $main.scrollTop();
        var headlines = $main.find('*[data-anchor]').toArray();
        var current = _.first(_.last(headlines, function(headline){
          return $(headline).prop('offsetTop') >= scrollTop;
        })) || headlines[headlines.length-1];
        var anchor = $(current).attr('data-anchor');
        var selector = 'li[data-anchor='+anchor+']';
        $nav.find('li').removeClass('active');
        var link = $nav.find(selector);
        link.addClass('active');
      }

      $main.on('scroll', onScroll);
      $nav.on('click', 'li', function () {
        var id = $(this).attr('data-anchor');
        var $headline = $main.find('*[data-anchor='+id+']');
        $main.scrollTop($headline.prop('offsetTop')-10);
      });

      onScroll();

      scope.guideOpen = false;
      scope.toggleGuide = function () {
        scope.guideOpen = !scope.guideOpen;
        if (scope.guideOpen) {
          elem.addClass('open');
        } else {
          elem.removeClass('open');
        }
      };
    }
  };
});
