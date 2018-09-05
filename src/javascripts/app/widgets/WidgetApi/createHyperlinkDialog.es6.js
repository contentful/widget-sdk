import modalDialog from 'modalDialog';

const DEFAULT_VALUE = { href: 'https://', text: '', title: '' };

/**
 * Opens a dialog for the user to construct a link and returns the
 * relevant properties.
 *
 * @param {string?} options.value.href
 * @param {string?} options.value.text
 * @param {string?} options.value.title
 * @param {boolean} options.showTextInput
 * @returns {Promise<{url: string, text: string, title: string?}>}
 */
export default function({ showTextInput, value = {} }) {
  const component = 'app/widgets/WidgetApi/HyperlinkDialog.es6';
  const template = `<react-component class="modal-background" name="${component}" props="props" />`;
  const props = {
    labels: {
      title: value.href ? 'Edit link' : 'Insert link'
    },
    value: { ...DEFAULT_VALUE, ...value },
    hideText: !showTextInput,
    onConfirm: value => dialog.confirm(value),
    onCancel: () => dialog.cancel()
  };
  const dialog = modalDialog.open({ template, scopeData: { props } });
  return dialog.promise;
}
