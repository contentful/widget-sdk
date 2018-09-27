import { BLOCKS, INLINES } from '@contentful/structured-text-types';
import { haveInlines } from '../shared/UtilHave.es6';

const { HYPERLINK, ENTRY_HYPERLINK, ASSET_HYPERLINK } = INLINES;
const HYPERLINK_TYPES = [HYPERLINK, ENTRY_HYPERLINK, ASSET_HYPERLINK];

/**
 * Returns whether or not the current value selection would allow for a user
 * edit on a hyperlink.
 *
 * @param {slate.Value} value
 * @returns {boolean}
 */
export function mayEditLink(value) {
  return !value.isExpanded && hasHyperlink(value);
}

/**
 * Returns whether the given value has any hyperlink node.
 *
 * @param {slate.Value} value
 * @returns {boolean}
 */
export function hasHyperlink(value) {
  return HYPERLINK_TYPES.some(type => haveInlines({ value }, type));
}

/**
 * Returns whether the given value has any inline node other than hyperlinks.
 *
 * @export
 * @param {slate.Value} value
 * @returns {boolean}
 */
export function hasNonHyperlinkInlines(value) {
  return value.inlines.some(inline => !HYPERLINK_TYPES.includes(inline.type));
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
  if (hasHyperlink(change.value)) {
    removeLink(change);
  } else {
    await insertLink(change, createHyperlinkDialog);
  }
}

async function insertLink(change, createHyperlinkDialog) {
  const showTextInput = !change.value.isExpanded || change.value.fragment.text.trim() === '';
  try {
    const { text, type, uri, target } = await createHyperlinkDialog({ showTextInput });
    if (showTextInput) {
      if (change.value.blocks.last().isVoid) {
        change.insertBlock(BLOCKS.PARAGRAPH);
      }
      change.insertText(text).extend(0 - text.length);
    }
    const data = target ? { target } : { uri };
    change.call(wrapLink, type, data);
  } catch (e) {
    if (e) throw e;
    // User cancelled dialog.
  }
  change.focus();
}

function removeLink(change) {
  HYPERLINK_TYPES.forEach(type => change.unwrapInline(type));
  change.focus();
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
  const { uri: oldUri, target: oldTarget } = link.data.toJSON();
  try {
    const { type, uri, target } = await createHyperlinkDialog({
      showTextInput: false,
      value: oldTarget ? { target: oldTarget } : { uri: oldUri }
    });
    const nodeType = linkTypeToNodeType(type);
    const data = target ? { target } : { uri };
    change.setInlines({ type: nodeType, data });
  } catch (e) {
    if (e) throw e;
    // User cancelled dialog.
  }
  change.focus();
}

function wrapLink(change, linkType, data) {
  change.wrapInline({
    type: linkTypeToNodeType(linkType),
    data: data
  });
  change.moveToEnd();
}

function linkTypeToNodeType(linkType) {
  switch (linkType) {
    case 'Entry':
      return ENTRY_HYPERLINK;
    case 'Asset':
      return ASSET_HYPERLINK;
  }
  return HYPERLINK;
}
