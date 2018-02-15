angular.module('contentful')

.directive('cfBulkEditor', ['require', function (require) {
  var K = require('utils/kefir');
  var accessChecker = require('access_control/AccessChecker');
  var spaceContext = require('spaceContext');
  var entitySelector = require('entitySelector');
  var deepFreeze = require('utils/Freeze').deepFreeze;
  var List = require('utils/List');
  var Tracking = require('app/entity_editor/bulk_editor/Tracking');
  var DataLoader = require('app/entity_editor/DataLoader');
  var Analytics = require('analytics/Analytics');

  return {
    scope: {
      referenceContext: '=',
      renderInline: '=',
      onRemove: '='
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

    // Property<string>
    // List of IDs for the linked entries
    var ids$ = referenceContext.links$.map(function (links) {
      var ids = [];

      if (Array.isArray(links)) {
        ids = links.map(_.property('sys.id'));
      } else {
        ids = [_.get(links, 'sys.id')];
      }

      return ids.filter(_.isString);
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

    var loadEditorData = DataLoader.makePrefetchEntryLoader(spaceContext, ids$);
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
      track: track,
      loadEditorData: loadEditorData
    };


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
      itemLinkType: _.get(field, ['items', 'linkType']),
      itemValidations: _.get(field, ['items', 'validations'], [])
    });
    var allowedCTs = getAllowedCTs(extendedField);
    var accessibleCTs = allowedCTs.map(function (ct) {
      return {
        id: ct.sys.id,
        name: ct.name
      };
    });

    return {
      allowedCTs: allowedCTs, // For new "Add entry" button behind feature flag.
      accessibleCTs: accessibleCTs, // For legacy "Add entry" button.
      addNewEntry: addNewEntry,
      addExistingEntries: addExistingEntries
    };

    function addNewEntry (ctOrCtId) {
      var contentType = _.isObject(ctOrCtId)
        ? ctOrCtId
        : spaceContext.publishedCTs.get(ctOrCtId);
      spaceContext.cma.createEntry(contentType.getId(), {})
      .then(function (entry) {
        Analytics.track('entry:create', {
          eventOrigin: 'bulk-editor',
          contentType: contentType,
          response: { data: entry }
        });
        track.addNew();
        addLinks([linkEntity(entry)]);
      });
    }

    function addExistingEntries () {
      var currentSize = K.getValue(links$).length;
      entitySelector.openFromField(extendedField, currentSize)
      .then(function (entities) {
        track.addExisting(entities.length);
        addLinks(entities.map(linkEntity));
      });
    }
  }


  /**
   * Returns a list of content types that the user can add to this field.
   *
   * This takes into account the content types users can create entries for and
   * the content type validation on the field.
   */
  function getAllowedCTs (field) {
    var itemValidations = _.get(field, ['items', 'validations']);

    var contentTypeValidation = _.find(itemValidations, function (validation) {
      return !!validation.linkContentType;
    });

    var validCtIds = contentTypeValidation
      ? contentTypeValidation.linkContentType
      : getAllContentTypeIds();

    var validCTs = _.uniq(validCtIds).map(function (ctId) {
      return spaceContext.publishedCTs.get(ctId);
    });

    return _.filter(validCTs, function (ct) {
      return ct && accessChecker.canPerformActionOnEntryOfType('create', ct.getId());
    }).map(function (ct) {
      return ct.data;
    });
  }

  function getAllContentTypeIds () {
    return spaceContext.publishedCTs.getAllBare().map(function (ct) {
      return ct.sys.id;
    });
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
