import { registerDirective } from 'NgRegistry.es6';
import $ from 'jquery';
import window from 'utils/ngCompat/window.es6';

export default function register() {
  registerDirective('uiHighlightMatch', [
    () => {
      const documentElem = $(window.document).get(0);
      return {
        restrict: 'A',
        scope: {
          baseString: '=uiHighlightMatch',
          search: '=search'
        },
        link: function($scope, $el) {
          $scope.$watchGroup(['baseString', 'search'], values => {
            const base = values[0] || '';
            const search = values[1] || '';
            const start = base.toLowerCase().indexOf(search.toLowerCase());
            if (start > -1) {
              const end = start + search.length;
              const prefix = base.substring(0, start);
              const match = base.substring(start, end);
              const suffix = base.substring(end);

              const strong = documentElem.createElement('strong');
              strong.textContent = match;

              $el
                .empty()
                .append([
                  documentElem.createTextNode(prefix),
                  strong,
                  documentElem.createTextNode(suffix)
                ]);
            } else {
              $el.text(base);
            }
          });
        }
      };
    }
  ]);
}
