import modalDialog from 'modalDialog';
import { newConfigFromStructuredTextField } from 'search/EntitySelector/Config.es6';

const DEFAULT_VALUE = { uri: 'https://', text: '' };

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
export default async function({ value = {}, showTextInput, field }) {
  const entitySelectorConfigs = await newConfigsForField(field);
  const component = 'app/widgets/WidgetApi/HyperlinkDialog.es6';
  const template = `<react-component class="modal-background" name="${component}" props="props" />`;
  const isNew = !(value.uri || value.target);

  const dialog = modalDialog.open({
    template,
    backgroundClose: true,
    ignoreEsc: true, // Ignore to allow ESC in search entity selector search.
    scopeData: {
      props: {
        labels: {
          title: isNew ? 'Insert link' : 'Edit link',
          confirm: isNew ? 'Insert link' : 'Update link'
        },
        value: { ...DEFAULT_VALUE, ...value },
        hideText: !showTextInput,
        onConfirm: value => dialog.confirm(value),
        onCancel: () => dialog.cancel(),
        entitySelectorConfigs
      }
    }
  });
  return dialog.promise;
}

async function newConfigsForField(field) {
  if (field.type === 'StructuredText') {
    // TODO: Don't pass specific key if CT validation prohibits its type:
    const config = {};
    config.Entry = await newConfigFromStructuredTextField(field, 'entry-hyperlink');
    config.Asset = await newConfigFromStructuredTextField(field, 'asset-hyperlink');
    return config;
  }
  return {};
}
