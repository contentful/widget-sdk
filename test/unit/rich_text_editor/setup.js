import * as sinon from 'helpers/sinon';
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

export const stubAll = async ({ isolatedSystem }) => {
  // TODO: Instead of stubbing all kind of services, stub `buildWidgetApi.es6`!
  isolatedSystem.set('ui/cf/thumbnailHelpers.es6', {});
  isolatedSystem.set('search/EntitySelector/Config.es6', {
    newConfigFromRichTextField: sinon.stub().returns({})
  });
  isolatedSystem.set('app/widgets/WidgetApi/dialogs/HyperlinkDialog.es6', {
    LINK_TYPES: {}
  });
  isolatedSystem.set('spaceContext', { default: {} });
  isolatedSystem.set('modalDialog', { open: sinon.stub() });
  isolatedSystem.set('$rootScope', {
    default: {
      $on: sinon.spy(() => noop)
    }
  });
  isolatedSystem.set('utils/LaunchDarkly', {
    onFeatureFlag: sinon.stub()
  });
  isolatedSystem.set('$location', {
    default: {
      absUrl: () => 'abs-url'
    }
  });
  isolatedSystem.set('navigation/SlideInNavigator', {
    goToSlideInEntity: sinon.stub()
  });
  isolatedSystem.set('search/config.es6', {});
};

export const setupWidgetApi = (mockApi, mockDocument) => {
  const widgetApi = mockApi.create();
  widgetApi.fieldProperties.isDisabled$.set(false);
  widgetApi.fieldProperties.value$.set(mockDocument);

  return widgetApi;
};

export const createSandbox = window => {
  const el = window.document.createElement('div');
  window.document.body.appendChild(el);
  return el;
};
