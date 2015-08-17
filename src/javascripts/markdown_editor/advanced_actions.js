'use strict';

angular.module('contentful').factory('MarkdownEditor/advancedActions', ['$injector', function ($injector) {

  var $rootScope        = $injector.get('$rootScope');
  var modalDialog       = $injector.get('modalDialog');
  var specialCharacters = $injector.get('specialCharacters');
  var LinkOrganizer     = $injector.get('LinkOrganizer');
  var assetUrl          = $injector.get('$filter')('assetUrl');
  var spaceContext      = $injector.get('spaceContext');

  return {
    link: link,
    asset: asset,
    special: special,
    table: table,
    embed: embed,
    organizeLinks: organizeLinks
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

  function asset(localeCode, cb) {
    modalDialog.open({
      scope: $rootScope.$new(),
      template: 'insert_asset_dialog',
      ignoreEnter: true
    }).promise.then(function (assets) {
      if (_.isEmpty(assets)) { return; }
      var links = _.map(assets, makeLocalizedAssetLink).join(' ');
      cb(links);
    });

    function makeLocalizedAssetLink(asset) {
      return _makeAssetLink(asset, localeCode);
    }
  }

  function _makeAssetLink(asset, localeCode) {
    try {
      // "localizedField" may throw TypeError
      var title = spaceContext.localizedField(asset, 'data.fields.title', localeCode);
      var file = spaceContext.localizedField(asset, 'data.fields.file', localeCode);
      if (title && file && file.url) {
        return '![' + title + '](' + assetUrl(file.url) + ')';
      }
    } catch (e) {}

    return '';
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

    modalDialog.open({
      scope: modalScope,
      template: 'embed_external_content_dialog',
      ignoreEnter: true
    }).promise.then(function (data) {
        cb(_makeEmbedlyLink(data.value));
    });
  }

  function _makeEmbedlyLink(url) {
    return '<a href="' + url + '" class="embedly-card">Embedded content: ' + url + '</a>';
  }

  function organizeLinks(editor) {
    var text = editor.getContent();
    text = LinkOrganizer.convertInlineToRef(text);
    text = LinkOrganizer.rewriteRefs(text);
    editor.setContent(text);
  }
}]);
