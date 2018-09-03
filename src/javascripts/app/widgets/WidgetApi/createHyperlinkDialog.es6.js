import modalDialog from 'modalDialog';
import { pickBy, identity } from 'lodash';

const DEFAULT_VALUE = { url: 'https://', text: '', title: '' };

/**
 * Opens a dialog for the user to construct a link and returns the
 * relevant properties.
 *
 * TODO: Add to `widgetApi` and inject rather than relying on `modalDialog` here.
 *
 * @param {string?} options.value.url
 * @param {string?} options.value.text
 * @param {string?} options.value.title
 * @param {boolean} options.showTextInput
 * @returns {Promise<{url: string, text: string, title: string?}>}
 */
export default function({ showTextInput, value = {} }) {
  return modalDialog
    .open({
      scopeData: {
        showLinkTextInput: showTextInput,
        editLink: !!value.url,
        model: { ...DEFAULT_VALUE, ...value }
      },
      template: 'markdown_link_dialog'
    })
    .promise.then(data => pickBy(data, identity));
}
