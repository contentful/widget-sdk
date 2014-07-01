'use strict';

angular.module('contentful').directive('cfDialog', ['modalDialog', function (modalDialog) {
  return {
    restrict: 'CA',
    link: function (scope, elem, attrs) {
      elem.on('click', function () {
        var options = {
          scope: scope
        };

        var dialogAttrs = _.pick(attrs, function (val, key) {
          return (/^dialog/g.test(key));
        });

        _.forEach(dialogAttrs, function (val, key) {
          var strippedKey = key.replace('dialog', '');
          strippedKey = strippedKey[0].toLowerCase() + strippedKey.substr(1);
          options[strippedKey] = val;
        });

        scope.dialog = modalDialog.open(options);
      });

      scope.$on('$destroy', modalDialog.close);
    }
  };
}]);
