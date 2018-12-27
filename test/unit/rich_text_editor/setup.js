import * as sinon from 'test/helpers/sinon';
import { noop } from 'lodash';

export const ENTRY = {
  sys: {
    type: 'Entry',
    id: 'testid2',
    contentType: {
      sys: {
        id: 'ct-id'
      }
    }
  }
};

export const CONTENT_TYPE_DATA_OBJECT = {
  data: {
    name: 'content-type-name'
  }
};

export const getMockedSpaceContext = ({
  selectedEntity = ENTRY,
  contentType = CONTENT_TYPE_DATA_OBJECT,
  thumbnail = null
}) => {
  return {
    space: {
      getEntry: sinon.spy(() => Promise.resolve({ data: selectedEntity })),
      getContentType: sinon.spy(() => Promise.resolve(contentType))
    },
    entryImage: sinon.spy(() => Promise.resolve(thumbnail)),
    entryTitle: sinon.spy(() => 'entry-title'),
    entityDescription: sinon.spy(() => 'entry-description')
  };
};

export const stubAll = async ({ isolatedSystem, angularStubs = {} }) => {
  // TODO: Instead of stubbing all kind of services, stub `buildWidgetApi.es6`!
  isolatedSystem.set('ui/cf/thumbnailHelpers.es6', {});
  isolatedSystem.set('search/EntitySelector/Config.es6', {
    newConfigFromRichTextField: sinon.stub().returns({})
  });
  isolatedSystem.set('app/widgets/WidgetApi/dialogs/HyperlinkDialog.es6', {
    LINK_TYPES: {}
  });
  isolatedSystem.set('utils/LaunchDarkly', {
    onFeatureFlag: sinon.stub()
  });
  isolatedSystem.set('detect-browser', {
    detect: () => ({ name: 'chrome' })
  });

  const getModuleStub = sinon.stub();
  getModuleStub
    .withArgs('spaceContext')
    .returns({})
    .withArgs('modalDialog')
    .returns({ open: sinon.stub() })
    .withArgs('$rootScope')
    .returns({ $on: sinon.spy(() => noop) })
    .withArgs('$location')
    .returns({ absUrl: () => 'abs-url' })
    .withArgs('navigation/SlideInNavigator')
    .returns({
      goToSlideInEntity: sinon.stub()
    });

  Object.entries(angularStubs).forEach(([name, stub]) => {
    getModuleStub.withArgs(name).returns(stub);
  });

  isolatedSystem.set('NgRegistry.es6', {
    getModule: getModuleStub
  });
};

export const setupWidgetApi = (mockApi, mockDocument) => {
  const widgetApi = mockApi.create();
  widgetApi.fieldProperties.isDisabled$.set(false);
  widgetApi.fieldProperties.value$.set(mockDocument);

  return widgetApi;
};

export const createSandbox = window => {
  const el = window.document.createElement('div');
  el.className = 'sticky-parent';
  window.document.body.appendChild(el);
  return el;
};
