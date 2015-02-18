'use strict';

angular.module('contentful').directive('cfEmbedlyPreview', ['$injector', function ($injector) {
  var embedlyLoader = $injector.get('embedlyLoader'),
      debounce      = $injector.get('debounce'),
      urlUtils      = $injector.get('urlUtils');

  return {
    restrict: 'E',
    link    : function link(scope, element) {
      embedlyLoader.load().then(function (embedly) {
        var debouncedRequestPreview = debounce(requestPreview, 500);

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

        embedly('on', 'card.rendered', function (iframe) {
          /**
           * This means that the iframe got a 404 or for
           * some other reason did not load. In which case,
           * inform that it is a broken URL.
           */
          if (iframe.contentWindow === null) {
            scope.state = 'broken';
          } else {
            delete scope.state;
          }
          scope.$digest();
        });

        scope.$watch('fieldData.value', function (value) {
          delete scope.state;
          element.empty();
          if (urlUtils.isValid(value)) {
            scope.state = 'loading';
            debouncedRequestPreview(value);
          }
        });
      });
    }
  };
}]);
