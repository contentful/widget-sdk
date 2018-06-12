'use strict';

angular.module('contentful').directive('cfSearch', ['require', require => {
  var keycodes = require('utils/keycodes').default;
  var debounce = require('debounce');
  var $timeout = require('$timeout');
  var h = require('utils/hyperscript').h;
  var Colors = require('Styles/Colors').byName;
  var renderString = require('ui/Framework').renderString;
  var searchIcon = renderString(require('svg/search').default);

  return {
    template: h('div', {
      style: {
        display: 'flex',
        backgroundColor: 'white',
        border: '1px solid ' + Colors.blueMid,
        borderRadius: '2px'
      }
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
        placeholder: '{{placeholder}}',
        dataTestId: 'search-input'
      }),
      h('cf-inline-loader', {isShown: 'isSearching'}),
      h('button', {
        style: {padding: '0 10px'},
        ngClick: 'updateFromButton()',
        tabindex: '0',
        dataTestId: 'search-button'
      }, [searchIcon])
    ]),
    restrict: 'A',
    scope: {
      placeholder: '@',
      search: '=cfSearch',
      tooltip: '@',
      isSearching: '='
    },
    link: function (scope, element) {
      var debouncedUpdate = debounce(update, 300);

      $timeout(() => {
        element.find('input').first().focus();
      });

      element.on('keyup', ev => {
        var pressedReturn = ev.keyCode === keycodes.ENTER;

        if (pressedReturn) {
          if (!scope.inner.term) {
            scope.inner.term = '';
          }
          ev.preventDefault();
          ev.stopPropagation();
          update();
        } else if (scope.inner.term) {
          return debouncedUpdate();
        }
      });

      function update () {
        scope.$apply(scope => {
          scope.update({
            trigger: 'keyboard'
          });
        });
      }
    },

    controller: ['$scope', function cfSearchController ($scope) {
      $scope.inner = {
        term: ''
      };

      $scope.updateFromButton = () => {
        if (!$scope.inner.term) {
          $scope.inner.term = '';
        }
        $scope.update({
          trigger: 'button'
        });
      };

      $scope.update = update;

      $scope.$watch('search', search => {
        $scope.inner.term = search;
      });

      $scope.$watch('inner.term', term => {
        if (term === '') {
          $scope.update({ trigger: 'cleared' });
        }
      });

      function update (params) {
        if ($scope.inner.term !== $scope.search) {
          $scope.search = $scope.inner.term;
        } else {
          $scope.$emit('refreshSearch', params);
        }
      }
    }]
  };
}]);
