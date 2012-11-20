require([
  'angular',
  'directives'
], function(angular, directives){
  directives.directive('bindTemplate', function($compile){
    return function(scope, element, attrs) {
      scope.$watch(
        function(scope) {
          return scope.$eval(attrs.bindTemplate);
        },
        function(value) {
          element.html(value);
          $compile(element.contents())(scope);
        }
      );
    };

  })
})
