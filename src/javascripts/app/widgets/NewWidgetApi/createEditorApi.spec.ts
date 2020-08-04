import { createEditorApi } from './createEditorApi';
import { EditorInterface } from 'contentful-ui-extensions-sdk';

describe('createEditorApi', () => {
  const editorInterface: EditorInterface = {
    sys: {},
  };
  let watchers: Function[] = [];
  const getLocaleData = jest.fn(() => ({
    activeLocals: [{ name: 'en-US', code: 'en-US' }],
    isSingleLocaleModeOn: true,
    focusedLocale: { name: 'en-US', code: 'en-US' },
  }));

  const showDisabledFields = true;
  const getPreferences = jest.fn(() => ({
    showDisabledFields,
  }));
  const unsubscribe = jest.fn();
  const watch = jest.fn((_getValue: any, cb: Function) => {
    watchers.push(cb);
    return unsubscribe;
  });
  let editorApi;
  beforeEach(() => {
    watchers = [];

    editorApi = createEditorApi({
      editorInterface,
      getLocaleData,
      getPreferences,
      watch,
    });
  });

  it('makes editorInterface available', () => {
    expect(editorApi.editorInterface).toEqual(editorInterface);
  });

  describe('onLocaleSettingsChanged', () => {
    it('sets up watchers', () => {
      editorApi.onLocaleSettingsChanged(jest.fn());
      expect(watch).toHaveBeenCalledTimes(3);
    });

    it('returns a cleanup function', () => {
      const clear = editorApi.onLocaleSettingsChanged(jest.fn());

      expect(unsubscribe).toHaveBeenCalledTimes(0);
      clear();
      expect(unsubscribe).toHaveBeenCalledTimes(3);
    });

    it('allows the passed in watch function to be called on changes', () => {
      const watcher = jest.fn();
      editorApi.onLocaleSettingsChanged(watcher);
      watchers.forEach(fn => fn());
      expect(watcher).toHaveBeenCalledWith({ focused: 'en-US', mode: 'single' });
    });
  });

  describe('onShowDisabledFieldsChanged', () => {
    it('sets up watchers', () => {
      editorApi.onShowDisabledFieldsChanged(jest.fn());
      expect(watch).toHaveBeenCalledTimes(1);
    });

    it('returns a cleanup function', () => {
      const clear = editorApi.onShowDisabledFieldsChanged(jest.fn());

      expect(unsubscribe).toHaveBeenCalledTimes(0);
      clear();
      expect(unsubscribe).toHaveBeenCalledTimes(1);
    });

    it('allows the passed in watch function to be called on changes', () => {
      const watcher = jest.fn();
      editorApi.onShowDisabledFieldsChanged(watcher);
      watchers.forEach(fn => fn());
      expect(watcher).toHaveBeenCalledWith(showDisabledFields);
    });
  });
});
