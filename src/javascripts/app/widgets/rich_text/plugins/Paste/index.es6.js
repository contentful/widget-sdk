import { actionOrigin } from '../shared/PluginApi.es6';
import { getCharacterCount } from './Paste.es6';

/**
 * This plugin tracks the character count before and after a paste event,
 * including the text selected during the event. This creates parity with our
 * tracking for the markdown editor.
 */
export const PastePlugin = ({ richTextAPI: { logAction } }) => ({
  onPaste(_event, editor, next) {
    const characterCountSelection = global.getSelection().toString().length;
    const characterCountBefore = getCharacterCount(editor);
    setTimeout(() => {
      const characterCountAfter = getCharacterCount(editor);
      logAction('paste', {
        characterCountAfter,
        characterCountBefore,
        characterCountSelection,
        origin: actionOrigin.SHORTCUT
      });
    });
    return next();
  }
});
