import React from 'react';
import { INLINES } from '@contentful/rich-text-types';
import HyperlinkDialog, { LINK_TYPES } from 'app/widgets/WidgetApi/dialogs/HyperlinkDialog';
import WidgetAPIContext from '../WidgetApiContext';
import ModalLauncher from 'app/common/ModalLauncher';
import { newConfigFromRichTextField } from 'search/EntitySelector/Config';
import { isNodeTypeEnabled } from 'app/widgets/rich_text/validations/index';

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
  const entitySelectorConfigs = await newConfigsForField(widgetAPI.field);
  const isNew = !(value.uri || value.target);
  const props = {
    labels: {
      title: isNew ? 'Insert hyperlink' : 'Edit hyperlink',
      confirm: isNew ? 'Insert' : 'Update'
    },
    value,
    hideText: !showTextInput,
    entitySelectorConfigs,
    allowedHyperlinkTypes: getAllowedHyperlinkTypes(widgetAPI.field)
  };

  return new Promise((resolve, reject) => {
    ModalLauncher.open(({ isShown, onClose }) => (
      <WidgetAPIContext.Provider value={{ widgetAPI }}>
        <HyperlinkDialog
          {...props}
          isShown={isShown}
          onConfirm={value => {
            onClose(value);
          }}
          onCancel={() => {
            onClose(null);
          }}
        />
      </WidgetAPIContext.Provider>
    )).then(value => {
      if (value === null) {
        reject();
      } else {
        resolve(value);
      }
    });
  });
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
