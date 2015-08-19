'use strict';

angular.module('contentful').factory('MarkdownEditor/actions', ['$injector', function ($injector) {

  var modalDialog       = $injector.get('modalDialog');
  var specialCharacters = $injector.get('specialCharacters');
  var LinkOrganizer     = $injector.get('LinkOrganizer');
  var assetUrl          = $injector.get('$filter')('assetUrl');
  var spaceContext      = $injector.get('spaceContext');

  return { for: prepareActions };

  function prepareActions(editor, localeCode) {

    var advancedActions = {
      link:          link,
      asset:         asset,
      special:       special,
      table:         table,
      embed:         embed,
      organizeLinks: organizeLinks,
      openHelp:      openHelp
    };

    return _.defaults(advancedActions, editor.actions);

    function link() {
      modalDialog.open({
        scopeData: { model: {} },
        template: 'insert_link_dialog',
        ignoreEnter: true
      }).promise.then(function (data) {
        editor.insert(_makeLink(data));
      });
    }

    function _makeLink(data) {
      if (data.title) {
        return '[' + data.title + '](' + data.url + ')';
      } else {
        return '<' + data.url + '>';
      }
    }

    function asset() {
      modalDialog.open({
        template: 'insert_asset_dialog',
        ignoreEnter: true
      }).promise.then(function (assets) {
        if (_.isEmpty(assets)) { return; }
        var links = _.map(assets, _makeAssetLink).join(' ');
        editor.insert(links);
      });
    }

    function _makeAssetLink(asset) {
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

    function special() {
      var scopeData = {
        specialCharacters: specialCharacters,
        model: { choice: _.first(specialCharacters) },
        entity: function (x) { return '&' + x.id + ';'; }
      };

      modalDialog.open({
        scopeData: scopeData,
        template: 'insert_special_character_dialog',
        ignoreEnter: true
      }).promise.then(editor.insert);
    }

    function table() {
      modalDialog.open({
        scopeData: { model: { rows: 2, cols: 2, width: 10 } },
        template: 'insert_table_dialog',
        ignoreEnter: true
      }).promise.then(editor.actions.table);
    }

    function embed() {
      modalDialog.open({
        scopeData: { fieldData: { value: '' }, urlStatus: 'invalid' },
        template: 'embed_external_content_dialog',
        ignoreEnter: true
      }).promise.then(function (data) {
        editor.insert(_makeEmbedlyLink(data.value));
      });
    }

    function _makeEmbedlyLink(url) {
      return '<a href="' + url + '" class="embedly-card">Embedded content: ' + url + '</a>';
    }

    function organizeLinks() {
      var text = editor.getContent();
      text = LinkOrganizer.convertInlineToRef(text);
      text = LinkOrganizer.rewriteRefs(text);
      editor.setContent(text);
    }

    function openHelp() {
      modalDialog.open({
        template: 'markdown_help_dialog',
        ignoreEnter: true
      });
    }
  }
}]);
