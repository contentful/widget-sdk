import { forEach } from 'lodash';
import React from 'react';
import Enzyme from 'enzyme';

import LinkEditor from './LinkEditor.es6';
import LinkingActions from './LinkingActions.es6';
import FetchedEntityCard from '../shared/FetchedEntityCard/index.es6';

const link = {
  sys: {
    id: 'LINK_ID',
    type: 'Link',
    linkType: 'Entry'
  }
};

jest.mock('../shared/FetchedEntityCard/index.es6', () => 'FetchedEntityCard', { virtual: true });

describe('LinkEditor', () => {
  function mount(customProps) {
    const props = {
      type: 'Entry',
      actions: {},
      contentTypes: [],
      ...customProps
    };
    return Enzyme.shallow(<LinkEditor {...props} />);
  }

  it('renders links', () => {
    const wrapper = mount({ value: [link] });
    expect(wrapper.find(FetchedEntityCard)).toHaveLength(1);
  });

  const linkingActionsVisibilityCases = {
    'without link': {
      props: { isSingle: false, value: [] },
      expectLinkingActions: true
    },
    'with links': {
      props: { isSingle: false, value: [link, link] },
      expectLinkingActions: true
    },
    'isSingle with link': {
      props: { isSingle: true, value: [link] },
      expectLinkingActions: false
    },
    'isSingle link without link': {
      props: { isSingle: true, value: [] },
      expectLinkingActions: true
    }
  };
  forEach(linkingActionsVisibilityCases, (testCase, description) => {
    const { props, expectLinkingActions } = testCase;

    describe(description, () => {
      it(`${expectLinkingActions ? 'renders' : 'hides'} linking actions`, () => {
        const wrapper = mount(props);
        expect(wrapper.find(LinkingActions)).toHaveLength(expectLinkingActions ? 1 : 0);
      });
    });
  });
});
