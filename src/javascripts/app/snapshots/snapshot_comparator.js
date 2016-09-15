'use strict';

angular.module('cf.app')

.directive('cfSnapshotComparator', [function () {
  return {
    template: JST.snapshot_comparator(),
    restrict: 'E',
    controller: 'SnapshotComparatorController'
  };
}])

.controller('SnapshotComparatorController', ['require', '$scope', function (require, $scope) {
  var spaceContext = require('spaceContext');
  var SnapshotDoc = require('SnapshotComparatorController/snapshotDoc');
  var DataFields = require('EntityEditor/DataFields');
  var ContentTypes = require('data/ContentTypes');
  var Command = require('command');
  var modalDialog = require('modalDialog');
  var $state = require('$state');
  var $timeout = require('$timeout');
  var TheLocaleStore = require('TheLocaleStore');

  $scope.context.title = spaceContext.entryTitle($scope.entry);
  $scope.otDoc = SnapshotDoc.create(dotty.get($scope, 'entry.data', {}));
  $scope.snapshotDoc = SnapshotDoc.create(dotty.get($scope, 'snapshot.snapshot', {}));
  $scope.pathsToRestore = [];

  $scope.select = select;
  $scope.restore = restore;
  $scope.save = Command.create(save, {
    disabled: function () {
      return $scope.pathsToRestore.length < 1;
    }
  });

  var contentTypeData = $scope.contentType.data;
  var fields = contentTypeData.fields;
  $scope.fields = DataFields.create(fields, $scope.otDoc);
  $scope.transformedContentTypeData = ContentTypes.internalToPublic(contentTypeData);

  function select () {
    return modalDialog.open({
      template: 'snapshot_selector',
      scopeData: {query: {}}
    }).promise.then(goToSnapshot);
  }

  function goToSnapshot (snapshot) {
    $scope.context.ready = false;
    $timeout(function () {
      $state.go('.', {snapshotId: snapshot.sys.id});
    });
  }

  function restore () {
    $scope.$broadcast('select:left');
  }

  function save () {
    var data = {sys: _.cloneDeep($scope.entry.data.sys)};
    allPaths($scope.entry.data.fields).forEach(externalize(data, $scope.otDoc));
    $scope.pathsToRestore.forEach(externalize(data, $scope.snapshotDoc));

    return spaceContext.cma.updateEntry(data)
    .then(function () {
      return $state.go('^.^', {}, {reload: true});
    });
  }

  function allPaths (fields) {
    return _.reduce(fields, function (acc, field, fieldId) {
      return acc.concat(_.reduce(field, function (acc, _locale, localeCode) {
        return acc.concat(['fields', fieldId, localeCode].join('.'));
      }, []));
    }, []);
  }

  function externalize (target, sourceDoc) {
    return function (path) {
      path = path.split('.');
      var fieldId = externalFieldId(path[1]);
      var localeCode = TheLocaleStore.toPublicCode(path[2]);
      var value = sourceDoc.getValueAt(path);
      dotty.put(target, ['fields', fieldId, localeCode], value);
    };
  }

  function externalFieldId (internalId) {
    var field = _.find(contentTypeData.fields, {id: internalId});
    return field && (field.apiName || field.id);
  }
}])

.factory('SnapshotComparatorController/snapshotDoc', ['require', function (require) {
  var $q = require('$q');
  var K = require('utils/kefir');

  var resolve = _.constant($q.resolve());

  return {create: create};

  function create (data) {
    return {
      getValueAt: valueAt,
      valuePropertyAt: valuePropertyAt,

      setValueAt: resolve,
      removeValueAt: resolve,
      insertValueAt: resolve,
      pushValueAt: resolve,
      moveValueAt: resolve,

      collaboratorsFor: _.constant(K.constant([]))
    };

    function valuePropertyAt (path) {
      return K.constant(valueAt(path));
    }

    function valueAt (path) {
      return dotty.get(data, path);
    }
  }
}])

.controller('SnapshotFieldController', ['require', '$scope', function (require, $scope) {
  var store = require('TheLocaleStore');
  var K = require('utils/kefir');

  var field = $scope.widget.field;
  var locales = field.localized ? store.getPrivateLocales() : [store.getDefaultLocale()];

  $scope.field = field;
  $scope.locales = _.filter(locales, store.isLocaleActive);

  $scope.validator = {errors$: K.constant([])};
  $scope.state = {registerPublicationWarning: _.constant(_.noop)};

  this.setInvalid = _.noop;
}])

.controller('SnapshotComparisonController', ['$scope', function ($scope) {
  var path = ['fields', $scope.field.id, $scope.locale.internal_code];
  var v1 = $scope.otDoc.getValueAt(path);
  var v2 = $scope.snapshotDoc.getValueAt(path);

  $scope.isDifferent = !_.isEqual(v1, v2);
  $scope.select = $scope.isDifferent ? select : _.noop;

  $scope.select('right');
  $scope.$on('select:left', function () {
    $scope.select('left');
  });

  function select (side) {
    var joined = path.join('.');
    $scope.selected = side;

    if (side === 'right') {
      _.pull($scope.pathsToRestore, joined);
    } else {
      $scope.pathsToRestore.push(joined);
    }
  }
}]);
