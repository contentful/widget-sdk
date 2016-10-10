'use strict';

angular.module('cf.app')

.factory('data/entrySnapshots', ['require', function (require) {
  var authentication = require('authentication');
  var $timeout = require('$timeout');
  var $q = require('$q');
  var moment = require('moment');
  var localeStore = require('TheLocaleStore');

  var snapshots = _.range(135).map(fakeSnapshot);

  return {
    getOne: getOne,
    getList: getList
  };

  function getOne (id, ct) {
    var snapshot = _.find(snapshots, function (s) {
      return s.sys.id === id;
    });

    if (!snapshot) {
      return $q.reject(new Error('No snapshot with ID ' + id + '!'));
    }

    return $timeout(300)
    .then(getCurrentUser)
    .then(function (user) {
      return fakeFields(ct)(fakeSys(user)(snapshot));
    });
  }

  function getList (q, ct) {
    q = q || {};
    q.skip = q.skip || 0;
    q.limit = q.limit || 40;

    return $timeout(300)
    .then(getCurrentUser)
    .then(function (user) {
      var result = snapshots
      .slice(q.skip, q.skip + q.limit)
      .map(fakeSys(user))
      .map(fakeFields(ct));

      return result;
    });
  }

  function getCurrentUser () {
    return authentication.getTokenLookup()
    .then(function (lookup) {
      return _.clone(lookup.sys.createdBy);
    });
  }

  function fakeSnapshot (i) {
    i = i + 1;

    return {
      sys: {
        type: 'Snapshot',
        createdAt: moment().subtract(i, 'days').format(),
        id: 'artificial-id-' + i,
        snapshotType: 'publication',
        tmp: {i: i}
      },
      snapshot: {}
    };
  }

  function fakeSys (user) {
    var link = {sys: {type: 'Link', linkType: 'User', id: user.sys.id}};

    return function (s) {
      return _.merge({sys: {createdBy: link}}, s);
    };
  }

  function fakeFields (ct) {
    var fields = dotty.get(ct, 'data.fields', []);
    var locales = localeStore.getPrivateLocales();

    return function (s) {
      s.snapshot.fields = _.transform(fields, function (acc, field) {
        acc[field.id] = _.transform(locales, function (acc, locale) {
          var code = locale.internal_code;
          acc[code] = fakeContent(field, code, s.sys);
        }, {});
      }, {});

      return s;
    };
  }

  function fakeContent (field, code, sys) {
    if (_.includes(['Text', 'Symbol'], field.type)) {
      return 'Content of ' + field.apiName + ' for snapshot #' + sys.tmp.i + '. Language is ' + code + '.';
    }
  }
}]);
