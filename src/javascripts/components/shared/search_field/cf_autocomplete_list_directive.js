'use strict';
angular.module('contentful').directive('cfAutocompleteList', ['require', function (require) {
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
      scope.$watch('selectedAutocompletion.value', function () {
        // wait for the ".selected" class to be applied
        $timeout(function () {
          // scroll-into-view expects a single DOM element
          var selected = el.find('.selected').first().get(0);
          if (selected) {
            scrollIntoView(selected);
          }
        });
      });
    },
    controller: ['$scope', function ($scope) {
      $scope.$on('selectNextAutocompletion', function () {
        selectNextAutocompletion();
        fill();
      });

      $scope.$on('selectPreviousAutocompletion', function () {
        selectPreviousAutocompletion();
        fill();
      });

      $scope.$on('cancelAutocompletion', function () {
        // TODO probably unnecessessary, because the directive should be destroyed
        $scope.selectedAutocompletion = null;
      });

      $scope.$on('submitAutocompletion', function (event) {
        if (!$scope.selectedAutocompletion) event.preventDefault();
        $scope.selectedAutocompletion = null;
      });

      $scope.$watch('autocompletion.items', function (items, old) {
        if (items === old) {
          selectInitialAutocompletion();
          fill();
        } else {
          selectInitialAutocompletion();
        }
      });

      $scope.selectAutocompletion = function (autocompletion, $event) {
        $scope.selectedAutocompletion = autocompletion;
        fill();
        $scope.confirmAutocompletion();
        $event.preventDefault();
      };

      function selectInitialAutocompletion () {
        var token = $scope.currentTokenContent();
        $scope.selectedAutocompletion = _.find($scope.autocompletion.items, function (i) {
          return i.value.toString() === token;
        });
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
        return _.findIndex($scope.autocompletion.items, function (i) {
          return i.value === ($scope.selectedAutocompletion && $scope.selectedAutocompletion.value);
        });
      }

      function fill () {
        if ($scope.selectedAutocompletion) {
          $scope.fillAutocompletion($scope.selectedAutocompletion.value);
        }
      }
    }]
  };
}]);
