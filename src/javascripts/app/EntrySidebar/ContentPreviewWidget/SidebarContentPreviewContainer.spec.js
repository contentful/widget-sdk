import React from 'react';
import { mount } from 'enzyme';
import * as mockedSpaceContext from 'ng/spaceContext';
import * as mockedContentPreview from 'ng/contentPreview';

import flushPromises from '../../../../../test/helpers/flushPromises';
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

  it('compiles the preview URL only when the user clicks the open preview button', async () => {
    jest.useFakeTimers();
    window.open = jest.fn();
    const initialProps = {
      entry: null,
      contentType,
      dataForTracking: {
        locales: []
      }
    };
    const wrapper = mount(<SidebarContentPreviewContainer {...initialProps} />);

    await wrapper.instance().componentDidMount();

    expect(mockedContentPreview.replaceVariablesInUrl).not.toHaveBeenCalled();

    wrapper.setProps({
      entry
    });

    expect(mockedContentPreview.replaceVariablesInUrl).not.toHaveBeenCalled();

    wrapper.find('[data-test-id="open-preview"]').simulate('click');
    await flushPromises();

    expect(mockedContentPreview.replaceVariablesInUrl).toHaveBeenCalledTimes(1);
    expect(window.open).toHaveBeenCalledWith('https://google.com/search?q=VALUE');
  });
});
