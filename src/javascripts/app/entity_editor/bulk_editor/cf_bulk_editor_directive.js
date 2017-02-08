angular.module('contentful')

.directive('cfBulkEditor', ['require', function (require) {
  var K = require('utils/kefir');
  var accessChecker = require('accessChecker');
  var spaceContext = require('spaceContext');
  var entitySelector = require('entitySelector');
  var deepFreeze = require('utils/DeepFreeze').deepFreeze;
  var List = require('utils/List');
  var Tracking = require('app/entity_editor/bulk_editor/Tracking');

  return {
    scope: {
      referenceContext: '='
    },
    restrict: 'E',
    template: JST.bulk_editor(),
    link: link
  };

  function link ($scope) {
    // This is passed from the EntryEditorController
    var referenceContext = $scope.referenceContext;

    var templateData = {};
    $scope.data = templateData;

    var nextFocusIndex = referenceContext.focusIndex;
    var initialLoadCount = null;

    var scrollTargetBus = K.createBus($scope);

    var track = Tracking.create(
      referenceContext.parentId,
      referenceContext.links$
    );

    track.open();
    $scope.$on('$destroy', track.close);

    // Passed to cfBulkEntityEditor directive
    $scope.editorContext = {
      editorSettings: referenceContext.editorSettings,
      scrollTarget$: scrollTargetBus.stream,
      initializedEditor: function () {
        initialLoadCount--;
        if (initialLoadCount < 1) {
          templateData.loaded = true;
          $scope.$applyAsync(forceFocus);
        }
      },
      track: track
    };

    // Property<string>
    // List of IDs for the linked entries
    var ids$ = referenceContext.links$.map(function (links) {
      return links.map(_.property('sys.id')).filter(_.isString);
    });

    // Each of these contexts is passed to a cfBulkEntityEditor
    // directive.
    var entityContexts$ = ids$.map(function (ids) {
      return List.makeKeyed(ids, _.identity)
      .map(function (item) {
        return deepFreeze({
          id: item.value,
          remove: _.partial(removeByKey, item.key),
          key: item.key
        });
      });
    });

    K.onValueScope($scope, entityContexts$, function (ctxs) {
      $scope.entityContexts = ctxs;
      templateData.linkCount = ctxs.length;
    });

    // The initial count helps us figure out when to remove the global
    // loader.
    K.onValueScope($scope, entityContexts$.take(1), function (ctxs) {
      initialLoadCount = ctxs.length;
    });


    $scope.actions = makeActions(referenceContext.field, function (links) {
      nextFocusIndex = -1;
      links.forEach(referenceContext.add);
    }, referenceContext.links$, track);


    function removeByKey (key) {
      var index = _.findIndex($scope.entityContexts, {key: key});
      if (index > -1) {
        referenceContext.remove(index);
      }
    }


    function forceFocus () {
      if (nextFocusIndex === null) {
        return;
      }
      var focusIndex = nextFocusIndex < 0
        ? $scope.entityContexts.length + nextFocusIndex
        : nextFocusIndex;
      var focusContext = $scope.entityContexts[focusIndex];
      if (focusContext) {
        scrollTargetBus.emit(focusContext.key);
      }
      nextFocusIndex = null;
    }
  }

  /**
   * Returns the actions for creating new entries and adding existing entries.
   */
  function makeActions (field, addLinks, links$, track) {
    // TODO necessary for entitySelector change it
    var extendedField = _.extend({}, field, {
      itemLinkType: dotty.get(field, ['items', 'linkType']),
      itemValidations: dotty.get(field, ['items', 'validations'], [])
    });

    return {
      accessibleCTs: getAccessibleCTs(extendedField),
      addNewEntry: addNewEntry,
      addExistingEntries: addExistingEntries
    };

    function addNewEntry (ctId) {
      spaceContext.cma.createEntry(ctId, {})
      .then(function (entity) {
        track.addNew();
        addLinks([linkEntity(entity)]);
      });
    }

    function addExistingEntries () {
      var currentSize = K.getValue(links$).length;
      entitySelector.open(extendedField, currentSize)
      .then(function (entities) {
        track.addExisting(entities.length);
        addLinks(entities.map(linkEntity));
      });
    }
  }


  /**
   * Returns a list of {id, name} tuples for content types that the user can add
   * to this field.
   *
   * This takes into account the content types users can create entries for and
   * the content type validation on the field.
   */
  function getAccessibleCTs (field) {
    var itemValidations = dotty.get(field, ['items', 'validations']);

    var contentTypeValidation = _.find(itemValidations, function (validation) {
      return !!validation.linkContentType;
    });

    var validCtIds = contentTypeValidation
      ? contentTypeValidation.linkContentType
      : getAllContentTypeIds();

    var validCTs = _.uniq(validCtIds).map(function (ctId) {
      return spaceContext.publishedCTs.get(ctId);
    });

    var creatableCTs = _.filter(validCTs, function (ct) {
      return ct && accessChecker.canPerformActionOnEntryOfType('create', ct.getId());
    });

    return creatableCTs.map(function (ct) {
      return {
        id: ct.data.sys.id,
        name: ct.getName()
      };
    });
  }

  function getAllContentTypeIds () {
    return K.getValue(spaceContext.publishedCTs.items$).map(function (ct) {
      return ct.sys.id;
    }).toJS();
  }

  function linkEntity (entity) {
    return {
      sys: {
        id: entity.sys.id,
        linkType: entity.sys.type,
        type: 'Link'
      }
    };
  }
}]);
