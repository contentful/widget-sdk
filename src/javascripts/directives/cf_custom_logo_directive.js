'use strict';
angular.module('contentful').directive('cfCustomLogo', function(){
  return {
    restrict: 'A',
    link: function(scope, elem){
      var themeExpression = 'spaceContext.space.data.organization.subscriptionPlan.limits.features.customTheme && spaceContext.space.data.theme';
      scope.$watch(themeExpression, function (theme) {
        var logo = (theme && theme.logoUrl) ? 'url("'+theme.logoUrl+'")' : undefined;
        if(logo) {
          elem.css({
            'background-image': logo,
            'background-size': '123px 29px',
            width: '123px',
            height: '29px'
          });
        } else {
          elem.attr('style', '');
        }
      });
    }
  };
});
