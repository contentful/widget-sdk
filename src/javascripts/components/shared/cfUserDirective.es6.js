import { registerDirective } from 'NgRegistry.es6';

registerDirective('cfUser', () => ({
  restrict: 'A',

  controller: [
    '$scope',
    '$attrs',
    'spaceContext',
    ($scope, $attrs, spaceContext) => {
      $scope.$watch(
        $attrs.link,
        link => {
          if (!link || !$attrs.as) return;
          spaceContext.users.get(link.sys.id).then(user => {
            if (user) {
              $scope[$attrs.as] = user;
            }
          });
        },
        true
      );
    }
  ]
}));
