'use strict';

angular.module('contentful').directive('cfEmbedlyPreview', ['$injector', function ($injector) {
  var LazyLoader = $injector.get('LazyLoader');
  var debounce   = $injector.get('debounce');
  var urlUtils   = $injector.get('urlUtils');

  return {
    restrict: 'E',
    scope: { fieldData: '=' },
    link: function (scope, element) {

      LazyLoader.get('embedly').then(setup);

      function setup(embedly) {
        var debouncedRequestPreview = debounce(requestPreview, 500);

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
      }
    }
  };
}]);
