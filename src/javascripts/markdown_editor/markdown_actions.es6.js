import modalDialog from 'modalDialog';
import assetUrl from 'assetUrlFilter';
import specialCharacters from './markdown_special_characters';
import LinkOrganizer from 'LinkOrganizer';
import notification from 'notification';
import entitySelector from 'entitySelector';
import {defaults, isObject, get, mapValues} from 'lodash';
import {fileNameToTitle, truncate} from 'stringUtils';
import {track} from 'analytics/Analytics';
import $state from '$state';
import * as BulkAssetsCreator from 'services/BulkAssetsCreator';

export function create (editor, locale, defaultLocaleCode, {zen}) {
  const {
    fallbackCode,
    internal_code: localeCode,
    // we need regular code in order to get correct
    // translations. Internal code might be different,
    // and in localized content property key is code,
    // not internal_code
    code: translationLocaleCode
  } = locale;

  const advancedActions = {
    link,
    existingAssets,
    newAssets,
    special,
    table,
    embed,
    organizeLinks,
    openHelp
  };


  return mapValues(
    defaults(advancedActions, editor.actions),
    (handler, action) => (...args) => {
      console.log(`${action} action (zen mode ${!!zen})`);
      return handler(...args);
    }
  );

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
      .then((assets) => _insertAssetLinks(assets))
      .finally(editor.getWrapper().focus);
  }

  function newAssets () {
    // Disable editor and remember cursor position as the user can still
    // select text (and therefore chagne cursor position) while disabled.
    const wrapper = editor.getWrapper();
    wrapper.focus();
    const cursor = wrapper.getCursor();
    editor.getWrapper().disable();

    BulkAssetsCreator.open(localeCode).then((assetObjects) => {
      BulkAssetsCreator.tryToPublishProcessingAssets(assetObjects)
        .then((result) => {
          const {publishedAssets, unpublishableAssets} = result;
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
    // check whether do we have some assets, which don't have
    // a version in this field's locale
    const otherLocales = assets.filter(asset => {
      return !get(asset, ['fields', 'file', translationLocaleCode]);
    });

    const linksWithMeta = assets
      .map(_makeAssetLink)
      // remove empty links
      .filter(Boolean);
    const links = linksWithMeta.map(({link}) => link).join(' ');

    // if there have values from fallback/default locales, we need to
    // provide user a warning so we show him modal
    if (otherLocales.length > 0) {
      const text = linksWithMeta
      // we don't want to warn about normally localized files
        .filter(({isLocalized}) => !isLocalized)
        .map(({title, isFallback, asset}) => {
          const localeText = isFallback
            ? `fallback locale (${fallbackCode})`
            : `default locale (${defaultLocaleCode})`;
          // we return an object instead of a line to avoid embedding HTML
          return {
            start: 'Link asset “',
            linkTitle: truncate(title, 30),
            end: `” in ${localeText}`,
            // will go to the assets editor
            link: `^.^.assets.detail({ assetId: "${asset.sys.id}" })`
          };
        });

      return modalDialog.open({
        template: 'markdown_insert_link_confirmation',
        scopeData: {
          number: otherLocales.length,
          text,
          // which locale we are trying to use
          locale: translationLocaleCode
        }
      }).promise.then(() => {
        editor.insert(links);
      }).catch(() => {
      });
    } else {
      editor.insert(links);
      return Promise.resolve();
    }
  }

  function _makeAssetLink (asset) {
    const localizedFile = get(asset, ['fields', 'file', localeCode]);
    const fallbackFile = fallbackCode ? get(asset, ['fields', 'file', fallbackCode]) : null;
    const defaultFile = get(asset, ['fields', 'file', defaultLocaleCode]);
    const file = localizedFile || fallbackFile || defaultFile;

    if (isObject(file) && file.url) {
      const title = get(asset, ['fields', 'title', localeCode]) ||
        get(asset, ['fields', 'title', fallbackCode]) ||
        get(asset, ['fields', 'title', defaultLocaleCode]) ||
        fileNameToTitle(file.fileName);

      return {
        title,
        asset,
        // is normally localized and we should not warn about this file
        isLocalized: Boolean(localizedFile),
        // was fallback value used
        // if it was not localized normally, and we did not used a fallback
        // it means we used a default locale - we filter empty values
        isFallback: Boolean(fallbackFile),
        link: `![${title}](${assetUrl(file.url)})`
      };
    } else {
      return null;
    }
  }

  function special () {
    const scopeData = {
      specialCharacters: specialCharacters,
      model: {choice: specialCharacters[0]},
      entity: function (x) {
        return '&' + x.id + ';';
      }
    };

    modalDialog.open({
      scopeData: scopeData,
      template: 'markdown_special_character_dialog'
    }).promise.then(editor.insert);
  }

  function table () {
    modalDialog.open({
      scopeData: {model: {rows: 2, cols: 2}},
      template: 'markdown_table_dialog'
    }).promise.then(editor.actions.table);
  }

  function embed () {
    modalDialog.open({
      scopeData: {
        model: {value: 'https://', width: {px: 600, percent: 100}, widthSuffix: 'percent'},
        urlStatus: 'invalid'
      },
      template: 'markdown_embed_dialog'
    }).promise.then(data => {
      editor.insert(_makeEmbedlyLink(data));
    });
  }

  function _makeEmbedlyLink (data) {
    const s = {percent: '%', px: 'px'};
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
