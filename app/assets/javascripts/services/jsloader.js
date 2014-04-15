'use strict';

angular.module('contentful').factory('jsloader', function ($document) {
  return {
    create: function (baseUrl, httpsBaseUrl) {
      var doc = $document.get(0);
      var isSecure = 'https:' === doc.location.protocol;
      baseUrl = (isSecure && httpsBaseUrl) ? httpsBaseUrl : baseUrl;
      return function loadFile(file, onLoad) {
        var b = doc.createElement('script');
        b.type = 'text/javascript';
        b.async = !0;
        if(onLoad) b.onload = onLoad;
        b.src = (isSecure ? 'https:' : 'http:') + baseUrl + file;
        var c = doc.getElementsByTagName('script')[0];
        c.parentNode.insertBefore(b, c);
      };
    }
  };
});

