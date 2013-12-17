'use strict';

angular.module('contentful').factory('filepicker', function ($window, environment, $q, $rootScope) {
    if ($window.filepicker) {
        return $window.filepicker;
    }
    var b = document.createElement('script');
    b.type = 'text/javascript';
    b.async = !0;
    b.src = ('https:' === document.location.protocol ? 'https:' : 'http:') + '//api.filepicker.io/v1/filepicker.js';
    var c = document.getElementsByTagName('script')[0];
    c.parentNode.insertBefore(b, c);
    var d = {};
    d._queue = [];
    var e = 'pick,pickMultiple,pickAndStore,read,write,writeUrl,export,convert,store,storeUrl,remove,stat,setKey,constructWidget,makeDropPane'.split(',');
    var f = function (a, b) {
        return function () {
            b.push([a, arguments]);
        };
    };
    for (var g = 0; g < e.length; g++) {
        d[e[g]] = f(e[g], d._queue);
    }
    $window.filepicker = d;

    d.setKey(environment.settings.filepicker.api_key);

    var settings = {
      policy: environment.settings.filepicker.policy,
      signature: environment.settings.filepicker.signature
    };

    return {
      makeDropPane: function (dropPane, options) {
        options = _.extend(settings, options);
        return $window.filepicker.makeDropPane(dropPane, options);
      },
      pick: function () {
        var deferred = $q.defer();

        $window.filepicker.pick(settings, function(FPFile){
          $rootScope.$apply(function () {
            deferred.resolve(FPFile);
          });
        }, function (FPError) {
          $rootScope.$apply(function () {
            deferred.reject(FPError);
          });
        });

        return deferred.promise;
      }
    };
});
