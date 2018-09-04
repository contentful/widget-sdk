'use strict';

angular.module('contentful').directive('cfContentTypeEditor', [
  'require',
  require => {
    const $timeout = require('$timeout');
    const template = require('app/ContentModel/Editor/Template.es6').default;
    const renderString = require('ui/Framework').renderString;

    return {
      template: renderString(template),
      restrict: 'A',
      controller: 'ContentTypeEditorController',
      controllerAs: 'ctEditorController',
      link: function(scope, element) {
        scope.$on('fieldAdded', scroll);

        function scroll() {
          const fieldList = element.find('[ng-model="contentType.data.fields"]');

          // This method only works on jQuery objects containing
          // one element: https://api.jqueryui.com/scrollParent/
          if (fieldList.length !== 1) {
            return;
          }

          // We need a timeout here for a newly added field
          // to be rendered; otherwise we get the old height
          $timeout(() => {
            const height = fieldList.height();
            fieldList.scrollParent().scrollTop(height);
          });
        }
      }
    };
  }
]);
