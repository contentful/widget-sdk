import React from 'react';
import modalDialog from 'modalDialog';
import HyperlinkDialog from 'app/widgets/WidgetApi/dialogs/HyperlinkDialog.es6';
import WidgetAPIContext from '../WidgetApiContext.es6';
import { newConfigFromStructuredTextField } from 'search/EntitySelector/Config.es6';

const DEFAULT_VALUE = { uri: '', text: '' };

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
      title: isNew ? 'Insert link' : 'Edit link',
      confirm: isNew ? 'Insert link' : 'Update link'
    },
    value: { ...DEFAULT_VALUE, ...value },
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
    entitySelectorConfigs
  };
  const jsx = (
    <WidgetAPIContext.Provider value={{ widgetAPI }}>
      <HyperlinkDialog {...props} />
    </WidgetAPIContext.Provider>
  );
  dialog = modalDialog.open({
    template: `<react-component class="modal-background" jsx="jsx" props="props" />`,
    backgroundClose: true,
    ignoreEsc: true, // Ignore to allow ESC in search entity selector search.
    scopeData: {
      jsx,
      props: {}
    }
  });
  return dialog.promise;
}

async function newConfigsForField(field) {
  if (field.type === 'StructuredText' || field.type === 'RichText') {
    // TODO: Don't pass specific key if CT validation prohibits its type:
    const config = {};
    config.Entry = await newConfigFromStructuredTextField(field, 'entry-hyperlink');
    config.Asset = await newConfigFromStructuredTextField(field, 'asset-hyperlink');
    return config;
  }
  return {};
}
