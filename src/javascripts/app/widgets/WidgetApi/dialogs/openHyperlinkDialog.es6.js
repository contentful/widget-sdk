import React from 'react';
import { INLINES } from '@contentful/rich-text-types';
import HyperlinkDialog, { LINK_TYPES } from 'app/widgets/WidgetApi/dialogs/HyperlinkDialog.es6';
import WidgetAPIContext from '../WidgetApiContext.es6';
import { newConfigFromRichTextField } from 'search/EntitySelector/Config.es6';
import { isNodeTypeEnabled } from 'app/widgets/rich_text/validations/index.es6';
import { getModule } from 'NgRegistry.es6';

const modalDialog = getModule('modalDialog');

const nodeToHyperlinkType = {
  [INLINES.ENTRY_HYPERLINK]: LINK_TYPES.ENTRY,
  [INLINES.ASSET_HYPERLINK]: LINK_TYPES.ASSET,
  [INLINES.HYPERLINK]: LINK_TYPES.URI
};

/**
 * Opens a dialog for the user to construct a link and returns the relevant
 * properties. Can be used to edit an existing link by passing either `url`
 * or `target`.
 *
 * @param {Object} options.field Entry Field the dialog will be configured for.
 * @param {boolean?} options.showTextInput Hides the text field if `false`.
 * @param {string?} options.value.text
 * @param {string?} options.value.uri
 * @param {object?} options.value.target
 * @param {string?} options.value.type One of "uri", "Entry", "Asset".
 *  Will be overwritten accordingly if `url` or `target` are set.
 * @returns {Promise<{uri: string?, target: object?, text: string?}>}
 */
export default async function({ value = {}, showTextInput, widgetAPI }) {
  let dialog;
  const entitySelectorConfigs = await newConfigsForField(widgetAPI.field);
  const isNew = !(value.uri || value.target);
  const props = {
    labels: {
      title: isNew ? 'Insert hyperlink' : 'Edit hyperlink',
      confirm: isNew ? 'Insert' : 'Update'
    },
    value,
    hideText: !showTextInput,
    onConfirm: value => dialog.confirm(value),
    onCancel: () => {
      dialog.cancel();
      dialog = null;
    },
    onRender: () => {
      // TODO: Get rid of this hack to re-center modal dialog.
      dialog &&
        setTimeout(() => {
          dialog._centerOnBackground();
          // We apparently need this for the angular directive when
          // switching from link type URI to e.g. Entry or Asset:
          setTimeout(() => {
            dialog._centerOnBackground();
          }, 10);
        }, 0);
    },
    entitySelectorConfigs,
    allowedHyperlinkTypes: getAllowedHyperlinkTypes(widgetAPI.field)
  };
  const jsx = (
    <WidgetAPIContext.Provider value={{ widgetAPI }}>
      <HyperlinkDialog {...props} />
    </WidgetAPIContext.Provider>
  );
  dialog = modalDialog.open({
    template: `<react-component class="modal-background" jsx="jsx" props="props" />`,
    backgroundClose: true,
    disableAutoFocus: true,
    ignoreEsc: true, // Ignore to allow ESC in search entity selector search.
    scopeData: {
      jsx,
      props: {}
    }
  });
  return dialog.promise;
}

async function newConfigsForField(field) {
  const config = {};
  if (field.type === 'RichText') {
    // TODO: Don't pass specific key if CT validation prohibits its type:
    if (isNodeTypeEnabled(field, INLINES.ENTRY_HYPERLINK)) {
      config.Entry = await newConfigFromRichTextField(field, 'entry-hyperlink');
    }
    if (isNodeTypeEnabled(field, INLINES.ASSET_HYPERLINK)) {
      config.Asset = await newConfigFromRichTextField(field, 'asset-hyperlink');
    }
  }
  return config;
}

function getAllowedHyperlinkTypes(field) {
  const hyperlinkTypes = [INLINES.ENTRY_HYPERLINK, INLINES.ASSET_HYPERLINK, INLINES.HYPERLINK];
  if (field.type === 'RichText') {
    return hyperlinkTypes
      .filter(nodeType => isNodeTypeEnabled(field, nodeType))
      .map(nodeType => nodeToHyperlinkType[nodeType]);
  }

  return hyperlinkTypes;
}
