'use strict';

angular.module('contentful').directive('cfEmbedlyPreview', ['$injector', function ($injector) {
  var $timeout = $injector.get('$timeout');
  var debounce = $injector.get('debounce');
  var urlUtils = $injector.get('urlUtils');
  var LazyLoader = $injector.get('LazyLoader');

  return {
    restrict: 'E',
    scope: {
      previewUrl: '=',
      urlStatus: '='
    },
    link: function (scope, element) {
      var TIMEOUT = 7500;

      LazyLoader.get('embedly').then(setup);

      function setup (embedly) {
        var debouncedRequestPreview = debounce(requestPreview, 500);
        var loadCheck = null;

        scope.$watch('previewUrl', handleValueChange);
        embedly('on', 'card.rendered', markAsLoaded);

        function requestPreview (url) {
          var previewElement = $('<a/>', {
            href: encodeURI(decodeURI(url)),
            'data-card-controls': 0,
            'data-card-chrome': 0,
            'data-card-align': 'left'
          });
          element.append(previewElement);
          embedly('card', previewElement.get(0));

          cancelCheck();
          loadCheck = $timeout(function () { changeStatus('broken'); }, TIMEOUT);
        }

        function markAsLoaded () {
          cancelCheck();
          scope.$apply(function () {
            changeStatus('ok');
          });
        }

        function handleValueChange (value) {
          element.empty();
          if (!value) {
            cancelCheck();
            changeStatus('ok');
          } else if (urlUtils.isValid(value)) {
            changeStatus('loading');
            debouncedRequestPreview(value);
          } else {
            changeStatus('invalid');
          }
        }

        function changeStatus (status) {
          scope.urlStatus = status;
          scope.$emit('centerOn:reposition');
        }

        function cancelCheck () {
          if (loadCheck) {
            $timeout.cancel(loadCheck);
            loadCheck = null;
          }
        }
      }
    }
  };
}]);
