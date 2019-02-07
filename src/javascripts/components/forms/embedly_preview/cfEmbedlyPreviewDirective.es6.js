import { registerDirective } from 'NgRegistry.es6';
import $ from 'jquery';
import { isValidUrl } from 'utils/StringUtils.es6';
import * as LazyLoader from 'utils/LazyLoader.es6';

export default function register() {
  registerDirective('cfEmbedlyPreview', [
    '$timeout',
    'debounce',
    ($timeout, debounce) => ({
      restrict: 'E',
      scope: {
        previewUrl: '=',
        urlStatus: '='
      },
      link: function(scope, element) {
        const TIMEOUT = 7500;

        LazyLoader.get('embedly').then(embedly => {
          setup(embedly);
          scope.$applyAsync();
        });

        function setup(embedly) {
          const debouncedRequestPreview = debounce(requestPreview, 500);
          let loadCheck = null;

          scope.$watch('previewUrl', handleValueChange);
          embedly('on', 'card.rendered', markAsLoaded);

          function requestPreview(url) {
            const previewElement = $('<a/>', {
              href: encodeURI(decodeURI(url)),
              'data-card-controls': 0,
              'data-card-chrome': 0,
              'data-card-align': 'left'
            });
            element.append(previewElement);
            embedly('card', previewElement.get(0));

            cancelCheck();
            loadCheck = $timeout(() => {
              changeStatus('broken');
            }, TIMEOUT);
          }

          function markAsLoaded() {
            cancelCheck();
            scope.$apply(() => {
              changeStatus('ok');
            });
          }

          function handleValueChange(value) {
            element.empty();
            if (!value) {
              cancelCheck();
              changeStatus('ok');
            } else if (isValidUrl(value)) {
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

          function cancelCheck() {
            if (loadCheck) {
              $timeout.cancel(loadCheck);
              loadCheck = null;
            }
          }
        }
      }
    })
  ]);
}
