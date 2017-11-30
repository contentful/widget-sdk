angular.module('styleguide', [
  'contentful/environment',
  'cf.es6',
  'cf.ui',
  'cf.libs',
  'ui.sortable',
  'ngAnimate'
])

.directive('cfExampleDatepicker', ['$injector', function ($injector) {
  var Datepicker = $injector.get('datepicker');
  return {
    restrict: 'E',
    template: '',
    link: function ($scope, $el) {
      var datepicker = Datepicker.create();
      $el.append(datepicker.el);
      $scope.$on('$destroy', function () {
        datepicker.destroy();
      });
    }
  };
}])

.run(['require', function (require) {
  const $document = require('$document')
  require('ui/ContextMenuHandler').default($document);
}]);
