'use strict';

angular.module('contentful').directive('cfTokenizedSearch', ['require', function (require) {
  var $timeout = require('$timeout');
  var h = require('utils/hyperscript').h;

  return {
    template: h('div', {
      style: {
        position: 'relative',
        display: 'flex',
        background: '#fff',
        border: '1px solid red'
      }
    }, [
      h('input', {
        style: {
          flexGrow: '1',
          border: '0'
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
      h('button', {
        ngClick: 'updateFromButton()',
        tabindex: '0'
      }, [
        h('i.fa.fa-search.fa-flip-horizontal')
      ]),
      h('div', {
        ngIf: 'showAutocompletions',
        style: {
          zIndex: '300',
          position: 'absolute',
          left: '0',
          right: '0',
          fontSize: '14px',
          background: '#fff',
          border: '1px solid green'
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
            background: 'pink',
            borderTop: '1px solid green',
            padding: '15px 20px'
          }
        }, [
          h('cf-icon', {name: 'fd-info-text'}),
          h('p', {
            style: {
              margin: '0',
              marginLeft: '7px'
            }
          }, [
            'Get more out of search. Here\'s&#32;',
            h('a', {
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
    }
  };
}]);
