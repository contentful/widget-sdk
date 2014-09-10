'use strict';

angular.module('contentful').controller('cfLinkEditorCtrl', ['$scope', '$attrs', '$injector', function ($scope, $attrs, $injector) {
  var $parse                = $injector.get('$parse');
  var $q                    = $injector.get('$q');
  var LinkEditorEntityCache = $injector.get('LinkEditorEntityCache');
  var ShareJS               = $injector.get('ShareJS');
  var logger                = $injector.get('logger');
  var validation            = $injector.get('validation');

  $scope.links = [];
  $scope.linkedEntities = [];

  var entityCache;

  var ngModelGet = $parse($attrs.ngModel),
      ngModelSet = ngModelGet.assign;

  var validations = $scope.field.type === 'Array' && $scope.field.items.validations ?
      $scope.field.items.validations :
      $scope.field.validations;

  $scope.$watch('linkType', function (linkType) {
    var validationType;
    if(linkType == 'Entry') validationType = 'linkContentType';
    if(linkType == 'Asset') validationType = 'linkMimetypeGroup';

    initCache(linkType);

    var linkTypeValidation = _(validations)
      .map(validation.Validation.parse)
      .where({name: validationType})
      .first();

    if(linkTypeValidation){
      if (linkType == 'Entry') {
        $scope.linkContentType = _(linkTypeValidation.contentTypeId)
          .map(function (id) { return $scope.spaceContext.getPublishedContentType(id); })
          .compact()
          .value();
        // TODO This means the validation contains unpublished content  types.
        // It should never happen but I don't know how to deal with it here
        if ($scope.linkContentType.length === 0) $scope.linkContentType = null;
      } else if (linkType == 'Asset') {
        $scope.linkMimetypeGroup = linkTypeValidation.mimetypeGroupName;
      }
    } else {
      $scope.linkContentType   = null;
      $scope.linkMimetypeGroup = null;
    }
  });

  $scope.addLink = function (entity) {
    // TODO this still looks like too much manual work
    // Should just be the ShareJS operation, then the model should update itself from that
    var link = { sys: {
      type: 'Link',
      linkType: $scope.linkType,
      id: entity.getId() }};
    entityCache.save(entity);

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
      if (entity && !entity.isMissing && entity.getId() && entity.getId() != $scope.links[index].sys.id)
        logger.logError('Index mismatch', {
          data: {
            entity: entity,
            links: $scope.links
          }
        });
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

  function initCache(linkType) {
    var fetchMethod = linkType === 'Entry' ? 'getEntries' :
                      linkType === 'Asset' ? 'getAssets'  :
                      undefined;
    if (!fetchMethod) throw new Error('No linkType provided');
    entityCache = new LinkEditorEntityCache($scope.spaceContext.space, fetchMethod);
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
      lookupEntities(links).then(function (entities) {
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
}]);
