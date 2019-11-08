import React from 'react';
import { Notification } from '@contentful/forma-36-react-components';
import { getCurrentStateName } from 'states/Navigator.es6';
import { defaults, isObject, get, mapValues } from 'lodash';
import { fileNameToTitle, truncate } from 'utils/StringUtils.es6';
import { trackMarkdownEditorAction } from 'analytics/MarkdownEditorActions';
import { track } from 'analytics/Analytics';
import * as entitySelector from 'search/EntitySelector/entitySelector.es6';
import * as BulkAssetsCreator from 'services/BulkAssetsCreator.es6';
import * as AssetUrlService from 'services/AssetUrlService.es6';
import LinkOrganizer from './linkOrganizer.es6';
import { getModule } from 'NgRegistry.es6';
import * as ModalLauncher from 'app/common/ModalLauncher.es6';
import InsertLinkModal from './components/InsertLinkModal';
import FormatingHelpModal from './components/FormatingHelpModal';
import InsertCharacterModal from './components/InsertCharacterModal';
import EmbedExternalContentModal from './components/EmbedExternalContentModal';

export function create(editor, locale, defaultLocaleCode, { zen }) {
  const modalDialog = getModule('modalDialog');

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

  return mapValues(defaults(advancedActions, editor.actions), (handler, action) => (...args) => {
    trackMarkdownEditorAction(action, { fullscreen: zen });
    return handler(...args);
  });

  async function link() {
    editor.usePrimarySelection();
    const selectedText = editor.getSelectedText();
    const modalKey = Date.now();
    const result = await ModalLauncher.open(({ isShown, onClose }) => (
      <InsertLinkModal
        selectedText={selectedText}
        isShown={isShown}
        onClose={onClose}
        key={modalKey}
      />
    ));
    if (result) {
      editor.actions.link(result.url, selectedText || result.text, result.title);
    }
  }

  function existingAssets() {
    entitySelector
      .openFromField({
        type: 'Array',
        itemLinkType: 'Asset',
        locale: localeCode
      })
      .then(assets => _insertAssetLinks(assets))
      .finally(editor.getWrapper().focus);
  }

  function newAssets() {
    // Disable editor and remember cursor position as the user can still
    // select text (and therefore chagne cursor position) while disabled.
    const wrapper = editor.getWrapper();
    wrapper.focus();
    const cursor = wrapper.getCursor();
    wrapper.disable();

    BulkAssetsCreator.open(localeCode)
      .then(assetObjects => {
        return BulkAssetsCreator.tryToPublishProcessingAssets(assetObjects).then(result => {
          const { publishedAssets, unpublishableAssets } = result;
          if (publishedAssets.length && !unpublishableAssets.length) {
            Notification.success(
              (publishedAssets.length === 1
                ? 'The asset was'
                : `All ${publishedAssets.length} assets were`) + ' just published'
            );
          } else if (unpublishableAssets.length) {
            Notification.error(
              `Failed to publish ${
              unpublishableAssets.length === 1
                ? 'the asset'
                : `${unpublishableAssets.length} assets`
              }`
            );
          }
          wrapper.setCursor(cursor);
          _insertAssetLinks(publishedAssets.map(({ data }) => data));
        });
      })
      .catch(() => {
        wrapper.setCursor(cursor);
      })
      .finally(() => {
        wrapper.enable();
        wrapper.focus();
      });
  }

  function _insertAssetLinks(assets) {
    // check whether do we have some assets, which don't have
    // a version in this field's locale
    const otherLocales = assets.filter(asset => {
      return !get(asset, ['fields', 'file', translationLocaleCode]);
    });

    const linksWithMeta = assets
      .map(_makeAssetLink)
      // remove empty links
      .filter(Boolean);
    const links = linksWithMeta.map(({ link }) => link).join(' ');

    // if there have values from fallback/default locales, we need to
    // provide user a warning so we show him modal
    if (otherLocales.length > 0) {
      const text = linksWithMeta
        // we don't want to warn about normally localized files
        .filter(({ isLocalized }) => !isLocalized)
        .map(({ title, isFallback, asset }) => {
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

      return modalDialog
        .open({
          template: 'markdown_insert_link_confirmation',
          scopeData: {
            number: otherLocales.length,
            text,
            // which locale we are trying to use
            locale: translationLocaleCode
          }
        })
        .promise.then(() => {
          editor.insert(links);
        })
        .catch(() => { });
    } else {
      editor.insert(links);
      return Promise.resolve();
    }
  }

  function _makeAssetLink(asset) {
    const localizedFile = get(asset, ['fields', 'file', localeCode]);
    const fallbackFile = fallbackCode ? get(asset, ['fields', 'file', fallbackCode]) : null;
    const defaultFile = get(asset, ['fields', 'file', defaultLocaleCode]);
    const file = localizedFile || fallbackFile || defaultFile;

    if (isObject(file) && file.url) {
      const title =
        get(asset, ['fields', 'title', localeCode]) ||
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
        link: `![${title}](${AssetUrlService.transformHostname(file.url)})`
      };
    } else {
      return null;
    }
  }

  async function special() {
    const modalKey = Date.now();
    const result = await ModalLauncher.open(({ isShown, onClose }) => (
      <InsertCharacterModal isShown={isShown} onClose={onClose} key={modalKey} />
    ));
    if (result) {
      editor.insert(result);
    }
  }

  function table() {
    modalDialog
      .open({
        scopeData: { model: { rows: 2, cols: 2 } },
        template: 'markdown_table_dialog'
      })
      .promise.then(editor.actions.table);
  }

  async function embed() {
    const modalKey = Date.now();
    const result = await ModalLauncher.open(({ isShown, onClose }) => (
      <EmbedExternalContentModal isShown={isShown} onClose={onClose} key={modalKey} />
    ));
    if (result) {
      editor.insert(result);
    }
  }

  function organizeLinks() {
    let text = editor.getContent();
    text = LinkOrganizer.convertInlineToRef(text);
    text = LinkOrganizer.rewriteRefs(text);
    editor.setContent(text);
    Notification.success('All your links are now references at the bottom of your document.');
  }

  function openHelp() {
    track('element:click', {
      elementId: 'markdown_help_dialog',
      groupId: 'editors_authors_help',
      fromState: getCurrentStateName()
    });
    ModalLauncher.open(({ isShown, onClose }) => (
      <FormatingHelpModal isShown={isShown} onClose={onClose} />
    ));
  }
}
