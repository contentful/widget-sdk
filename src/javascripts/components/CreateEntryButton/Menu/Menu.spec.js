import React from 'react';
import { mount } from 'enzyme';
import { noop, range } from 'lodash';
import Menu from './index.es6';

const sel = id => `[data-test-id="${id}"]`;

describe('CreateEntryMenu', () => {
  const contentTypes = generateContentTypes(23);
  let wrapper;

  beforeEach(() => {
    const props = {
      contentTypes,
      suggestedContentTypeId: contentTypes[0].sys.id,
      onSelect: noop
    };
    wrapper = mount(<Menu {...props} />);
  });

  afterEach(() => {
    wrapper = null;
  });

  it('renders search input only if more than 20 items are passed', () => {
    wrapper.setProps({ contentTypes: generateContentTypes(13) });
    expect(wrapper.find(sel('addEntrySearchInput')).exists()).toBeFalsy();
    wrapper.setProps({ contentTypes });
    expect(wrapper.find(sel('addEntrySearchInput')).exists()).toBeTruthy();
  });

  it('renders two groups when there is a suggested content type and no search query', () => {
    expect(wrapper.find(sel('group-suggested'))).toHaveLength(1);
    expect(wrapper.find(sel('group-all'))).toHaveLength(1);

    contentTypes.forEach(item => {
      const listItem = wrapper.find(sel('contentType')).filterWhere(n => n.text() === item.name);
      expect(listItem.exists()).toBeTruthy();
      expect(listItem.find('.context-menu__highlighted-text')).toHaveLength(0);
    });
  });

  it('renders all matching content types to a given search query', () => {
    const unmatchingQuery = contentTypes[2].name;
    const matchingQuery = contentTypes[1].name;

    expect(
      wrapper.find(sel('contentType')).filterWhere(n => n.text() === unmatchingQuery)
    ).toBeTruthy();

    wrapper
      .find(sel('addEntrySearchInput'))
      .simulate('change', { target: { value: matchingQuery } });

    expect(
      wrapper.find(sel('contentType')).filterWhere(n => n.text() === unmatchingQuery)
    ).toHaveLength(0);
    const matchingNode = wrapper
      .find(sel('contentType'))
      .filterWhere(n => n.text() === matchingQuery);

    expect(matchingNode).toHaveLength(1);
    expect(matchingNode.find('.context-menu__highlighted-text').text()).toEqual(matchingQuery);
  });

  it('renders "Not found" message if there is no matching search query', () => {
    wrapper
      .find(sel('addEntrySearchInput'))
      .simulate('change', { target: { value: 'Some random value' } });
    expect(wrapper.find(sel('group-suggested')).exists()).toBeFalsy();
    expect(wrapper.find(sel('group'))).toHaveLength(0);
    expect(wrapper.find(sel('no-results')).exists()).toBeTruthy();
  });

  it('does not render suggested content type if there is a search query', () => {
    const matchingQuery = contentTypes[0].name;
    expect(wrapper.find(sel('group-suggested')).exists()).toBeTruthy();
    wrapper
      .find(sel('addEntrySearchInput'))
      .simulate('change', { target: { value: matchingQuery } });
    expect(wrapper.find(sel('group-suggested')).exists()).toBeFalsy();
  });
});

function generateContentTypes(max) {
  return range(max).map(index => {
    const randomString = `${index}${Math.random().toString(36)}`;
    return {
      sys: { id: randomString.substring(7) },
      name: randomString.substring(10)
    };
  });
}
