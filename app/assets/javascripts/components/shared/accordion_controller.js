'use strict';

angular.module('contentful').controller('AccordionController', ['$scope', function($scope) {

  var openAccordionItemID;

  $scope.toggleAccordionItem = function (item) {
    if (openAccordionItemID == item.id){
      openAccordionItemID = null;
    } else {
      openAccordionItemID = item.id;
    }
  };

  $scope.accordionItemClicked = function (item) {
    if (!$scope.isAccordionItemOpen(item)) $scope.openAccordionItem(item);
  };

  $scope.openAccordionItem = function (item) {
    openAccordionItemID = item.id;
  };

  $scope.closeAllAccordionItems = function () {
    openAccordionItemID = null;
  };

  $scope.isAccordionItemOpen = function (item) {
    return openAccordionItemID == item.id;
  };

}]);
