define([
  'controllers'
], function(controllers){
  'use strict';

  return controllers.controller('BucketCtrl', function($scope) {
    $scope.section = null;

    var currentTab = null;

    function updateCurrentTab(section) {
      var options = {
        activate: function(){
          $scope.section = section;
        }
      };
      if (!currentTab) {
        currentTab = $scope.tabList.add(section, options);
      } else {
        currentTab = currentTab.replace(section);
      }
      currentTab.activate();
    }

    $scope.$watch('bucket', function(bucket){
      if (bucket) {
        $scope.visitSection("content");
      }
    });

    $scope.visitSection = function(section) {
      $scope.section = section;
      updateCurrentTab(section);
    };

  });
});
