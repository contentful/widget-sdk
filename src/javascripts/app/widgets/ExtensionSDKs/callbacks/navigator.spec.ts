import { WidgetNamespace } from '@contentful/widget-renderer';
import { createNavigatorCallbacks } from './navigator';

jest.mock('states/Navigator', () => ({
  ...jest.requireActual<{ go: () => void }>('states/Navigator'),
  go: jest.fn(),
}));

jest.mock('core/react-routing', () => {
  const original = jest.requireActual('core/react-routing');
  return {
    ...original,
    router: {
      ...original.router,
      navigate: jest.fn(),
    },
  };
});

jest.mock('navigation/SlideInNavigator/withPromise');
jest.mock('navigation/SlideInNavigator');

const SPACE_ID = 'spaceId';
const ENVIRONMENT_ID = 'environmentId';
const WIDGET_ID = 'widgetId';

function createSubject(namespace = WidgetNamespace.APP) {
  return createNavigatorCallbacks({
    spaceContext: {
      spaceId: SPACE_ID,
      environmentId: ENVIRONMENT_ID,
      isMaster: true,
    },
    widgetRef: {
      widgetId: WIDGET_ID,
      widgetNamespace: namespace,
    },
    isOnPageLocation: true,
  });
}

function testEntityNavigationMethod(entity, method, getDeps) {
  const route = entity.sys.type === 'Asset' ? 'assets' : 'entries';
  const params =
    entity.sys.type === 'Asset' ? { assetId: entity.sys.id } : { entryId: entity.sys.id };

  describe(method, () => {
    let subject, Navigator;
    beforeEach(() => {
      ({ subject, Navigator } = getDeps());
    });
    it('navigates without slide in', () => {
      subject[method](entity);

      expect(Navigator.go).toBeCalledWith(
        expect.objectContaining({
          path: ['spaces', 'detail', route, 'detail'],
          params: expect.objectContaining(params),
        })
      );
    });
    it('calls slide-in with promise', async () => {
      const SlideInNavigatorWithPromise = jest.requireMock(
        'navigation/SlideInNavigator/withPromise'
      );
      await subject[method](entity, { slideIn: { waitForClose: true } });

      expect(SlideInNavigatorWithPromise.goToSlideInEntityWithPromise).toBeCalledWith(
        expect.objectContaining({
          id: entity.sys.id,
          type: entity.sys.type,
        })
      );
    });
    it('calls slide-in without promise', async () => {
      const SlideInNavigator = jest.requireMock('navigation/SlideInNavigator');
      await subject[method](entity, { slideIn: true });

      expect(SlideInNavigator.goToSlideInEntity).toBeCalledWith(
        expect.objectContaining({
          id: entity.sys.id,
          type: entity.sys.type,
        })
      );
    });
  });
}

describe('navigator', () => {
  let subject, Navigator, SlideInNavigator, router;

  beforeEach(() => {
    subject = createSubject();
    Navigator = jest.requireMock('states/Navigator');
    SlideInNavigator = jest.requireMock('navigation/SlideInNavigator');
    ({ router } = jest.requireMock('core/react-routing'));
  });

  afterEach(() => {
    Navigator.go.mockReset();
  });

  describe('openAssetsList', () => {
    it('navigates to correct path', () => {
      subject.openAssetsList();

      expect(router.navigate).toHaveBeenCalledWith(
        { environmentId: 'environmentId', path: 'assets.list', spaceId: 'spaceId' },
        { notify: true }
      );
    });
  });

  describe('openEntriesList', () => {
    it('navigates to correct path', () => {
      subject.openEntriesList();

      expect(router.navigate).toHaveBeenCalledWith(
        { environmentId: 'environmentId', path: 'entries.list', spaceId: 'spaceId' },
        { notify: true }
      );
    });
  });

  testEntityNavigationMethod(
    {
      sys: {
        id: 'asset',
        type: 'Asset',
      },
    },
    'handleNewAsset',
    () => ({ subject, Navigator })
  );
  testEntityNavigationMethod(
    {
      sys: {
        id: 'asset',
        type: 'Asset',
      },
    },
    'openAsset',
    () => ({ subject, Navigator })
  );
  testEntityNavigationMethod(
    {
      sys: {
        id: 'entry',
        type: 'Entry',
      },
    },
    'handleNewEntry',
    () => ({ subject, Navigator })
  );
  testEntityNavigationMethod(
    {
      sys: {
        id: 'entry',
        type: 'Entry',
      },
    },
    'openEntry',
    () => ({ subject, Navigator })
  );

  describe('openAppConfig', () => {
    it('navigates to correct path', () => {
      subject.openAppConfig();

      expect(router.navigate).toBeCalledWith(
        {
          path: 'apps.app-configuration',
          spaceId: SPACE_ID,
          environmentId: ENVIRONMENT_ID,
          appId: WIDGET_ID,
        },
        {
          notify: true,
        }
      );
    });
    it('prevents navigation to extensions', async () => {
      const subject = createSubject(WidgetNamespace.EXTENSION);

      return expect(subject.openAppConfig).rejects.toEqual(
        new Error('Only apps can use the openAppConfig method')
      );
    });
  });

  describe('openCurrentAppPage', () => {
    it('navigates to correct path', async () => {
      const result = await subject.openCurrentAppPage({ path: '/path' });

      expect(router.navigate).toBeCalledWith(
        {
          path: 'apps.page',
          spaceId: SPACE_ID,
          environmentId: ENVIRONMENT_ID,
          appId: WIDGET_ID,
          pathname: '/path',
        },
        { notify: false }
      );

      expect(result.path).toEqual('/path');
    });

    it('prevents inconsistencies', async () => {
      await expect(() => subject.openCurrentAppPage({ path: 'invalid' })).rejects.toEqual(
        new Error('The `path` option must start with a slash!')
      );
      const subjectWithExtension = createSubject(WidgetNamespace.EXTENSION);
      await expect(() => subjectWithExtension.openCurrentAppPage()).rejects.toEqual(
        new Error('Cannot navigate between different widget types!')
      );
      // @ts-expect-error invalid namespace
      const subjectWithInvalidNamespace = createSubject('invalid');
      await expect(() => subjectWithInvalidNamespace.openCurrentAppPage()).rejects.toEqual(
        new Error('Cannot navigate between different widget types!')
      );
    });
  });

  describe('openPageExtension', () => {
    it('navigates to correct path', async () => {
      const subject = createSubject(WidgetNamespace.EXTENSION);
      const result = await subject.openPageExtension({ path: '/path' });

      expect(router.navigate).toBeCalledWith(
        {
          path: 'page-extension',
          spaceId: SPACE_ID,
          environmentId: ENVIRONMENT_ID,
          extensionId: WIDGET_ID,
          pathname: '/path',
        },
        { notify: false }
      );

      expect(result.path).toEqual('/path');
    });

    it('prevents inconsistencies', async () => {
      await expect(() => subject.openPageExtension()).rejects.toEqual(
        new Error('Cannot navigate between different widget types!')
      );
      const subjectWithExtension = createSubject(WidgetNamespace.EXTENSION);
      await expect(() =>
        subjectWithExtension.openPageExtension({ path: 'invalid' })
      ).rejects.toEqual(new Error('The `path` option must start with a slash!'));
      // @ts-expect-error invalid namespace
      const subjectWithInvalidNamespace = createSubject('invalid');
      await expect(() => subjectWithInvalidNamespace.openPageExtension()).rejects.toEqual(
        new Error('Cannot navigate between different widget types!')
      );
    });
  });

  describe('onSlideInNavigation', () => {
    it('subscribe to event', async () => {
      const unsubscribe = subject.onSlideInNavigation(() => {
        //noop
      });

      expect(SlideInNavigator.slideInStackEmitter.on).toBeCalled();

      unsubscribe();

      expect(SlideInNavigator.slideInStackEmitter.off).toBeCalled();
    });
  });

  describe('openBulkEditor', () => {
    it('calls correct path', async () => {
      const SlideInNavigator = jest.requireMock('navigation/SlideInNavigator');
      SlideInNavigator.getSlideInEntities = jest.fn().mockReturnValue([]);

      const result = await subject.openBulkEditor('entryId', {
        fieldId: 'field',
        locale: 'en',
        index: 0,
      });

      expect(result).toEqual({ navigated: true });
    });

    it('throws with another bulk editor open', async () => {
      const SlideInNavigator = jest.requireMock('navigation/SlideInNavigator');
      SlideInNavigator.getSlideInEntities = jest.fn().mockReturnValue([{ type: 'BulkEditor' }]);

      await expect(
        subject.openBulkEditor('entryId', {
          fieldId: 'field',
          locale: 'en',
          index: 0,
        })
      ).rejects.toEqual(new Error(`Can't open bulk editor when there is another bulk editor open`));
    });
  });
});
