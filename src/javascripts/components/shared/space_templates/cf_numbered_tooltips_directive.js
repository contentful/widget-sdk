'use strict';

angular.module('contentful').directive('cfNumberedTooltips', ['$timeout', function($timeout) {
  return {
    restrict: 'A',
    link: function(scope) {

      var sourceElements = [];

      createNumberedTooltip({
        selector: '.nav-bar [data-view-type="content-type-list"] span',
        title: '1',
        position: 'bottom'
      });
      createNumberedTooltip({
        selector: '.view-folders .filter-list-header:eq(0) .inline-editor-label',
        title: '2',
        position: 'right'
      });
      createNumberedTooltip({
        selector: '.entry-list .main-results-wrapper .main-results tbody tr:eq(0) .cell-content-type span',
        title: '3',
        position: 'right'
      });
      createNumberedTooltip({
        selector: '.view-customizer [cf-dropdown-toggle]',
        title: '4',
        position: 'top'
      });

      scope.$on('$destroy', removeTooltips);

      function createNumberedTooltip(params) {
        var el = $(params.selector);
        if(el.length === 0){
          $timeout(function () {
            createTooltip(el, params.title, params.position);
          }, 1000);
        } else {
          createTooltip(el, params.title, params.position);
        }

        function createTooltip(el, title, placement) {
          var originalTitle = el.attr('title');
          if(originalTitle)
            el.attr('data-existing-title', originalTitle);
          el.attr('title', title);

          el.tooltip({
            title: title,
            placement: placement,
            template: '<div class="tooltip numbered-tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
            trigger: 'manual',
            container: 'body'
          });
          el.tooltip('show');
          sourceElements.push(el);
        }
      }

      function removeTooltips() {
        $('.numbered-tooltip').remove();
        _.each(sourceElements, function (el) {
          var originalTitle = el.attr('data-existing-title');
          if(originalTitle) el.attr('title', originalTitle);
        });
        sourceElements = null;
      }
    }
  };
}]);

