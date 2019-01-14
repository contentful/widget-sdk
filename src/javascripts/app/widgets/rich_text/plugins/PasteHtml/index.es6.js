import { getEventTransfer } from 'slate-react';
import serializer from './Serializer.es6';

/**
 * The plugin allows to paste html to the Structured Text Editor
 * by deserializing html content from ClipboardEvent into
 * Slate document.
 */
export const PasteHtmlPlugin = () => {
  return {
    onPaste(event, editor, next) {
      const transfer = getEventTransfer(event);
      if (transfer.type !== 'html') {
        return next();
      }
      const { document } = serializer.deserialize(transfer.html);
      editor.insertFragment(document);
      return;
    }
  };
};
