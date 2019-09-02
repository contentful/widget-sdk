import sinon from 'sinon';

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

export const stubAll = async ({ isolatedSystem }) => {
  // TODO: Instead of stubbing all kind of services, stub `buildWidgetApi.es6`!
  isolatedSystem.set('directives/thumbnailHelpers.es6', {});
  isolatedSystem.set('search/EntitySelector/Config.es6', {
    newConfigFromRichTextField: sinon.stub().returns({})
  });
  isolatedSystem.set('app/widgets/WidgetApi/dialogs/HyperlinkDialog.es6', {
    LINK_TYPES: {}
  });
  isolatedSystem.set('utils/LaunchDarkly/index.es6', {
    onFeatureFlag: sinon.stub(),
    getCurrentVariation: sinon.stub()
  });
  isolatedSystem.set('detect-browser', {
    detect: () => ({ name: 'chrome' })
  });

  isolatedSystem.set('access_control/AccessChecker/index.es6', {
    getSectionVisibility: sinon.stub().returns({
      asset: true,
      entry: true
    })
  });

  isolatedSystem.set('analytics/Analytics.es6', {
    track: sinon.stub()
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
