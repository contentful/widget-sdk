'use strict';

angular.module('contentful').factory('WebhookActivityRepository', ['$injector', function ($injector) {

  var $timeout = $injector.get('$timeout');
  var $q       = $injector.get('$q');
  var moment   = $injector.get('moment');
  var random   = $injector.get('random');

  var cache = {};

  return {
    getDetails: function (space, webhook, callId) {
      var cached = cache[[space.getId(), webhook.sys.id].join(',')];
      var d = $q.defer();
      var overviewPromise = cached ? $q.when(cached.items) : this.getOverview(space, webhook);

      return overviewPromise.then(function (items) {
        var overviewItem = _.find(items, function (item) {
          return item.sys.id === callId;
        });

        $timeout(function () {
          if (overviewItem) {
            d.resolve(makeDetails(_.clone(overviewItem, true)));
          } else {
            d.reject({statusCode: 404});
          }
        }, _.random(50, 100));

        return d.promise;
      });
    },
    getOverview: function (space, webhook) {
      var d = $q.defer();

      // this will be async
      $timeout(function () {
        d.resolve(makeOverview(space, webhook));
      }, _.random(50, 100));

      return d.promise.then(function (overview) {
        return overview.items;
      });
    }
  };

  function makeDetails(item) {
    item.sys.type = 'WebhookCallDetails';

    item.request = {
      url: item.url,
      method: 'POST',
      headers: {
        'X-Contentful-Topic': 'ContentManagement.Entry.' + item.eventType
      },
      body: 'some crazy json payload',
      timeout: 3e4
    };

    if (item.code) {
      item.response = {
        statusCode: item.code,
        body: 'some crazy response',
        headers: {
          Server: 'PikachuServe'
        },
        url: item.url
      };
    }

    return item;
  }

  function makeOverview(space, webhook) {
    var key = [space.getId(), webhook.sys.id].join(',');

    if (cache[key]) {
      return cache[key];
    }

    var response = {items: _(_.range(0, 5*500, 5)).map(function (t) {
      // every 5min, plus minus 30sec
      return moment().valueOf() - (t * 60 * 1e3) + _.random((t !== 0 ? -3e4 : 0), +3e4);
    }).map(function (t) {
      return makeOverviewItem(space.getId(), webhook.url, t);
    }).value()};

    cache[key] = response;
    return response;
  }

  function makeOverviewItem(spaceId, url, requestAt) {
    var base = {
      sys: {
        id: random.id(),
        type: 'WebhookCallOverview',
        space: {
          sys: {
            type: 'Link',
            linkType: 'Space',
            id: spaceId
          }
        }
      },
      url: url,
      eventType: Math.random() < 0.5 ? 'publish' : 'unpublish',
      requestAt: time(requestAt)
    };

    var code = Math.random() < 0.5 ? [404, 500, null][_.random(0, 2)] : 200;

    if (!_.isNull(code)) {
      base.code = code;
      base.responseAt = time(requestAt + _.random(100, 1000));
      base.errors = code === 200 ? null : [{404: 'ClientError', 500: 'ServerError'}[code]];
    } else {
      base.errors = ['TimeoutError'];
    }

    return base;
  }

  function time(unixts) {
    return moment(unixts).toISOString();
  }
}]);
