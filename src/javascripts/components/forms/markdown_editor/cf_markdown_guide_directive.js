'use strict';

angular.module('contentful').directive('cfMarkdownGuide', function (){
  return {
    restrict: 'A',
    template: JST['cf_markdown_guide'](),
    scope: {},
    link: function (scope, elem) {
      var $main = elem.find('.markdown-guide-main');
      var $nav = elem.find('.markdown-guide-nav');

      onScroll();
      $main.on('scroll', onScroll);
      $nav.on('click', 'li', onClick);

      function onScroll() {
        $nav.find('li').removeClass('active');
        $nav.find(getCurrentItemSelector()).addClass('active');
      }

      function getCurrentItemSelector() {
        var anchor = $(findCurrentItem()).attr('data-anchor');
        return 'li[data-anchor=' + anchor + ']';
      }

      function findCurrentItem() {
        var scrollTop = $main.scrollTop();
        var headlines = $main.find('*[data-anchor]').toArray();

        return _.first(_.last(headlines, function (headline) {
          return $(headline).prop('offsetTop') >= scrollTop;
        })) || headlines[headlines.length - 1];
      }

      function onClick(e) {
        var id = $(e.target).attr('data-anchor');
        var $headline = $main.find('*[data-anchor=' + id + ']');
        $main.scrollTop($headline.prop('offsetTop') - 20);
      }
    }
  };
});
