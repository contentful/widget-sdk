'use strict';

angular.module('contentful').controller('cfLinkEditorCtrl', function ($scope, $parse, $attrs, validation, cfSpinner, ShareJS, $q) {
  $scope.links = [];
  $scope.linkedEntities = [];

  var entityCache = {};

  var ngModelGet = $parse($attrs.ngModel),
      ngModelSet = ngModelGet.assign;

  var validations = $scope.field.type === 'Array' && $scope.field.items.validations ?
      $scope.field.items.validations :
      $scope.field.validations;

  $scope.$watch('linkType', function (linkType) {
    var validationType;
    if(linkType == 'Entry') validationType = 'linkContentType';
    if(linkType == 'Asset') validationType = 'linkMimetypeGroup';

    var linkTypeValidation = _(validations)
      .map(validation.Validation.parse)
      .where({name: validationType})
      .first();

    if(linkTypeValidation){
      if (linkType == 'Entry') {
        $scope.linkContentType = _.find($scope.spaceContext.publishedContentTypes, function(et) {
          return et.getId() == linkTypeValidation.contentTypeId;
        });
      } else if (linkType == 'Asset') {
        $scope.linkMimetypeGroup = linkTypeValidation.mimetypeGroupName;
      }
    }
  });

  $scope.addLink = function (entity) {
    // TODO this still looks like too much manual work
    // Should just be the ShareJS operation, then the model should update itself from that
    var link = { sys: {
      type: 'Link',
      linkType: $scope.linkType,
      id: entity.getId() }};
    saveEntityInCache(entity);

    var cb, promise;
    if ($scope.linkSingle) {
      cb = $q.callbackWithoutApply();
      $scope.otChangeValue(link, cb);
      promise = cb.promise.then(function () { $scope.links = [link]; });
    } else {
      cb = $q.callback();
      if (_.isArray(ShareJS.peek($scope.otDoc, $scope.otPath))) {
        $scope.otDoc.at($scope.otPath).push(link, cb);
        promise = cb.promise.then(function () { $scope.links.push(link); });
      } else {
        ShareJS.mkpath({
          doc: $scope.otDoc,
          path: $scope.otPath,
          types: $scope.otPathTypes,
          value: [link]
        }, cb);
        promise = cb.promise.then(function () { $scope.links = [link]; });
      }
    }
    return promise.then(function () {
      $scope.updateModel();
    });
  };

  $scope.removeLink = function(index, entity) {
    var cb;
    if ($scope.linkSingle) {
      cb = $q.callbackWithoutApply();
      $scope.otChangeValue(null, cb);
      return cb.promise.then(function () {
        $scope.links.length = 0;
        $scope.updateModel();
      });
    } else {
      assertIndexMatches(index, entity);
      cb = $q.callback();
      $scope.otDoc.at($scope.otPath.concat(index)).remove(cb);
      return cb.promise.then(function () {
        $scope.links.splice(index,1);
        $scope.updateModel();
      });
    }

    function assertIndexMatches(index, entity) {
      if (entity && !entity.isMissing && entity.getId() && entity.getId() != $scope.links[index].sys.id) throw new Error('Index mismatch!');
    }
  };

  function saveEntityInCache(entity) {
    // TODO no need to check for entityCache existence anymore after the Angular update
    if (entity && entityCache) entityCache[entity.getId()] = entity;
  }

  function entityFromCache(id) {
    // TODO no need to check for entityCache existence anymore after the Angular update
    return entityCache ? entityCache[id] : undefined;
  }

  function lookupEntities(scope, links) {
    var lookup = $q.defer();
    var ids        = _.map(links, function (link) { return link.sys.id; });
    var missingIds = _.reject(ids, function (id) { return !!entityFromCache(id); });
    if(missingIds.length > 0){
      // TODO use common entityCache (#70858522)
      var stopSpinner = cfSpinner.start();
      scope.spaceContext.space[scope.fetchMethod]({
        'sys.id[in]': missingIds.join(','),
        limit: 1000
      }, function (err, entities) {
        scope.$apply(function () {
          stopSpinner();
          if (err) return lookup.reject(err);
          _.each(entities, saveEntityInCache);
          lookup.resolve();
        });
      });
    } else {
      lookup.resolve();
    }
    return lookup.promise.then(function () {
      return _.map(ids, entityFromCache);
    });
  }

  function markMissing(entities) {
    return _.map(entities, function (value) {
      return value ? value : {
        isMissing: true
      };
    });
  }

  $scope.$watch('links', function (links, old, scope) {
    if (!links || links.length === 0) {
      $scope.linkedEntities = [];
    } else {
      lookupEntities(scope, links).then(function (entities) {
        scope.linkedEntities = markMissing(entities);
      });
    }
  }, true);

  $scope.$on('otValueChanged', function(event, path, value) {
    if (path === event.currentScope.otPath) ngModelSet(event.currentScope, value);
  });

  $scope.linkDescription = function(entity) {
    if (entity && !entity.isMissing && entity.getId()) {
      return $scope.linkType === 'Entry' ?
        $scope.spaceContext.entryTitle(entity, $scope.locale.code) :
        $scope.spaceContext.assetTitle(entity, $scope.locale.code) ;
    } else {
      return '(Missing entity)';
    }
  };

  $scope.$on('$destroy', function () {
    entityCache =
    ngModelSet =
    ngModelGet =
    validations = null;
  });
});
