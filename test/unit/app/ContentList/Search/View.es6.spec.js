import sinon from 'npm:sinon';
import _ from 'lodash';
import keycodes from 'utils/keycodes';
import { contentTypes } from './helpers';
import ReactTestUtils from 'react-dom/test-utils';
import { createIsolatedSystem } from 'test/helpers/system-js';

const Components = {
  queryInput: view => view.find('queryInput'),
  loader: view => view.find('loader'),
  contentFilterPill: view => view.find('contentTypeFilter'),
  contentFilterValue: view => view.find('contentTypeFilter', 'value')
};

describe('app/ContentList/Search/View', () => {
  let actions, render, view, system;
  beforeEach(function*() {
    system = createIsolatedSystem();

    system.set('entitySelector', {});

    // TODO: remove after converting datepicker to es6 module.
    system.set('datepicker', {});
    system.set('moment', {});
    system.set('stringUtils', {});
    system.set('mimetype', {
      default: {
        getGroupNames: sinon.stub().returns([])
      }
    });

    const { default: searchComponent } = yield system.import('app/ContentList/Search/View');
    const Filters = yield system.import('app/ContentList/Search/Filters');
    this.contentTypeFilter = Filters.contentTypeFilter;
    this.getFiltersFromQueryKey = Filters.getFiltersFromQueryKey;

    const { Actions } = yield system.import('app/ContentList/Search/State');

    const { default: createMountPoint } = yield system.import('ui/Framework/DOMRenderer');

    actions = _.mapValues(Actions, () => {
      return sinon.spy();
    });

    // requirement for TrackFocus hook
    document.body.setAttribute('tabindex', '0');

    render = (customProps = {}) => {
      const defaultProps = {
        isSearching: false,
        isTyping: false,
        focus,
        searchBoxHasFocus: false,
        contentTypeId: '',
        contentTypeFilter: this.contentTypeFilter(contentTypes),
        filters: [],
        input: '',
        isSuggestionOpen: false,
        suggestions: [],
        hasLoaded: true,
        actions: actions
      };

      const props = _.assign({}, defaultProps, customProps);
      view = this.createUI({
        createMountPoint
      });
      view.render(searchComponent(props));
    };
  });

  afterEach(() => {
    document.body.removeAttribute('tabindex');

    view.destroy();
  });

  describe('without initial data', () => {
    it('renders loader', () => {
      render({
        hasLoaded: false
      });

      expect(() => Components.loader(view)).not.toThrow();
    });
  });

  describe('with initial data', () => {
    beforeEach(() => {
      render();
    });

    it('QueryInput is focused', () => {
      const queryInputEl = Components.queryInput(view).element;

      expect(queryInputEl.value).toBe('');
      expect(queryInputEl).toEqual(document.activeElement);
    });

    it('Content Type filter has a selected Any', () => {
      const contentTypeFilterValue = Components.contentFilterValue(view).element;

      expect(contentTypeFilterValue.value).toBe('');
      expect(contentTypeFilterValue.selectedOptions[0].label).toBe('Any');
    });

    it('Content Type filter has all possible content types', () => {
      const contentTypeFilterValue = Components.contentFilterValue(view).element;

      const AnyOption = ['', 'Any'];

      expect([AnyOption, ...contentTypes.map(({ name, sys: { id } }) => [id, name])]).toEqual(
        _.map(contentTypeFilterValue.options, ({ label, value }) => [value, label])
      );
    });

    it('has collapsed Suggestions', () => {
      view.find('suggestions').assertNonExistent();
    });

    it('emits ShowSuggestions on arrow down', () => {
      const queryInput = Components.queryInput(view).element;
      ReactTestUtils.Simulate.keyDown(queryInput, {
        keyCode: keycodes.DOWN
      });

      sinon.assert.calledOnce(actions.ShowSuggestions);
    });

    it('selects the last pill on backspace', () => {
      const queryInput = Components.queryInput(view).element;

      ReactTestUtils.Simulate.keyDown(queryInput, {
        keyCode: keycodes.BACKSPACE
      });

      sinon.assert.calledOnce(actions.SetFocusOnLast);
    });

    it('emits HideSuggestions on esc', () => {
      const queryInput = Components.queryInput(view).element;

      ReactTestUtils.Simulate.keyDown(queryInput, {
        keyCode: keycodes.ESC
      });

      sinon.assert.calledOnce(actions.HideSuggestions);
    });

    it('emits HideSuggestions on enter', () => {
      const queryInput = Components.queryInput(view).element;

      ReactTestUtils.Simulate.keyDown(queryInput, {
        keyCode: keycodes.ENTER
      });

      sinon.assert.calledOnce(actions.HideSuggestions);
    });
  });

  describe('with searchTerm', () => {
    beforeEach(() => {
      render({
        input: 'xoxo'
      });
    });

    it('QueryInput is not focused', () => {
      const queryInputEl = Components.queryInput(view).element;

      expect(queryInputEl.value).toBe('xoxo');
      expect(queryInputEl).not.toEqual(document.activeElement);
    });
  });

  describe('with filters', () => {
    beforeEach(function() {
      render({
        filters: this.getFiltersFromQueryKey({
          contentTypes,
          searchFilters: [['sys.id', '', 'xoxo']],
          contentTypeId: '',
          users: []
        })
      });
    });

    it('QueryInput is not focused', () => {
      const queryInputEl = Components.queryInput(view).element;

      expect(queryInputEl.value).toBe('');
      expect(queryInputEl).not.toEqual(document.activeElement);
    });
  });
});
