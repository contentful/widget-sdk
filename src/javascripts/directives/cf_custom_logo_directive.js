'use strict';
angular.module('contentful').directive('cfCustomLogo', function(){
  return {
    link: function(scope, elem){
      var themeExpression = 'spaceContext.space.data.organization.subscriptionPlan.limits.features.customTheme && spaceContext.space.data.theme';
      scope.$watch(themeExpression, function (theme) {
        var logo = _.isEmpty(theme && theme.logoUrl) ? '' : 'url("'+theme.logoUrl+'")';
        elem.css({'background-image': logo});
      });
    }
  };
});
