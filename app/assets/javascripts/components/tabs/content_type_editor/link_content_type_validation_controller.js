'use strict';
angular.module('contentful').controller('LinkContentTypeValidationController', ['$scope', function LinkContentTypeController($scope){
  var controller = this;

  this.contentTypes     = {};
  this.updateValidation = updateValidation;

  $scope.$watch('validation.linkContentType', initializeList, true);

  function initializeList() {
    controller.contentTypes = _.transform($scope.spaceContext.publishedContentTypes, function(list, ct){
      list[ct.getId()] = isSelected(ct.getId());
    }, {});
  }

  function isSelected(contentTypeId) {
    return _.contains($scope.validation.linkContentType, contentTypeId);
  }

  function updateValidation() {
    $scope.validation.linkContentType = _.transform(controller.contentTypes, function (set, selected, ctid) {
      if (selected) set.push(ctid);
    }, []);
    $scope.updateDoc();
  }
}]);
