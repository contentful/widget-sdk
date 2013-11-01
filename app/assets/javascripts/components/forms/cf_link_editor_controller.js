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

  $scope.addLink = function(entity, callback) {
    var link = { sys: {
      type: 'Link',
      linkType: $scope.linkType,
      id: entity.getId() }};

    function wrapply(body) {
      return function wrappedBody() {
        var args = arguments,
            self = this,
            retval;
        $scope.$apply(function () {
          retval = body.apply(self, args);
        });
        return retval;
      };
    }

    function cb(updateFn) {
      return function (err) {
        if (err) return callback(err);
        updateFn($scope);
        $scope.updateModel();
        callback(null);
      };
    }

    saveEntityInCache(entity);
    if ($scope.linkSingle) {
      $scope.otChangeValue(link, cb(function(scope){
        scope.links = [link];
      }));
    } else {
      // TODO Build this pattern into mkpath
      if (_.isArray(ShareJS.peek($scope.otDoc, $scope.otPath))) {
        $scope.otDoc.at($scope.otPath).push(link, wrapply(cb(function(scope){
          scope.links.push(link);
        })));
      } else {
        ShareJS.mkpath({
          doc: $scope.otDoc,
          path: $scope.otPath,
          types: $scope.otPathTypes,
          value: [link]
        }, wrapply(cb(function(scope){
          scope.links = [link];
        })));
      }
    }
  };

  $scope.removeLink = function(index, entity) {
    if ($scope.linkSingle) {
      return $scope.otChangeValue(null, function(err) {
        if (err) return;
        $scope.links.length = 0;
        $scope.updateModel();
      });
    } else {
      // TODO solve this cleaner, with tombstones? It's bad to have dead entities lying around in the identitymap
      // entity was deleted if getId() returns undefined
      //           vvvvvvvvvvvvv
      if (entity && entity.getId && entity.getId() && entity.getId() != $scope.links[index].sys.id) throw new Error('Index mismatch!');
      $scope.otDoc.at($scope.otPath.concat(index)).remove(function (err) {
        if (!err) $scope.$apply(function (scope) {
          scope.links.splice(index,1);
          scope.updateModel();
        });
      });
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
      // TODO use promisedLoader
      scope.spaceContext.space[scope.fetchMethod]({'sys.id[in]': missingIds.join(',')}, function (err, entities) {
        scope.$apply(function () {
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

  $scope.$watch('links', function (links, old, scope) {
    if (!links || links.length === 0) {
      $scope.linkedEntities = [];
    } else {
      var stopSpinner = cfSpinner.start();
      lookupEntities(scope, links).then(function (entities) {
        var counter = 0;
        scope.linkedEntities = _.map(entities, function (entity) {
          if(!entity) {
            entity = {'$$hashKey': 'missingEntity_'+counter};
            counter++;
          }
          return Object.create(entity);
        });
        stopSpinner();
      }, function () {
        stopSpinner();
      });
    }
  }, true);

  $scope.$on('otValueChanged', function(event, path, value) {
    if (path === event.currentScope.otPath) ngModelSet(event.currentScope, value);
  });

  $scope.linkDescription = function(entity) {
    if (entity && entity.getId && entity.getId()) {
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
