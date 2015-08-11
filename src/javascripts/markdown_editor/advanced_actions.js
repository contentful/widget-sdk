'use strict';

angular.module('contentful').factory('MarkdownEditor/advancedActions', ['$injector', function ($injector) {

  var $rootScope        = $injector.get('$rootScope');
  var modalDialog       = $injector.get('modalDialog');
  var specialCharacters = $injector.get('specialCharacters');
  var assetUrl          = $injector.get('$filter')('assetUrl');
  var LazyLoader        = $injector.get('LazyLoader');

  return {
    link: link,
    asset: asset,
    special: special,
    table: table,
    embed: embed
  };

  function link(cb) {
    modalDialog.open({
      scope: _.extend($rootScope.$new(), { model: {} }),
      template: 'insert_link_dialog',
      ignoreEnter: true
    }).promise.then(function (data) {
      cb(_makeLink(data));
    });
  }

  function _makeLink(data) {
    if (data.title) {
      return '[' + data.title + '](' + data.url + ')';
    } else {
      return '<' + data.url + '>';
    }
  }

  function asset(scope, cb) {
    var localeCode = dotty.get(scope, 'locale.internal_code', null);
    var defaultLocaleCode = dotty.get(scope, 'spaceContext.defaultLocale.internal_code', null);

    modalDialog.open({
      scope: scope,
      template: 'insert_asset_dialog',
      ignoreEnter: true
    }).promise.then(function (assets) {
      if (_.isEmpty(assets)) { return; }
      var links = _.map(assets, makeLocalizedAssetLink).join(' ');
      cb(links);
    });

    function makeLocalizedAssetLink(asset) {
      return _makeAssetLink(asset, localeCode, defaultLocaleCode);
    }
  }

  function _makeAssetLink(asset, localeCode, defaultLocaleCode) {
    var file  = dotty.get(asset, 'data.fields.file', {});
    var title = dotty.get(asset, 'data.fields.title', {});
    file = file[localeCode] || file[defaultLocaleCode] || _.first(file);
    title = title[localeCode] || file[defaultLocaleCode] || _.first(title);

    if (title && file && file.url) {
      return '![' + title + '](' + assetUrl(file.url) + ')';
    } else {
      return '';
    }
  }

  function special(cb) {
    var modalScope = $rootScope.$new();
    modalScope.specialCharacters = specialCharacters;
    modalScope.model = { choice: _.first(specialCharacters) };
    modalScope.entity = function (x) { return '&' + x.id + ';'; };

    modalDialog.open({
      scope: modalScope,
      template: 'insert_special_character_dialog',
      ignoreEnter: true
    }).promise.then(cb);
  }

  function table(cb) {
    var modalScope = $rootScope.$new();
    modalScope.model = { rows: 2, cols: 2, width: 10 };

    modalDialog.open({
      scope: modalScope,
      template: 'insert_table_dialog',
      ignoreEnter: true
    }).promise.then(cb);
  }

  function embed(cb) {
    var modalScope = _.extend($rootScope.$new(), {
      fieldData: { value: '' },
      urlStatus: 'invalid'
    });

    LazyLoader.get('embedly');

    modalDialog.open({
      scope: modalScope,
      template: 'embed_external_content_dialog',
      ignoreEnter: true
    }).promise.then(function (data) {
        cb(makeEmbedlyLink(data.value));
    });
  }

  function makeEmbedlyLink(url) {
    return '<a href="' + url + '" class="embedly-card">Embedded content: ' + url + '</a>';
  }
}]);
