'use strict';

angular.module('cf.app')

.factory('data/entrySnapshots', ['require', function (require) {
  var random = require('random');
  var authentication = require('authentication');
  var $timeout = require('$timeout');
  var moment = require('moment');

  var ITEMS = 10;
  var snapshots = _.range(ITEMS).map(fakeSnapshot);


  return {
    getList: getList
  };

  function getList (entryId) {
    return $timeout(200)
    .then(getCurrentUser)
    .then(function (user) {
      var link = {sys: {type: 'Link', linkType: 'User', id: user.sys.id}};
      return snapshots.map(function (s) {
        return _.merge({sys: {createdBy: link, entryId: entryId}}, s);
      });
    });
  }

  function getCurrentUser () {
    return authentication.getTokenLookup()
    .then(function (lookup) {
      return _.clone(lookup.sys.createdBy);
    });
  }

  function fakeSnapshot (i) {
    return {
      sys: {
        type: 'Snapshot',
        createdAt: moment().subtract(i, 'days').format(),
        id: random.id(),
        snapshotType: 'publication'
      },
      snapshot: {
        fields: {
          title: {
            'en-US': 'title of version ' + i,
            'pl': 'Tytuł wersji numer ' + i
          },
          content: {
            'en-US': 'content of version ' + i,
            'pl': 'Zawartość wersji numer ' + i
          }
        }
      }
    };
  }
}]);
