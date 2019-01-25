import React from 'react';
import Enzyme from 'enzyme';
import { mapValues } from 'lodash';
import View from '../View.es6';
import { Actions } from '../State.es6';
import * as Filters from '../Filters.es6';
import { contentTypes } from './helpers';
import keycodes from 'utils/keycodes.es6';

const MockComponent = () => <div />;

jest.mock('../ValueInput/Date.es6', () => MockComponent);
jest.mock('../ValueInput/Reference.es6', () => MockComponent);

describe('app/ContentList/Search/View.es6', () => {
  const render = (props = {}) => {
    const actions = mapValues(Actions, () => {
      return jest.fn();
    });

    const defaultProps = {
      isSearching: false,
      isTyping: false,
      focus,
      searchBoxHasFocus: false,
      contentTypeId: '',
      contentTypeFilter: Filters.contentTypeFilter(contentTypes),
      filters: [],
      input: '',
      isSuggestionOpen: false,
      suggestions: [],
      hasLoaded: true,
      actions: actions,
      ...props
    };

    const wrapper = Enzyme.mount(<View {...defaultProps} />);

    return { wrapper, actions };
  };

  describe('without initial data', () => {
    it('renders loader', () => {
      const { wrapper } = render({
        hasLoaded: false
      });
      expect(wrapper.find('[data-test-id="loader"]')).toBeDefined();
    });
  });

  describe('with initial data', () => {
    beforeEach(() => {
      document.body.setAttribute('tabindex', '0');
    });

    it('QueryInput is focused', () => {
      const { wrapper } = render();

      expect(wrapper.find('[data-test-id="queryInput"]')).toExist();

      expect(document.activeElement.getAttribute('data-test-id')).toEqual('queryInput');
    });

    it('has collapsed Suggestions', () => {
      const { wrapper } = render();
      expect(wrapper.find('[data-test-id="suggestions"]')).not.toExist();
    });

    it('emits ShowSuggestions on arrow down', () => {
      const { wrapper, actions } = render();
      const queryInput = wrapper.find('[data-test-id="queryInput"]');
      queryInput.simulate('keyDown', { keyCode: keycodes.DOWN });
      expect(actions.ShowSuggestions).toHaveBeenCalledTimes(1);
    });

    it('selects the last pill on backspace', () => {
      const { wrapper, actions } = render();
      const queryInput = wrapper.find('[data-test-id="queryInput"]');
      queryInput.simulate('keyDown', { keyCode: keycodes.BACKSPACE });
      expect(actions.SetFocusOnLast).toHaveBeenCalledTimes(1);
    });

    it('emits HideSuggestions on esc', () => {
      const { wrapper, actions } = render();
      const queryInput = wrapper.find('[data-test-id="queryInput"]');
      queryInput.simulate('keyDown', { keyCode: keycodes.ESC });
      expect(actions.HideSuggestions).toHaveBeenCalledTimes(1);
    });

    it('emits HideSuggestions on enter', () => {
      const { wrapper, actions } = render();
      const queryInput = wrapper.find('[data-test-id="queryInput"]');
      queryInput.simulate('keyDown', { keyCode: keycodes.ENTER });
      expect(actions.HideSuggestions).toHaveBeenCalledTimes(1);
    });
  });
});
