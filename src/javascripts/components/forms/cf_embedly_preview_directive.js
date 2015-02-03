'use strict';

angular.module('contentful').directive('cfEmbedlyPreview', ['$injector', function ($injector) {
  var embedlyLoader = $injector.get('embedlyLoader'),
      debounce      = $injector.get('debounce');

  return {
    restrict: 'E',
    link    : function link(scope, element) {
      embedlyLoader.load().then(function (embedly) {
        var debouncedRequestPreview = debounce(requestPreview, 500);

        /**
         * Regex used by AngularJS for <input type="url"/>
         * @see https://github.com/angular/angular.js/blob/v1.3.11/src/ng/directive/input.js#L14
         * @param {!string} value
         * @return {!boolean}
         */
        function isGoodURL(value) {
          var regex = /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/;
          return regex.test(value);
        }

        /*
         * @param {!string} url
         */
        function requestPreview(url) {
          var previewElement = $('<a/>', {
            'href'              : url,
            'data-card-controls': 0
          });
          element.append(previewElement);

          embedly('card', previewElement[0]);
        }

        scope.$watch('fieldData.value', function (value) {
          element.empty();
          if (isGoodURL(value)) {
            debouncedRequestPreview(value);
          }
        });
      });
    }
  };
}]);
