'use strict';

angular.module('contentful').controller('cfAutocompleteCtrl', function ($scope, $parse, $attrs, validation, cfSpinner, ShareJS, $q) {
  $scope.links = [];
  $scope.linkedEntries = [];

  var entriesCache = {};

  var ngModelGet = $parse($attrs.ngModel),
      ngModelSet = ngModelGet.assign;

  var validations = $scope.field.type === 'Array' && $scope.field.items.validations ?
    $scope.field.items.validations :
    $scope.field.validations;

  var linkContentTypeValidation = _(validations)
    .map(validation.Validation.parse)
    .where({name: 'linkContentType'})
    .first();

  if (linkContentTypeValidation) {
    $scope.linkContentType = _.find($scope.spaceContext.publishedContentTypes, function(et) {
      return et.getId() == linkContentTypeValidation.contentTypeId;
    });
  }

  $scope.addLink = function(entry, callback) {
    var link = { sys: {
      type: 'Link',
      linkType: 'Entry',
      id: entry.getId() }};

    function cb(updateFn) {
      return function (err) {
        $scope.$apply(function(scope) {
          if (err) return callback(err);
          updateFn(scope);
          scope.updateModel();
          callback(null);
        });
      };
    }

    saveEntryInCache(entry);
    if ($attrs.cfAutocomplete === 'entry') {
      $scope.otChangeValue(link, cb(function(scope){
        scope.links = [link];
      }));
    } else {
      // TODO Build this pattern into mkpath
      if (_.isArray(ShareJS.peek($scope.otDoc, $scope.otPath))) {
        $scope.otDoc.at($scope.otPath).push(link, cb(function(scope){
          scope.links.push(link);
        }));
      } else {
        ShareJS.mkpath($scope.otDoc, $scope.otPath, [link], cb(function(scope){
          scope.links = [link];
        }));
      }
    }
  };

  $scope.removeLink = function(index, entry) {
    if ($attrs.cfAutocomplete === 'entry') {
      return $scope.otChangeValue(null, function(err) {
        if (!err) $scope.$apply(function (scope) {
          scope.links.length = 0;
          scope.updateModel();
        });
      });
    } else {
      // TODO solve this cleaner, with tombstones? It's bad to have dead entries lying around in the identitymap
      // Entry was deleted if getId() returns undefined
      //           vvvvvvvvvvvvv
      if (entry && entry.getId() && entry.getId() != $scope.links[index].sys.id) throw new Error('Index mismatch!');
      $scope.otDoc.at($scope.otPath.concat(index)).remove(function (err) {
        if (!err) $scope.$apply(function (scope) {
          scope.links.splice(index,1);
          scope.updateModel();
        });
      });
    }
  };

  function saveEntryInCache(entry) {
    // TODO no need to check for entriesCache existence anymore after the Angular update
    if (entry && entriesCache) entriesCache[entry.getId()] = entry;
  }

  function entryFromCache(id) {
    // TODO no need to check for entriesCache existence anymore after the Angular update
    return entriesCache ? entriesCache[id] : undefined;
  }

  function lookupEntries(scope, links) {
    var lookup = $q.defer();
    var ids        = _.map(links, function (link) { return link.sys.id; });
    var missingIds = _.reject(ids, function (id) { return !!entryFromCache(id); });
    scope.spaceContext.space.getEntries({'sys.id[in]': missingIds.join(',')}, function (err, entries) {
      scope.$apply(function () {
        if (err) return lookup.reject(err);
        _.each(entries, saveEntryInCache);
        lookup.resolve();
      });
    });
    return lookup.promise.then(function () {
      return _.map(ids, entryFromCache);
    });
  }

  $scope.$watch('links', function (links, old, scope) {
    if (!links || links.length === 0) {
      $scope.linkedEntries = [];
    } else {
      var stopSpinner = cfSpinner.start();
      lookupEntries(scope, links).then(function (entries) {
        scope.linkedEntries = entries;
        stopSpinner();
      }, function () {
        stopSpinner();
      });
    }
  }, true);

  $scope.$on('otValueChanged', function(event, path, value) {
    if (path === event.currentScope.otPath) ngModelSet(event.currentScope, value);
  });

  $scope.linkDescription= function(entry) {
    if (entry && entry.getId()) {
      return $scope.spaceContext.entryTitle(entry, $scope.locale.code);
    } else {
      return '(Missing entry)';
    }
  };

  $scope.$on('$destroy', function () {
    entriesCache =
    ngModelSet =
    ngModelGet =
    validations =
    linkContentTypeValidation = null;
  });
});
