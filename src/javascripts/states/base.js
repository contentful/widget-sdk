'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/base
 * @description
 * Exposes a function that builds a state with loading views.
 */
.factory('states/base', [function () {
  return function base(definition) {
    if (!definition.loadingText) {
      var label = dotty.get(definition, 'ncyBreadcrumb.label');
      definition.loadingText = label ? ('Loading your ' + label + '...') : 'Loading...';
    }

    definition.template = [
      '<div ng-show="context.ready && !context.forbidden">',
        definition.template,
      '</div>',
      '<div ng-show="!context.ready && !context.forbidden" class="workbench workbench-loading x--center">',
        '<div class="workbench-loading__spinner"></div>',
        '<div class="workbench-loading__message">',
          definition.loadingText,
        '</div>',
      '</div>',
      '<div ng-show="context.forbidden" class="workbench workbench-forbidden x--center">',
        '<div class="workbench-forbidden__headline">You don\'t have permission to access this view.</div>',
        '<div class="workbench-forbidden__message">Get in touch with the person administering Contentful at your company to learn more.</div>',
      '</div>'
    ].join('');

    return definition;
  };
}]);

