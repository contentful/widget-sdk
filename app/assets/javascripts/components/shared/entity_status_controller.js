'use strict';

angular.module('contentful').controller('EntityStatusController', ['$scope', function EntityStatusController($scope) {

  var PREFIX = 'entity-status--';

  this.getClassname = function(entity){
    if (entity.isMissing) return '';
    if (entity.isPublished()) {
      if (entity.hasUnpublishedChanges()) {
        return PREFIX+'updated';
      } else {
        return PREFIX+'published';
      }
    } else if (entity.isArchived()) {
      return PREFIX+'archived';
    } else {
      return PREFIX+'draft';
    }
  };

  this.getLabel = function(entity){
    if (entity.isMissing) return '';
    if (entity.isPublished()) {
      if (entity.hasUnpublishedChanges()) {
        return 'updated';
      } else {
        return 'published';
      }
    } else if (entity.isArchived()) {
      return 'archived';
    } else {
      return 'draft';
    }
  };


}]);
