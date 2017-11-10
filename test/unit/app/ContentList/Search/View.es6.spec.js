/* global SystemJS */
import sinon from 'npm:sinon';
import _ from 'lodash';
import {
  contentTypeFilter,
  getFiltersFromQueryKey
} from 'app/ContentList/Search/Filters';
import { Actions } from 'app/ContentList/Search/State';
import { contentTypes, keyDown } from './helpers';

const Components = {
  queryInput: view => view.find('queryInput'),
  contentFilterPill: view => view.find('contentTypeFilter'),
  contentFilterValue: view => view.find('contentTypeFilter', 'value')
};

describe('app/ContentList/Search/View', function () {
  beforeEach(function* () {
    module('contentful/test');

    SystemJS.set('entitySelector', SystemJS.newModule({}));

    // TODO: remove after converting datepicker to es6 module.
    SystemJS.set('datepicker', SystemJS.newModule({}));
    SystemJS.set('moment', SystemJS.newModule({}));

    const { default: searchComponent } = yield SystemJS.import(
      'app/ContentList/Search/View'
    );

    this.actions = _.mapValues(Actions, () => {
      return sinon.spy();
    });

    // requirement for TrackFocus hook
    document.body.setAttribute('tabindex', '0');

    this.render = (props = {}) => {
      const defaultProps = {
        isSearching: false,
        isTyping: false,
        focus,
        searchBoxHasFocus: false,
        contentTypeId: '',
        contentTypeFilter: contentTypeFilter(contentTypes),
        filters: [],
        input: '',
        isSuggestionOpen: false,
        suggestions: [],
        actions: this.actions
      };
      const view = this.createUI();
      view.render(searchComponent(_.assign({}, defaultProps, props)));

      this.view = view;

      // Attribute autofocus doesn't work
      // with dynamically created elements (e.g appendChild);
      const queryInputEl = Components.queryInput(this.view).element;
      if (queryInputEl.autofocus) {
        queryInputEl.focus();
      }
    };
  });

  afterEach(function () {
    SystemJS.delete('entitySelector');
    SystemJS.delete('datepicker');
    SystemJS.delete('moment');
    document.body.removeAttribute('tabindex');
    this.view.destroy();
  });

  describe('with initial state', function () {
    beforeEach(function () {
      this.render();
    });

    it('QueryInput is focused', function () {
      const queryInputEl = Components.queryInput(this.view).element;

      expect(queryInputEl.value).toBe('');
      expect(queryInputEl.hasAttribute('autofocus')).toEqual(true);
    });

    it('Content Type filter has a selected Any', function () {
      const contentTypeFilterValue = Components.contentFilterValue(this.view)
        .element;

      expect(contentTypeFilterValue.value).toBe('');
      expect(contentTypeFilterValue.selectedOptions[0].label).toBe('Any');
    });

    it('Content Type filter has all possible content types', function () {
      const contentTypeFilterValue = Components.contentFilterValue(this.view)
        .element;

      const AnyOption = ['', 'Any'];

      expect([
        AnyOption,
        ...contentTypes.map(({ name, sys: { id } }) => [id, name])
      ]).toEqual(
        _.map(contentTypeFilterValue.options, ({ label, value }) => [
          value,
          label
        ])
      );
    });

    it('has collapsed Suggestions', function () {
      this.view.find('suggestions').assertNonExistent();
    });

    it('emits ShowSuggestions on arrow down', function () {
      const queryInput = Components.queryInput(this.view);

      queryInput.element.dispatchEvent(
        keyDown({
          key: 'ArrowDown'
        })
      );

      sinon.assert.calledOnce(this.actions.ShowSuggestions);
    });

    it('selects the last pill on backspace', function () {
      const queryInput = Components.queryInput(this.view);

      queryInput.element.dispatchEvent(
        keyDown({
          key: 'Backspace'
        })
      );

      sinon.assert.calledOnce(this.actions.SetFocusOnLast);
    });

    it('emits HideSuggestions on esc', function () {
      const queryInput = Components.queryInput(this.view);

      queryInput.element.dispatchEvent(
        keyDown({
          key: 'Escape'
        })
      );

      sinon.assert.calledOnce(this.actions.HideSuggestions);
    });

    it('emits HideSuggestions on enter', function () {
      const queryInput = Components.queryInput(this.view);

      queryInput.element.dispatchEvent(
        keyDown({
          key: 'Enter'
        })
      );

      sinon.assert.calledOnce(this.actions.HideSuggestions);
    });
  });

  describe('with searchTerm', () => {
    beforeEach(function () {
      this.render({
        input: 'xoxo'
      });
    });

    it('QueryInput is not focused', function () {
      const queryInputEl = Components.queryInput(this.view).element;

      expect(queryInputEl.value).toBe('xoxo');
      expect(queryInputEl.hasAttribute('autofocus')).toEqual(false);
    });
  });

  describe('with filters', () => {
    beforeEach(function () {
      this.render({
        filters: getFiltersFromQueryKey({
          contentTypes,
          searchFilters: [['sys.id', '', 'xoxo']],
          contentTypeId: '',
          users: []
        })
      });
    });

    it('QueryInput is not focused', function () {
      const queryInputEl = Components.queryInput(this.view).element;

      expect(queryInputEl.value).toBe('');
      expect(queryInputEl.hasAttribute('autofocus')).toEqual(false);
    });
  });
});
