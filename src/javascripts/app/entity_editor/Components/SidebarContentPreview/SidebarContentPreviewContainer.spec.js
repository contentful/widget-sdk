import React from 'react';
import Enzyme from 'enzyme';
import * as mockedSpaceContext from 'ng/spaceContext';
import * as mockedContentPreview from 'ng/contentPreview';
import SidebarContentPreviewContainer from './SidebarContentPreviewContainer.es6';

const contentPreviews = [
  {
    url: 'https://google.com/search?q={entry.fields.slug}',
    contentType: 'test',
    name: 'google',
    envId: 'id1'
  },
  {
    url: 'https://yandex.ru/search?q={entry.fields.slug}',
    contentType: 'test',
    name: 'yandex',
    envId: 'id2'
  }
];

const contentType = {
  name: 'test',
  fields: [
    { id: 'w4PyXdxgDmawF11G', type: 'Symbol', name: 'body' },
    { id: 'PYe6P1GMMpvIODFc', name: 'slug', type: 'Symbol' }
  ],
  sys: {
    id: 'contentTypeId123'
  }
};

const entry = {
  fields: {
    w4PyXdxgDmawF11G: {
      'en-US': 'bodyValue'
    },
    PYe6P1GMMpvIODFc: {
      'en-US': 'slugValue'
    }
  },
  sys: {
    id: '5GBHhk0T6MeQQuc0ms4w4I'
  }
};

describe('entity_editor/Components/SidebarContentPreviewContainer.es6', () => {
  beforeEach(() => {
    mockedSpaceContext.getData.mockImplementation(value => {
      if (value === 'spaceMembership.admin') {
        return true;
      }
    });
    mockedContentPreview.replaceVariablesInUrl.mockImplementation(url => {
      return new Promise(resolve => {
        resolve(url.replace(`{entry.fields.slug}`, 'VALUE'));
      });
    });
    mockedContentPreview.getForContentType.mockResolvedValue(contentPreviews);
    mockedContentPreview.getSelected.mockReturnValue(contentPreviews[0].envId);
  });
  afterEach(() => {
    mockedSpaceContext.getData.mockReset();
    mockedContentPreview.getForContentType.mockReset();
    mockedContentPreview.getSelected.mockReset();
    mockedContentPreview.replaceVariablesInUrl.mockReset();
  });

  it('getCompiledUrls should be called every time entry is updated', async () => {
    const initialProps = {
      entry: null,
      contentType,
      getDataForTracking: () => {}
    };
    const wrapper = await Enzyme.shallow(<SidebarContentPreviewContainer {...initialProps} />, {
      disableLifecycleMethods: true
    });

    await wrapper.instance().componentDidMount();

    expect(mockedContentPreview.getForContentType).toHaveBeenCalledWith(contentType.sys.id);
    expect(mockedContentPreview.getForContentType).toHaveBeenCalledTimes(1);
    expect(mockedContentPreview.getSelected).toHaveBeenCalledTimes(1);
    expect(mockedContentPreview.replaceVariablesInUrl).not.toHaveBeenCalled();

    wrapper.setProps({
      entry
    });

    await wrapper.instance().componentDidUpdate(initialProps);

    expect(mockedContentPreview.replaceVariablesInUrl).toHaveBeenCalledTimes(
      contentPreviews.length
    );
    expect(mockedContentPreview.replaceVariablesInUrl.mock.calls[0]).toEqual([
      contentPreviews[0].url,
      entry,
      contentType
    ]);
    expect(mockedContentPreview.getSelected).toHaveBeenCalledTimes(2);
    expect(wrapper.instance().state.contentPreviews).toEqual(
      contentPreviews.map(item => ({
        ...item,
        compiledUrl: item.url.replace(`{entry.fields.slug}`, 'VALUE')
      }))
    );
  });
});
