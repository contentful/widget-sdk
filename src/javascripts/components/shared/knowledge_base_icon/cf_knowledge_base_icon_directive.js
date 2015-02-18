'use strict';

angular.module('contentful').directive('cfKnowledgeBaseIcon', ['analytics', function (analytics) {
  return {
    restrict: 'A',
    template: JST.cf_knowledge_base_icon(),
    priority: 100,
    replace: true,
    link: function (scope, elem, attrs) {
      if(!scope.placement) scope.placement = attrs.tooltipPlacement || 'right';
      if(!attrs.tooltipContainer) scope.container = '[cf-knowledge-base-icon]';
      elem.on('click', function () {
        analytics.knowledgeBase(attrs.analyticsEvent);
      });
    }
  };
}]);
