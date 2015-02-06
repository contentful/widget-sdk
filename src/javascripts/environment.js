'use strict';

angular.module('contentful/environment', []).constant('environment', {
  env:         window.CF_ENV    ? window.CF_ENV : 'development',
  settings:    window.CF_CONFIG ? window.CF_CONFIG : {filepicker: {}, aviary: {}, google: {}, contentful: {}},
  gitRevision: 'GULP_GIT_REVISION'
}).config(['environment', function (environment) {
  if (window.CF_CONFIG) environment.settings = window.CF_CONFIG;
  if (window.CF_ENV   ) environment.env      = window.CF_ENV;
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
  }
}]);
