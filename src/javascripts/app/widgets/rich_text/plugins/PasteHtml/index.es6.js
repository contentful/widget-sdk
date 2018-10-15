import { getEventTransfer } from 'slate-react';
import serializer from './Serializer.es6';

/**
 * The plugin allows to paste html to the Structured Text Editor
 * by deserializing html content from ClipboardEvent into
 * Slate document.
 */
export const PasteHtmlPlugin = () => {
  return {
    onPaste(event, change) {
      const transfer = getEventTransfer(event);
      if (transfer.type != 'html') {
        return;
      }
      const { document } = serializer.deserialize(transfer.html);
      change.insertFragment(document);
      return true;
    }
  };
};
