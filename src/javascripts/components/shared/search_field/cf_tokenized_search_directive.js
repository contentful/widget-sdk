'use strict';

angular.module('contentful').directive('cfTokenizedSearch', ['require', function (require) {
  var $timeout = require('$timeout');
  var h = require('utils/hyperscript').h;
  var Colors = require('Styles/Colors').byName;
  var renderString = require('ui/Framework').renderString;
  var infoIcon = renderString(require('svg/info').default);
  var filterIcon = renderString(require('svg/filter').default);

  var metallicGray = '#969FA6';
  var color = 'hasFocus ? "' + Colors.blueMid + '" : "' + metallicGray + '"';
  var border = '"1px solid " + (' + color + ')';

  var iconStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '0 15px',
    fill: 'currentColor'
  };

  return {
    template: h('div', {
      style: {
        position: 'relative',
        display: 'flex',
        backgroundColor: 'white',
        borderRadius: '2px'
      },
      ngStyle: '{border: ' + border + '}'
    }, [
      h('input.cfnext-form__input', {
        type: 'text',
        style: {
          flexGrow: '1',
          border: '0',
          height: '40px',
          padding: '0 10px'
        },
        ngModel: 'inner.term',
        ngTrim: 'false',
        placeholder: '{{placeholder}}',
        ngChange: 'inputChanged()',
        ngKeydown: 'keyPressed($event)',
        ngKeyup: 'keyReleased($event)',
        ngFocus: 'inputFocused($event)',
        ngBlur: 'inputBlurred($event)',
        dataTestId: 'search-input'
      }),
      h('cf-inline-loader', {
        style: {height: '40px'},
        isShown: 'context.isSearching'
      }),
      h('button', {
        ngIf: 'autocompletion.type',
        style: iconStyle,
        ngClick: 'toggleFilters()',
        ngStyle: '{color: ' + color + '}',
        tabindex: '1',
        dataTestId: 'search-filter-button'
      }, [
        h('div', {style: {marginTop: '-3px'}}, [filterIcon]),
        h('div', {style: {marginLeft: '7px'}}, ['Filter'])
      ]),
      h('div', {
        ngIf: 'showAutocompletions && autocompletion.type',
        style: {
          zIndex: '300',
          position: 'absolute',
          top: '40px',
          left: '-1px',
          right: '-1px',
          fontSize: '14px',
          backgroundColor: 'white',
          border: '1px solid ' + Colors.blueMid
        }
      }, [
        h('div', {
          style: {
            maxHeight: '50vh',
            overflowX: 'hidden',
            overflowY: 'auto'
          },
          cfAutocompleteList: true,
          ngIf: 'autocompletion.type === "List"'
        }),
        h('div', {
          cfAutocompleteDate: true,
          ngIf: 'autocompletion.type === "Date"'
        }),
        h('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            background: Colors.iceMid,
            borderTop: '1px solid ' + Colors.elementLight,
            height: '56px',
            padding: '15px 20px'
          }
        }, [
          infoIcon,
          h('p', {
            style: {
              color: Colors.textLight,
              margin: '0',
              marginLeft: '10px'
            }
          }, [
            'Get more out of search. Here\'s&#32;',
            h('a', {
              style: {textDecoration: 'underline'},
              href: 'https://www.contentful.com/r/knowledgebase/content-search/',
              target: '_blank'
            }, ['how search works']),
            '.'
          ])
        ])
      ])
    ]),
    restrict: 'A',
    scope: true,
    controller: 'cfTokenizedSearchController',
    controllerAs: 'tokenizedSearchController',
    link: function (scope, element) {
      var input = element.find('input');

      $timeout(focus);

      scope.toggleFilters = function () {
        scope.showAutocompletions = !scope.showAutocompletions;
        focus();
      };

      scope.searchButtonClicked = function () {
        scope.showAutocompletions = false;
        scope.updateFromButton();
        focus();
      };

      // Make position query available on the scope so it can be called from the controller
      scope.getPosition = function () {
        return scope.hasFocus && input.textrange('get').start;
      };

      // Make range selection available on the scope so it can be called from the controller
      scope.selectRange = function (offset, length) {
        return $timeout(function () {
          input.textrange('set', offset, length);
        }, null, false);
      };

      scope.$on('$destroy', function () {
        scope = null; // MEMLEAK FIX
      });

      function focus () {
        input.first().focus();
      }
    }
  };
}]);
