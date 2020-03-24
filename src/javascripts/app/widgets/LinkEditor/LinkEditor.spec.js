import { forEach } from 'lodash';
import React from 'react';
import Enzyme from 'enzyme';
import 'jest-enzyme';
import { newLink } from './__test__/helpers.js';

import LinkEditor from './LinkEditor';
import LinkingActions from './LinkingActions';
import SortableLinkList from './SortableLinkList';

const link = newLink();

jest.mock('../shared/FetchedEntityCard', () => 'FetchedEntityCard');

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

  const renderLinksCases = {
    'without link': {
      props: { value: [] }
    },
    'with single link': {
      props: { value: [link] }
    },
    'with links': {
      props: { value: [link, newLink(), newLink()] }
    },
    'with duplicate links': {
      props: { value: [link, link, link] }
    },
    'isSingle with link': {
      props: { value: [link], isSingle: true }
    },
    '(isSingle without link': {
      props: { value: [], isSingle: true }
    }
  };
  forEach(renderLinksCases, (testCase, description) => {
    const { props } = testCase;
    const expectedLinkCount = props.value.length;

    describe(description, () => {
      it(`renders ${expectedLinkCount} links`, () => {
        const wrapper = mount(props);
        expectLinks(wrapper, expectedLinkCount);
      });
    });
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
    'isSingle without link': {
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

function expectLinks(wrapper, expectedCount) {
  const linkList = wrapper.find(SortableLinkList);
  expect(linkList).toHaveLength(1);
  expect(linkList.props().items).toHaveLength(expectedCount);
}
