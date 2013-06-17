'use strict';

angular.module('contentful').controller('cfAutocompleteCtrl', function ($scope, $parse, $attrs, validation, cfSpinner, ShareJS) {
  $scope.links = [];
  $scope.linkedEntries = [];

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

    if ($attrs.cfAutocomplete === 'entry') {
      $scope.otChangeValue(link, cb(function(scope){scope.links = [link];}));
    } else {
      // TODO Build this pattern into mkpath
      if (_.isArray(ShareJS.peek($scope.otDoc, $scope.otPath))) {
        $scope.otDoc.at($scope.otPath).push(link, cb(function(scope){scope.links.push(link);}));
      } else {
        ShareJS.mkpath($scope.otDoc, $scope.otPath, [link], cb(function(scope){scope.links = [link];}));
      }
    }
  };

  $scope.removeLink = function(entry) {
    if ($attrs.cfAutocomplete === 'entry') {
      return $scope.otChangeValue(null, function(err) {
        if (!err) $scope.$apply(function (scope) {
          scope.links.length = 0;
          scope.updateModel();
        });
      });
    } else {
      var entryIndex = _.reduce($scope.links, function (result, link, index) {
        return entry.getId() === link.sys.id ? index : result;
      }, -1);
      $scope.otDoc.at($scope.otPath.concat(entryIndex)).remove(function (err) {
        if (!err) $scope.$apply(function (scope) {
          scope.links.splice(entryIndex,1);
          scope.updateModel();
        });
      });
    }
  };

  $scope.$watch('links', function (links, old, scope) {
    var ids = _.map(links, function (link) { return link.sys.id; });

    if (ids.length === 0) {
      $scope.linkedEntries = [];
    } else {
      var stopSpinner = cfSpinner.start();
      scope.spaceContext.space.getEntries({'sys.id[in]': ids.join(',')}, function (err, entries) {
        entries = _.reduce(entries, function (map, entry) {
          map[entry.getId()] = entry;
          return map;
        }, {} );
        entries = _.map(links, function (link) { return entries[link.sys.id]; });
        $scope.$apply(function (scope) { scope.linkedEntries = entries; });
        stopSpinner();
      });
    }
  }, true);

  $scope.$on('otValueChanged', function(event, path, value) {
    if (path === event.currentScope.otPath) ngModelSet(event.currentScope, value);
  });

  $scope.linkDescription= function(entry) {
    if (entry) {
      return $scope.spaceContext.entryTitle(entry, $scope.locale.code);
    } else {
      return '(nothing)';
    }
  };
});
