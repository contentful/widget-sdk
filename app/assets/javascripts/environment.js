'use strict';

angular.module('contentful/environment', []).constant('environment', {
  env: 'development',
  settings: {filepicker: {}, aviary: {}, google: {}, contentful: {}}
}).config(['environment', function (environment) {
  var s = environment.settings;

  s.main_domain = s.main_domain || 'contentful.com'; // Safety fallback

  // for ZeroClipboard
  var whiteList = _.union([
                s.asset_host,
                s.main_domain,
        'be.' + s.main_domain,
       'app.' + s.main_domain,
    'static.' + s.main_domain,
  ], s.additional_domains);
  s.resourceUrlWhiteList = whiteList;

  // for sceDelegateProvider
  var domains = _([s.asset_host, s.main_domain])
    .union(s.additional_domains)
    .compact()
    .map(function(domain){ return domain.replace('.', '\\.').replace(/:\d+$/, ''); })
    .uniq()
    .value()
    .join('|');
  //                                          __proto___      __maybe_subdomain_             __port__
  s.resourceUrlWhiteListRegexp = [new RegExp('(https?:)?\\/\\/([^:\\/.?&;]*\\.)?('+domains+')(:\\d+)?.*'), 'self'];

  s.dataLoggerUrl = 'https://cf-track-107d49294b11c1.appspot.com/track/';

  // TODO IE8 Hack:
  if (window.XDomainRequest) {
    s.api_host = s.app_host + '/api';
    s.ot_host  = s.app_host + '/ot';
    //s.api_host = 'app.joistio.com:8888' + '/api';
    //s.ot_host  = 'app.joistio.com:8888' + '/ot';
  }
}]);
