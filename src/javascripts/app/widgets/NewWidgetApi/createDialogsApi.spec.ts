import { createDialogsApi } from './createDialogsApi';
import { DialogExtensionSDK } from 'contentful-ui-extensions-sdk';
import * as ExtensionDialogs from 'widgets/ExtensionDialogs';
import * as entitySelector from 'search/EntitySelector/entitySelector';

jest.mock('widgets/ExtensionDialogs');
jest.mock('search/EntitySelector/entitySelector');

const dialogSdk = {} as DialogExtensionSDK;

describe('createDialogsApi', () => {
  let dialogsApi;

  beforeEach(() => {
    dialogsApi = createDialogsApi(dialogSdk);
  });

  describe('openAlert', () => {
    it('calls the ExtensionDialogs method', () => {
      dialogsApi.openAlert();
      expect(ExtensionDialogs.openAlert).toHaveBeenCalled();
    });
  });

  describe('openConfirm', () => {
    it('calls the ExtensionDialogs method', () => {
      dialogsApi.openConfirm();
      expect(ExtensionDialogs.openConfirm).toHaveBeenCalled();
    });
  });

  describe('openPrompt', () => {
    it('calls the ExtensionDialogs method', () => {
      dialogsApi.openPrompt();
      expect(ExtensionDialogs.openPrompt).toHaveBeenCalled();
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

  // TODO: finish this case
  // describe('openCurrentApp', () => {
  //   beforeEach(() => {
  //     jest.mock('Authentication', () => ({ getToken: () => '<TOKEN>' }));
  //     jest.mock('widgets/CustomWidgetLoaderInstance', () => ({
  //       getCustomWidgetLoader: jest.fn(() => ({
  //         getOne: jest.fn(),
  //       })),
  //     }));

  //     dialogsApi = createDialogsApi({
  //       ...dialogSdk,
  //       ids: { app: 'app_id' },
  //     } as DialogExtensionSDK);
  //   });
  //   it('returns a modal launcher...', async () => {
  //     const modalLauncher = await dialogsApi.openCurrentApp({});
  //     console.log(modalLauncher);
  //   });
  // });
});
