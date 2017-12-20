import { createElement as h } from 'libs/react';
import { mount } from 'libs/enzyme';
import Highlighter from 'libs/react-highlight-words';
import { noop, range } from 'lodash';
import Menu, {
  ListItem,
  SearchInput,
  Group,
  NotFoundMessage,
  SuggestedContentType
} from 'components/tabs/entry_list/CreateEntryButton/Menu';

describe('CreateEntryMenu', () => {
  const contentTypes = generateContentTypes(23);
  let wrapper;

  beforeEach(() => {
    const props = {
      contentTypes,
      suggestedContentTypeId: contentTypes[0].sys.id,
      position: 'bottom',
      onSelect: noop
    };
    wrapper = mount(h(Menu, props));
  });

  afterEach(() => {
    wrapper = null;
  });

  it('renders search input only if more than 20 items are passed', () => {
    wrapper.setProps({ contentTypes: generateContentTypes(13) });
    expect(wrapper.find(SearchInput).exists()).toBeFalsy();
    wrapper.setProps({ contentTypes });
    expect(wrapper.find(SearchInput).exists()).toBeTruthy();
  });

  it('renders two groups when there is a suggested content type and no search query', () => {
    expect(wrapper.find(Group).length).toEqual(2);
    expect(wrapper.find(SuggestedContentType).exists()).toBeTruthy();

    contentTypes.forEach((item) => {
      const group = wrapper.find(Group).at(1);
      const listItem = group.find(ListItem).filterWhere(n => n.text() === item.name);
      expect(listItem.exists()).toBeTruthy();
      expect(listItem.find(Highlighter).props()).toEqual({
        searchWords: [''],
        textToHighlight: item.name,
        highlightClassName: 'context-menu__highlighted-text'
      });
    });
  });

  it('renders all matching content types to a given search query', () => {
    const unmatchingQuery = contentTypes[2].name;
    const matchingQuery = contentTypes[1].name;

    expect(wrapper.find(ListItem).filterWhere(n => n.text() === unmatchingQuery)).toBeTruthy();

    wrapper.find('input').simulate('change', { target: { value: matchingQuery } });

    expect(wrapper.find(ListItem).filterWhere(n => n.text() === unmatchingQuery).length).toEqual(0);
    const matchingNode = wrapper.find(ListItem).filterWhere(n => n.text() === matchingQuery);

    expect(matchingNode.length).toEqual(1);
    expect(matchingNode.find(Highlighter).props()).toEqual({
      searchWords: [ matchingQuery ],
      textToHighlight: matchingQuery,
      highlightClassName: 'context-menu__highlighted-text'
    });
  });

  it('renders "Not found" message if there is no matching search query', () => {
    wrapper.find('input').simulate('change', { target: { value: 'Some random value' } });
    expect(wrapper.find(SuggestedContentType).exists()).toBeFalsy();
    expect(wrapper.find(Group).length).toEqual(0);
    expect(wrapper.find(NotFoundMessage).exists()).toBeTruthy();
  });

  it('does not render suggested content type if there is a search query', () => {
    const matchingQuery = contentTypes[0].name;
    expect(wrapper.find(SuggestedContentType).exists()).toBeTruthy();
    wrapper.find('input').simulate('change', { target: { value: matchingQuery } });
    expect(wrapper.find(SuggestedContentType).exists()).toBeFalsy();
  });
});


function generateContentTypes (max) {
  return range(max).map(() => ({
    sys: { id: Math.random().toString(36).substring(7) },
    name: Math.random().toString(36).substring(10)
  }));
}
