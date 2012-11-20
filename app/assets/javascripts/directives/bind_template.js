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
          var oldScope, newScope;
          if (oldScope = element.data('$scope')) oldScope.$destroy();
          element.data('$scope', newScope = scope.$new());

          if (typeof value == 'function') {
            value = value();
          }
          element.html(value);
          $compile(element.contents())(newScope);
        }
      );
    };

  })
})
