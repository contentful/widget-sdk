import { PastePlugin } from './index.es6';
import * as pasteUtils from './Paste.es6';
import { actionOrigin } from '../shared/PluginApi.es6';

describe('Paste Plugin', () => {
  let editor;

  beforeEach(() => {
    jest.spyOn(pasteUtils, 'getCharacterCount');
    jest.useFakeTimers();

    // We can't mock getSelection with document.createRange() and friends
    // because Jest runs the tests with jsdom, which lacks a window object
    // and its associated BOM methods.
    global.getSelection = () => ({
      toString: () => 'x'.repeat(15)
    });

    editor = jest.fn();

    pasteUtils.getCharacterCount
      .mockImplementationOnce(arg => {
        if (arg === editor) {
          return 42;
        }
      })
      .mockImplementationOnce(arg => {
        if (arg === editor) {
          return 49;
        }
      });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('tracks pasted html', () => {
    const logAction = jest.fn();
    const plugin = PastePlugin({ richTextAPI: { logAction } });
    plugin.onPaste({}, {}, editor);
    expect(pasteUtils.getCharacterCount).toHaveBeenCalledTimes(1);
    expect(pasteUtils.getCharacterCount).lastCalledWith(editor);
    expect(logAction).toHaveBeenCalledTimes(0);
    jest.runOnlyPendingTimers();
    expect(pasteUtils.getCharacterCount).toHaveBeenCalledTimes(2);
    expect(pasteUtils.getCharacterCount).lastCalledWith(editor);
    expect(logAction).toHaveBeenCalledWith('paste', {
      characterCountAfter: 49,
      characterCountBefore: 42,
      characterCountSelection: 15,
      origin: actionOrigin.SHORTCUT
    });
  });
});
