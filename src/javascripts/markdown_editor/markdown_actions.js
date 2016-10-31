'use strict';

angular.module('contentful').factory('MarkdownEditor/actions', ['require', function (require) {

  var modalDialog = require('modalDialog');
  var assetUrl = require('$filter')('assetUrl');
  var specialCharacters = require('MarkdownEditor/specialCharacters');
  var LinkOrganizer = require('LinkOrganizer');
  var notification = require('notification');
  var entitySelector = require('entitySelector');

  return { for: prepareActions };

  function prepareActions (editor, localeCode) {

    var advancedActions = {
      link: link,
      asset: asset,
      special: special,
      table: table,
      embed: embed,
      organizeLinks: organizeLinks,
      openHelp: openHelp
    };

    return _.defaults(advancedActions, editor.actions);

    function link () {
      modalDialog.open({
        scopeData: {
          model: {
            url: 'https://',
            title: editor.getSelectedText()
          }
        },
        template: 'markdown_link_dialog'
      }).promise.then(function (data) {
        editor.actions.link(data.url, data.title);
      });
    }

    function asset () {
      entitySelector.open({
        type: 'Array',
        itemLinkType: 'Asset',
        locale: localeCode
      })
      .then(function (assets) {
        if (Array.isArray(assets) && !_.isEmpty(assets)) {
          var links = _.map(assets, _makeAssetLink).join(' ');
          editor.insert(links);
        }
      });
    }

    function _makeAssetLink (asset) {
      var title = dotty.get(asset, ['fields', 'title', localeCode]);
      var file = dotty.get(asset, ['fields', 'file', localeCode]);

      if (title && _.isObject(file) && file.url) {
        return '![' + title + '](' + assetUrl(file.url) + ')';
      } else {
        return '';
      }
    }

    function special () {
      var scopeData = {
        specialCharacters: specialCharacters,
        model: { choice: _.first(specialCharacters) },
        entity: function (x) { return '&' + x.id + ';'; }
      };

      modalDialog.open({
        scopeData: scopeData,
        template: 'markdown_special_character_dialog'
      }).promise.then(editor.insert);
    }

    function table () {
      modalDialog.open({
        scopeData: { model: { rows: 2, cols: 2 } },
        template: 'markdown_table_dialog'
      }).promise.then(editor.actions.table);
    }

    function embed () {
      modalDialog.open({
        scopeData: {
          model: { value: 'https://', width: { px: 600, percent: 100 }, widthSuffix: 'percent' },
          urlStatus: 'invalid'
        },
        template: 'markdown_embed_dialog'
      }).promise.then(function (data) {
        editor.insert(_makeEmbedlyLink(data));
      });
    }

    function _makeEmbedlyLink (data) {
      var s = { percent: '%', px: 'px' };
      return [
        '<a href="' + data.value + '" class="embedly-card" ',
        'data-card-width="' + data.width[data.widthSuffix] + s[data.widthSuffix] + '" ',
        'data-card-controls="' + (data.social ? '1' : '0') + '"',
        '>Embedded content: ' + data.value + '</a>'
      ].join('');
    }

    function organizeLinks () {
      var text = editor.getContent();
      text = LinkOrganizer.convertInlineToRef(text);
      text = LinkOrganizer.rewriteRefs(text);
      editor.setContent(text);
      notification.info('All your links are now references at the bottom of your document.');
    }

    function openHelp () {
      modalDialog.open({
        template: 'markdown_help_dialog'
      });
    }
  }
}]);
