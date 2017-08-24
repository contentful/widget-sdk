'use strict';

angular.module('contentful').directive('cfTokenizedSearch', ['require', function (require) {
  var $timeout = require('$timeout');
  var h = require('utils/hyperscript').h;
  var Colors = require('Styles/Colors').byName;
  var renderString = require('ui/Framework').renderString;
  var serachIcon = renderString(require('svg/search').default);
  var infoIcon = renderString(require('svg/info').default);
  var filtersIcon = renderString(require('svg/filters').default);

  return {
    template: h('div', {
      style: {
        position: 'relative',
        display: 'flex',
        backgroundColor: 'white',
        border: '1px solid ' + Colors.blueMid
      }
    }, [
      h('input.cfnext-form__input', {
        type: 'text',
        style: {
          flexGrow: '1',
          border: '0',
          height: '31px'
        },
        ngModel: 'inner.term',
        ngTrim: 'false',
        placeholder: '{{placeholder}}',
        ngChange: 'inputChanged()',
        ngKeydown: 'keyPressed($event)',
        ngKeyup: 'keyReleased($event)',
        ngFocus: 'inputFocused($event)',
        ngBlur: 'inputBlurred($event)'
      }),
      h('cf-inline-loader', {isShown: 'context.isSearching'}),
      h('button', {
        style: {
          display: 'flex',
          alignItems: 'center',
          padding: '0 15px'
        },
        ngClick: 'searchButtonClicked()',
        tabindex: '0'
      }, [serachIcon]),
      h('button', {
        ngIf: 'autocompletion.type',
        style: {
          display: 'flex',
          alignItems: 'center',
          padding: '0 15px',
          color: Colors.blueMid,
          borderLeft: '1px solid ' + Colors.blueMid
        },
        ngClick: 'toggleFilters()',
        tabindex: '1'
      }, [
        filtersIcon,
        h('span', {style: {marginLeft: '7px'}}, ['Filters'])
      ]),
      h('div', {
        ngIf: 'showAutocompletions && autocompletion.type',
        style: {
          zIndex: '300',
          position: 'absolute',
          top: '31px',
          left: '-1px',
          right: '-1px',
          fontSize: '14px',
          backgroundColor: 'white',
          border: '1px solid ' + Colors.blueMid
        }
      }, [
        h('div', {
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
            borderTop: '1px solid ' + Colors.iceDark,
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
