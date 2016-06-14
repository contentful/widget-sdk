'use strict';

angular.module('contentful').controller('LinkEditorController',
  ['$scope', '$injector', 'ngModel', 'linkParams', 'setValidationType',
    function ($scope, $injector, ngModel, linkParams, setValidation) {

  var $parse                = $injector.get('$parse');
  var $controller           = $injector.get('$controller');
  var $q                    = $injector.get('$q');
  var EntityCache           = $injector.get('EntityCache');
  var ShareJS               = $injector.get('ShareJS');
  var logger                = $injector.get('logger');
  var validation            = $injector.get('validation');
  var lookupLinksForEntityCache = $injector.get('lookupLinksForEntityCache');

  var entityCache;

  var ngModelGet = $parse(ngModel),
      ngModelSet = ngModelGet.assign;


  var validationsPath = $scope.field.type == 'Array' ? 'field.items.validations' : 'field.validations';
  $scope.$watchCollection(validationsPath, function(validations) {
    try {
      setLinkValidation(validations);
    } catch (exp) {
      logger.logError('Error setting link validation.', {
        data: {
          exp: exp,
          msg: exp.message,
          validations: validations
        }
      });
    }
  });

  $scope.entityStatusController = $controller('EntityStatusController', {$scope: $scope});

  $scope.links = [];
  $scope.linkedEntities = [];
  $scope.linksInitialized = false;

  $scope.linkMultiple = linkParams.multiple;
  $scope.linkSingle   = !$scope.linkMultiple;

  entityCache = new EntityCache($scope.spaceContext.space, linkParams.fetchMethod);

  $scope.$watch('links', function (links) {
    if (!links || links.length === 0) {
      setLinked([]);
    } else {
      lookupLinksForEntityCache(links, entityCache).then(function (entities) {
        setLinked(markMissing(entities));
      }, function () {
        setLinked(markMissing(new Array(links.length)));
      });
    }
  }, true);

  function setLinked(linked) {
    $scope.linkedEntities = linked;
    $scope.linksInitialized = true;
  }

  var offValueChanged = $scope.otSubDoc.onValueChanged(function (value) {
    ngModelSet($scope, value);
  });

  $scope.$on('$destroy', function () {
    entityCache =
    ngModelSet =
    ngModelGet = null;
    offValueChanged();
  });

  $scope.addLink = function (entity) {
    // TODO this still looks like too much manual work
    // Should just be the ShareJS operation, then the model should update itself from that
    var link = { sys: {
      type: 'Link',
      linkType: linkParams.type,
      id: entity.getId() }};

    entityCache.save(entity);

    if ($scope.linkSingle) {
      return $scope.otSubDoc.set(link);
    } else {
      return $scope.otSubDoc.push(link)
    }
  };

  $scope.removeLink = function(index, entity) {
    var cb;
    if ($scope.linkSingle) {
      return removeValue();
    } else {
      assertIndexMatches(index, entity);
      if (isLastLink()) {
        return removeValue();
      } else {
        return removeLink(index);
      }
    }

    function assertIndexMatches(index, entity) {
      if (entity && !entity.isMissing && entity.getId() && entity.getId() != dotty.get($scope.links[index], 'sys.id'))
        logger.logError('Index mismatch', {
          data: {
            entity: entity,
            links: $scope.links
          }
        });
    }

    function isLastLink() {
      return dotty.get($scope, 'links.length') === 1;
    }

    function removeValue() {
      return $scope.otSubDoc.remove();
    }

    function removeLink(index) {
      return $scope.otSubDoc.removeAt(index)
    }
  };

  function setLinkValidation(validations) {
    var linkTypeValidation = _(validations)
    .map(validation.Validation.parse)
    .filter({name: linkParams.validationType})
    .first();

    setValidation(linkTypeValidation);
  }

  function markMissing(entities) {
    return _.map(entities, function (value) {
      return value ? value : {
        isMissing: true
      };
    });
  }

}]);
