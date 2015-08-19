'use strict';

angular.module('contentful').directive('cfEmbedlyPreview', ['$injector', function ($injector) {
  var $timeout   = $injector.get('$timeout');
  var LazyLoader = $injector.get('LazyLoader');
  var debounce   = $injector.get('debounce');
  var urlUtils   = $injector.get('urlUtils');

  return {
    restrict: 'E',
    scope: {
      fieldData: '=',
      urlStatus: '='
    },
    link: function (scope, element) {

      var TIMEOUT = 7500;

      LazyLoader.get('embedly').then(setup);

      function setup(embedly) {
        var debouncedRequestPreview = debounce(requestPreview, 500);
        var loadCheck = null;

        scope.$watch('fieldData.value', handleValueChange);
        embedly('on', 'card.rendered', markAsLoaded);

        function requestPreview(url) {
          var previewElement = $('<a/>', { href: url, 'data-card-controls': 0 });
          element.append(previewElement);
          embedly('card', previewElement.get(0));

          $timeout.cancel(loadCheck);
          loadCheck = $timeout(function () { changeStatus('broken'); }, TIMEOUT);
        }

        function markAsLoaded() {
          $timeout.cancel(loadCheck);
          scope.$apply(function() {
            changeStatus('ok');
          });
        }

        function handleValueChange(value) {
          element.empty();
          if (urlUtils.isValid(value)) {
            changeStatus('loading');
            debouncedRequestPreview(value);
          } else {
            changeStatus('invalid');
          }
        }

        function changeStatus(status) {
          scope.urlStatus = status;
          scope.$emit('centerOn:reposition');
        }
      }

    }
  };
}]);
