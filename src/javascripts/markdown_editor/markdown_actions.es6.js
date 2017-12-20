import modalDialog from 'modalDialog';
import { default as assetUrl } from 'assetUrlFilter';
import specialCharacters from './markdown_special_characters';
import LinkOrganizer from 'LinkOrganizer';
import notification from 'notification';
import entitySelector from 'entitySelector';
import { defaults, isObject, get as getAtPath } from 'lodash';
import {track} from 'analytics/Analytics';
import $state from '$state';
import * as BulkAssetsCreator from 'services/BulkAssetsCreator';

export function create (editor, localeCode) {
  const advancedActions = {
    link: link,
    existingAssets: existingAssets,
    newAssets: newAssets,
    special: special,
    table: table,
    embed: embed,
    organizeLinks: organizeLinks,
    openHelp: openHelp
  };

  return defaults(advancedActions, editor.actions);

  function link () {
    editor.usePrimarySelection();
    const selectedText = editor.getSelectedText();
    modalDialog.open({
      scopeData: {
        showLinkTextInput: !selectedText,
        model: {
          url: 'https://'
        }
      },
      template: 'markdown_link_dialog'
    }).promise.then(({url, text, title}) => {
      editor.actions.link(url, selectedText || text, title);
    });
  }

  function existingAssets () {
    entitySelector.openFromField({
      type: 'Array',
      itemLinkType: 'Asset',
      locale: localeCode
    })
    .then((assets) => {
      _insertAssetLinks(assets);
    })
    .finally(editor.getWrapper().focus);
  }

  function newAssets () {
    // Disable editor and remember cursor position as the user can still
    // select text (and therefore chagne cursor position) while disabled.
    const wrapper = editor.getWrapper();
    wrapper.focus();
    const cursor = wrapper.getCursor();
    editor.getWrapper().disable();

    BulkAssetsCreator.open({ locale: localeCode }).then((assetObjects) => {
      BulkAssetsCreator.tryToPublishProcessingAssets(assetObjects)
      .then((result) => {
        const { publishedAssets, unpublishableAssets } = result;
        if (publishedAssets.length && !unpublishableAssets.length) {
          notification.info((publishedAssets.length === 1
            ? 'The asset was' : `All ${publishedAssets.length} assets were`) +
            ' just published');
        } else if (unpublishableAssets.length) {
          notification.warn(`Failed to publish ${unpublishableAssets.length === 1
            ? 'the asset' : `${unpublishableAssets.length} assets`}`);
        }
        wrapper.setCursor(cursor);
        _insertAssetLinks(publishedAssets.map(({data}) => data));
        wrapper.enable();
        wrapper.focus();
      });
    });
  }

  function _insertAssetLinks (assets) {
    const links = assets.map(_makeAssetLink).join(' ');
    editor.insert(links);
  }

  function _makeAssetLink (asset) {
    const title = getAtPath(asset, ['fields', 'title', localeCode]);
    const file = getAtPath(asset, ['fields', 'file', localeCode]);

    if (title && isObject(file) && file.url) {
      return '![' + title + '](' + assetUrl(file.url) + ')';
    } else {
      return '';
    }
  }

  function special () {
    const scopeData = {
      specialCharacters: specialCharacters,
      model: { choice: specialCharacters[0] },
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
    const s = { percent: '%', px: 'px' };
    return [
      '<a href="' + data.value + '" class="embedly-card" ',
      'data-card-width="' + data.width[data.widthSuffix] + s[data.widthSuffix] + '" ',
      'data-card-controls="' + (data.social ? '1' : '0') + '"',
      '>Embedded content: ' + data.value + '</a>'
    ].join('');
  }

  function organizeLinks () {
    let text = editor.getContent();
    text = LinkOrganizer.convertInlineToRef(text);
    text = LinkOrganizer.rewriteRefs(text);
    editor.setContent(text);
    notification.info('All your links are now references at the bottom of your document.');
  }

  function openHelp () {
    track('element:click', {
      elementId: 'markdown_help_dialog',
      groupId: 'editors_authors_help',
      fromState: $state.current.name
    });
    modalDialog.open({
      template: 'markdown_help_dialog'
    });
  }
}
