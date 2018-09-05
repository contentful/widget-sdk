import { BLOCKS, INLINES } from '@contentful/structured-text-types';
import { haveInlines } from '../shared/UtilHave.es6';

const { HYPERLINK } = INLINES;

/**
 * Returns whether or not the current value selection would allow for a user
 * edit on a hyperlink.
 *
 * @param {slate.Value} value
 * @returns {boolean}
 */
export function mayEditLink(value) {
  return !value.isExpanded && haveInlines({ value }, HYPERLINK);
}

/**
 * Allows the user to insert/remove a link depending on whether the current
 * selection has a link or not. If there is no link, a dialog is shown for
 * the user.
 *
 * @param {slate.Change} change Will be mutated with the required operations.
 * @returns {Promise<void>}
 */
export async function toggleLink(change, createHyperlinkDialog) {
  if (haveInlines(change, HYPERLINK)) {
    removeLink(change);
  } else {
    await insertLink(change, createHyperlinkDialog);
  }
}

async function insertLink(change, createHyperlinkDialog) {
  const showTextInput = !change.value.isExpanded || change.value.fragment.text.trim() === '';

  try {
    const { href: url, text, title } = await createHyperlinkDialog({ showTextInput });
    if (showTextInput) {
      if (change.value.blocks.last().isVoid) {
        change.insertBlock(BLOCKS.PARAGRAPH);
      }
      change.insertText(text).extend(0 - text.length);
    }
    change.call(wrapLink, { url, title });
  } catch (e) {
    if (e) throw e;
    // User cancelled dialog.
  }
  change.focus();
}

function removeLink(change) {
  change.unwrapInline(INLINES.HYPERLINK).focus();
}

/**
 * Allows the user to edit the first selected link of a given Change by showing
 * a dialog and applying the change.
 *
 * @param {slate.Change} change Will be mutated with the required operations.
 * @returns {Promise<void>}
 */
export async function editLink(change, createHyperlinkDialog) {
  const link = change.value.inlines.get(0);
  if (!link) {
    throw new Error('Change object contains no link to be edited.');
  }
  const { url: oldUrl, title: oldTitle } = link.data.toJSON();
  try {
    const { href: url, title } = await createHyperlinkDialog({
      showTextInput: false,
      value: { href: oldUrl, title: oldTitle }
    });
    change.setInlines({ data: { url, title } });
  } catch (e) {
    if (e) throw e;
    // User cancelled dialog.
  }
  change.focus();
}

function wrapLink(change, data) {
  change.wrapInline({
    type: HYPERLINK,
    data: data
  });
  change.moveToEnd();
}
