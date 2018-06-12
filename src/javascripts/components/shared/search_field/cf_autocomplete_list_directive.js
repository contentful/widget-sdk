'use strict';
angular.module('contentful').directive('cfAutocompleteList', ['require', require => {
  var h = require('utils/hyperscript').h;
  var $timeout = require('$timeout');
  var scrollIntoView = require('scroll-into-view');

  return {
    template: h('ul.search-autocomplete-list', [
      h('li', [
        h('span.header-value', ['Filter']),
        h('span.header-description', ['Description'])
      ]),
      h('li.autocompletion-row', {
        ngRepeat: '(index, item) in autocompletion.items',
        ngClass: '{selected: item.value === selectedAutocompletion.value}',
        ngClick: 'selectAutocompletion(item, $event)'
      }, [
        h('span.item-value', [
          h('span.value-pill', ['{{item.value}}'])
        ]),
        h('span.item-description', ['{{item.description}}'])
      ])
    ]),
    restrict: 'A',
    scope: true,
    link: function (scope, el) {
      autoscroll();
      scope.$watch('selectedAutocompletion.value', autoscroll);

      function autoscroll () {
        // wait for the ".selected" class to be applied
        $timeout(() => {
          // scroll-into-view expects a single DOM element
          var selected = el.find('.selected').first().get(0);
          if (selected) {
            scrollIntoView(selected);
          }
        });
      }
    },
    controller: ['$scope', $scope => {
      $scope.$on('selectNextAutocompletion', () => {
        selectNextAutocompletion();
        fill();
      });

      $scope.$on('selectPreviousAutocompletion', () => {
        selectPreviousAutocompletion();
        fill();
      });

      $scope.$on('cancelAutocompletion', () => {
        // TODO probably unnecessessary, because the directive should be destroyed
        $scope.selectedAutocompletion = null;
      });

      $scope.$on('submitAutocompletion', event => {
        if (!$scope.selectedAutocompletion) event.preventDefault();
        $scope.selectedAutocompletion = null;
      });

      $scope.$watch('autocompletion.items', (items, old) => {
        if (items === old) {
          selectInitialAutocompletion();
          fill();
        } else {
          selectInitialAutocompletion();
        }
      });

      $scope.selectAutocompletion = (autocompletion, $event) => {
        $scope.selectedAutocompletion = autocompletion;
        fill();
        $scope.confirmAutocompletion();
        $event.preventDefault();
      };

      function selectInitialAutocompletion () {
        var token = $scope.currentTokenContent();
        $scope.selectedAutocompletion = _.find($scope.autocompletion.items, i => i.value.toString() === token);
      }

      function selectNextAutocompletion () {
        var index = getSelectedIndex();
        $scope.selectedAutocompletion = $scope.autocompletion.items[index + 1] || $scope.autocompletion.items[0];
      }

      function selectPreviousAutocompletion () {
        var index = getSelectedIndex();
        $scope.selectedAutocompletion = $scope.autocompletion.items[index - 1] || $scope.autocompletion.items[$scope.autocompletion.items.length - 1];
      }

      function getSelectedIndex () {
        return _.findIndex($scope.autocompletion.items, i => i.value === ($scope.selectedAutocompletion && $scope.selectedAutocompletion.value));
      }

      function fill () {
        if ($scope.selectedAutocompletion) {
          $scope.fillAutocompletion($scope.selectedAutocompletion.value);
        }
      }
    }]
  };
}]);
