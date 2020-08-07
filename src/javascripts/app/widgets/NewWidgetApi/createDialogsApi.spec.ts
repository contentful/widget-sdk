import { createDialogsApi } from './createDialogsApi';
import { DialogExtensionSDK } from 'contentful-ui-extensions-sdk';
import * as ExtensionDialogs from 'widgets/ExtensionDialogs';
import * as entitySelector from 'search/EntitySelector/entitySelector';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import { ModalLauncher } from 'core/components/ModalLauncher';
import { DialogsAPI } from 'contentful-ui-extensions-sdk';

jest.mock('core/components/ModalLauncher');
jest.mock('widgets/ExtensionDialogs');
jest.mock('search/EntitySelector/entitySelector');
jest.mock('widgets/CustomWidgetLoaderInstance');

const dialogSdk = {} as DialogExtensionSDK;

describe('createDialogsApi', () => {
  let dialogsApi: DialogsAPI;

  beforeEach(() => {
    dialogsApi = createDialogsApi(dialogSdk);
  });

  describe('openAlert', () => {
    it('calls the ExtensionDialogs method', () => {
      dialogsApi.openAlert({ title: 'alert', message: 'message' });
      expect(ExtensionDialogs.openAlert).toHaveBeenCalledWith({
        title: 'alert',
        message: 'message',
      });
    });
  });

  describe('openConfirm', () => {
    it('calls the ExtensionDialogs method', () => {
      dialogsApi.openConfirm({ title: 'alert', message: 'message' });
      expect(ExtensionDialogs.openConfirm).toHaveBeenCalledWith({
        title: 'alert',
        message: 'message',
      });
    });
  });

  describe('openPrompt', () => {
    it('calls the ExtensionDialogs method', () => {
      dialogsApi.openPrompt({ title: 'alert', message: 'message' });
      expect(ExtensionDialogs.openPrompt).toHaveBeenCalledWith({
        title: 'alert',
        message: 'message',
      });
    });
  });

  describe('selectSingleEntry', () => {
    it('calls entitySelector.openFromExtensionSingle with opts and entity: entry', () => {
      const opts = { locale: 'en-US' };
      dialogsApi.selectSingleEntry(opts);
      expect(entitySelector.openFromExtensionSingle).toHaveBeenCalledWith({
        ...opts,
        entityType: 'Entry',
      });
    });
  });

  describe('selectMultipleEntries', () => {
    it('calls entitySelector.openFromExtension with opts and entity: entry', () => {
      const opts = { locale: 'en-US' };
      dialogsApi.selectMultipleEntries(opts);
      expect(entitySelector.openFromExtension).toHaveBeenCalledWith({
        ...opts,
        entityType: 'Entry',
        multiple: true,
      });
    });
  });

  describe('selectSingleAsset', () => {
    it('calls entitySelector.openFromExtensionSingle with opts and entity: asset', () => {
      const opts = { locale: 'en-US' };
      dialogsApi.selectSingleAsset(opts);
      expect(entitySelector.openFromExtensionSingle).toHaveBeenCalledWith({
        ...opts,
        entityType: 'Asset',
      });
    });
  });

  describe('selectMultipleAssets', () => {
    it('calls entitySelector.openFromExtension with opts and entity: entry', () => {
      const opts = { locale: 'en-US', min: 1, max: 10 };
      dialogsApi.selectMultipleAssets(opts);
      expect(entitySelector.openFromExtension).toHaveBeenCalledWith({
        ...opts,
        entityType: 'Asset',
        multiple: true,
      });
    });
  });

  describe('openCurrent', () => {
    describe('when sdk contains an app id', () => {
      beforeEach(() => {
        dialogsApi = createDialogsApi({
          ...dialogSdk,
          ids: { app: 'app_id' },
        } as DialogExtensionSDK);
      });

      it('calls open current app', () => {
        const options = {};
        dialogsApi.openCurrentApp = jest.fn();
        dialogsApi.openCurrent(options);
        expect(dialogsApi.openCurrentApp).toHaveBeenCalledWith(options);
      });
    });

    describe('when sdk does not contain an app id', () => {
      beforeEach(() => {
        dialogsApi = createDialogsApi({
          ...dialogSdk,
          ids: {},
        } as DialogExtensionSDK);
      });

      it('calls open extension app', () => {
        const options = {};
        dialogsApi.openExtension = jest.fn();
        dialogsApi.openCurrent(options);
        expect(dialogsApi.openExtension).toHaveBeenCalledWith(options);
      });
    });
  });

  describe('openCurrentApp', () => {
    beforeEach(() => {
      (getCustomWidgetLoader as jest.Mock).mockReturnValueOnce({
        getOne: jest.fn(() => ({
          locations: [],
          hosting: {
            type: 'src',
          },
          parameters: {
            definitions: {
              installation: {},
            },
            values: {
              installation: {},
            },
          },
        })),
      });
      dialogsApi = createDialogsApi({
        ...dialogSdk,
        ids: { app: 'app_id' },
      } as DialogExtensionSDK);
    });

    it('Launches a modal', async () => {
      await dialogsApi.openCurrentApp({});
      expect(ModalLauncher.open).toHaveBeenCalled();
    });
  });

  describe('openExtension', () => {
    beforeEach(() => {
      (getCustomWidgetLoader as jest.Mock).mockReturnValueOnce({
        getOne: jest.fn(() => ({
          locations: [],
          hosting: {
            type: 'src',
          },
          parameters: {
            definitions: {
              installation: {},
            },
            values: {
              installation: {},
            },
          },
        })),
      });
      dialogsApi = createDialogsApi({
        ...dialogSdk,
        ids: { app: 'app_id' },
      } as DialogExtensionSDK);
    });

    it('Launches a modal', async () => {
      await dialogsApi.openExtension({ id: 'my_extension' });
      expect(ModalLauncher.open).toHaveBeenCalled();
    });
  });
});
