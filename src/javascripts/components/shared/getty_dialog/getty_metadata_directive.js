'use strict';

angular.module('contentful').directive('gettyMetadata', function(){
  return {
    template: JST.getty_metadata(),
    restrict: 'A',
    scope: {
      image: '=image',
      full: '=full'
    },
    controller: ['$scope', function ($scope) {
      $scope.productOfferings = function (key) {
        return {
          EasyAccess: 'Easy Access'
        }[key];
      };

      $scope.licensingModel = function (key) {
        return {
          RoyaltyFree: 'Royalty Free',
          RightsManaged: 'Rights Managed'
        }[key];
      };

      $scope.parseDate = function (dateSrc) {
        var extractedDate = /Date\((\d+)-\d+\)/g.exec(dateSrc);
        if(extractedDate && extractedDate.length > 0){
          return moment(parseInt(extractedDate[1], 10)).format('DD MMMM YYYY');
        }
        return '';
      };
    }],

    link: function (scope, elem, attrs) {
      if(!_.isUndefined(attrs.full)){
        scope.fullMetadata = true;
      }
    }
  };
});
