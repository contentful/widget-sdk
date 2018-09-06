import * as sinon from 'helpers/sinon';

export const stubAll = async ({ isolatedSystem, entities }) => {
  isolatedSystem.set('ui/cf/thumbnailHelpers.es6', {});
  isolatedSystem.set('spaceContext', {});
  isolatedSystem.set('modalDialog', { open: sinon.stub() });
  isolatedSystem.set('$rootScope', {
    default: {
      $on: sinon.stub()
    }
  });
  isolatedSystem.set('$location', {
    default: {
      absUrl: () => 'abs-url'
    }
  });
  isolatedSystem.set('navigation/SlideInNavigator', {
    goToSlideInEntity: sinon.stub()
  });
  isolatedSystem.set('entitySelector', {
    default: {
      openFromField: () => Promise.resolve(entities)
    }
  });
  isolatedSystem.set('app/widgets/structured_text/plugins/EntryLinkBlock/FetchEntry.es6', {
    default: ({ render }) => {
      return render({
        entry: this.entity,
        entryTitle: 'title',
        entryDescription: 'description',
        entryStatus: 'status',
        loading: { entry: false, thumbnail: true }
      });
    }
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
  window.document.body.appendChild(el);
  return el;
};
