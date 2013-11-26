angular.module('contentful').directive('cfKnowledgeBaseIcon', function (analytics) {
  'use strict';

  return {
    restrict: 'C',
    template: JST.cf_knowledge_base_icon(),
    priority: 100,
    replace: true,
    link: function (scope, elem, attrs) {
      scope.placement = attrs.tooltipPlacement || 'right';
      elem.on('click', function () {
        analytics.knowledgeBase(attrs.analyticsEvent);
      });
    }
  };
});
