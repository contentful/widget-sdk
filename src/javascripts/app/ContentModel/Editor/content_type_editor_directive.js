'use strict';

angular.module('contentful')
.directive('cfContentTypeEditor', ['require', require => {
  var $timeout = require('$timeout');
  var template = require('app/ContentModel/Editor/Template').default;
  var renderString = require('ui/Framework').renderString;

  return {
    template: renderString(template),
    restrict: 'A',
    controller: 'ContentTypeEditorController',
    controllerAs: 'ctEditorController',
    link: function (scope, element) {
      scope.$on('fieldAdded', scroll);

      function scroll () {
        var fieldList = element.find('[ng-model="contentType.data.fields"]');

        // This method only works on jQuery objects containing
        // one element: https://api.jqueryui.com/scrollParent/
        if (fieldList.length !== 1) {
          return;
        }

        // We need a timeout here for a newly added field
        // to be rendered; otherwise we get the old height
        $timeout(() => {
          var height = fieldList.height();
          fieldList.scrollParent().scrollTop(height);
        });
      }
    }
  };
}]);
