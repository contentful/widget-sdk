'use strict';

angular.module('contentful').controller('LinkEditorController',
  ['$scope', '$injector', 'ngModel', 'linkParams', function ($scope, $injector, ngModel, linkParams) {
  var controller = this;

  var $parse                = $injector.get('$parse');
  var $q                    = $injector.get('$q');
  var LinkEditorEntityCache = $injector.get('LinkEditorEntityCache');
  var ShareJS               = $injector.get('ShareJS');
  var logger                = $injector.get('logger');
  var validation            = $injector.get('validation');

  var entityCache;

  var ngModelGet = $parse(ngModel),
      ngModelSet = ngModelGet.assign;

  var validations = $scope.field.type === 'Array' && $scope.field.items.validations ?
      $scope.field.items.validations :
      $scope.field.validations;

  $scope.links = [];
  $scope.linkedEntities = [];

  var linkType = linkParams.type;

  $scope.linkMultiple = linkParams.multiple;
  $scope.linkSingle   = !$scope.linkMultiple;

  initCache(linkParams.type);

  var linkTypeValidation = _(validations)
    .map(validation.Validation.parse)
    .where({name: linkParams.validationType})
    .first();

  if(linkTypeValidation){
    // TODO these should be methods passed along
    if (linkType == 'Entry') {
      $scope.linkContentTypes = _(linkTypeValidation.contentTypeId)
        .map(function (id) { return $scope.spaceContext.getPublishedContentType(id); })
        .compact()
        .value();
      // TODO This means the validation contains unpublished content  types.
      // It should never happen but I don't know how to deal with it here
      if ($scope.linkContentTypes.length === 0) $scope.linkContentTypes = null;
    } else if (linkType == 'Asset') {
      $scope.linkMimetypeGroup = linkTypeValidation.mimetypeGroupName;
    }
  } else {
    $scope.linkContentTypes  = null;
    $scope.linkMimetypeGroup = null;
  }

  $scope.$watch('links', function (links, old, scope) {
    if (!links || links.length === 0) {
      $scope.linkedEntities = [];
    } else {
      lookupEntities(links).then(function (entities) {
        scope.linkedEntities = markMissing(entities);
      });
    }
  }, true);

  $scope.$on('otValueChanged', function(event, path, value) {
    if (path === event.currentScope.otPath) ngModelSet(event.currentScope, value);
  });

  $scope.$on('$destroy', function () {
    entityCache =
    ngModelSet =
    ngModelGet =
    validations = null;
  });

  $scope.addLink = function (entity) {
    // TODO this still looks like too much manual work
    // Should just be the ShareJS operation, then the model should update itself from that
    var link = { sys: {
      type: 'Link',
      linkType: linkParams.type,
      id: entity.getId() }};
    entityCache.save(entity);

    var cb, promise;
    if ($scope.linkSingle) {
      cb = $q.callback();
      $scope.otChangeValue(link, cb);
      promise = cb.promise.then(function () { $scope.links = [link]; });
    } else {
      cb = $q.callbackWithApply();
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
      cb = $q.callback();
      $scope.otChangeValue(null, cb);
      return cb.promise.then(function () {
        $scope.links.length = 0;
        $scope.updateModel();
      });
    } else {
      assertIndexMatches(index, entity);
      cb = $q.callbackWithApply();
      $scope.otDoc.at($scope.otPath.concat(index)).remove(cb);
      return cb.promise.then(function () {
        $scope.links.splice(index,1);
        $scope.updateModel();
      });
    }

    function assertIndexMatches(index, entity) {
      if (entity && !entity.isMissing && entity.getId() && entity.getId() != $scope.links[index].sys.id)
        logger.logError('Index mismatch', {
          data: {
            entity: entity,
            links: $scope.links
          }
        });
    }
  };

  $scope.linkDescription = function(entity) {
    if (entity && !entity.isMissing && entity.getId()) {
      // TODO this should be a method passed along
      return linkType === 'Entry' ?
        $scope.spaceContext.entryTitle(entity, $scope.locale.code) :
        $scope.spaceContext.assetTitle(entity, $scope.locale.code) ;
    } else {
      return '(Missing entity)';
    }
  };

  function lookupEntities(links) {
    var ids = _.map(links, function (link) {
      if(!link){
        logger.logError('link object doesnt exist', {
          data: {
            links: links
          }
        });
      }
      return link.sys.id;
    });
    return entityCache.getAll(ids);
  }

  function initCache() {
    entityCache = new LinkEditorEntityCache($scope.spaceContext.space, linkParams.fetchMethod);
  }

  function markMissing(entities) {
    return _.map(entities, function (value) {
      return value ? value : {
        isMissing: true
      };
    });
  }

}]);
