import modalDialog from 'modalDialog';

const DEFAULT_VALUE = { uri: 'https://', text: '' };

/**
 * Opens a dialog for the user to construct a link and returns the
 * relevant properties.
 *
 * @param {string?} options.value.uri
 * @param {string?} options.value.text
 * @param {boolean} options.showTextInput
 * @returns {Promise<{uri: string, text: string?}>}
 */
export default function({ showTextInput, value = {} }) {
  const component = 'app/widgets/WidgetApi/HyperlinkDialog.es6';
  const template = `<react-component class="modal-background" name="${component}" props="props" />`;
  const dialog = modalDialog.open({
    template,
    scopeData: {
      props: {
        labels: {
          title: value.uri ? 'Edit link' : 'Insert link'
        },
        value: { ...DEFAULT_VALUE, ...value },
        hideText: !showTextInput,
        onConfirm: value => dialog.confirm(value),
        onCancel: () => dialog.cancel()
      }
    }
  });
  return dialog.promise;
}
