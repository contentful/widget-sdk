/* global SystemJS */
import sinon from 'npm:sinon';
import _ from 'lodash';
import keycodes from 'utils/keycodes';
import { contentTypes, keyDown } from './helpers';

const Components = {
  queryInput: view => view.find('queryInput'),
  contentFilterPill: view => view.find('contentTypeFilter'),
  contentFilterValue: view => view.find('contentTypeFilter', 'value')
};

xdescribe('app/ContentList/Search/View', function () {
  let actions, render, view;
  beforeEach(function* () {
    module('contentful/test');

    SystemJS.set('entitySelector', SystemJS.newModule({}));

    // TODO: remove after converting datepicker to es6 module.
    SystemJS.set('datepicker', SystemJS.newModule({}));
    SystemJS.set('moment', SystemJS.newModule({}));
    SystemJS.set('mimetype', SystemJS.newModule({default: {
      getGroupNames: sinon.stub().returns([])
    }}));

    const { default: searchComponent } = yield SystemJS.import(
      'app/ContentList/Search/View'
    );
    const Filters = yield SystemJS.import('app/ContentList/Search/Filters');
    this.contentTypeFilter = Filters.contentTypeFilter;
    this.getFiltersFromQueryKey = Filters.getFiltersFromQueryKey;

    const Actions =
      yield SystemJS.import('app/ContentList/Search/State');

    actions = _.mapValues(Actions, () => {
      return sinon.spy();
    });

    // requirement for TrackFocus hook
    document.body.setAttribute('tabindex', '0');

    render = (props = {}) => {
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
        actions: actions
      };
      view = this.createUI();
      view.render(searchComponent(_.assign({}, defaultProps, props)));

      // Attribute autofocus doesn't work
      // with dynamically created elements (e.g appendChild);
      const queryInputEl = Components.queryInput(view).element;
      if (queryInputEl.autofocus) {
        queryInputEl.focus();
      }
    };
  });

  afterEach(function () {
    SystemJS.delete('entitySelector');
    SystemJS.delete('datepicker');
    SystemJS.delete('moment');
    SystemJS.delete('mimetype');
    document.body.removeAttribute('tabindex');
    view.destroy();
  });

  describe('with initial state', function () {
    beforeEach(function () {
      render();
    });

    it('QueryInput is focused', function () {
      const queryInputEl = Components.queryInput(view).element;

      expect(queryInputEl.value).toBe('');
      expect(queryInputEl.hasAttribute('autofocus')).toEqual(true);
    });

    it('Content Type filter has a selected Any', function () {
      const contentTypeFilterValue = Components.contentFilterValue(view)
        .element;

      expect(contentTypeFilterValue.value).toBe('');
      expect(contentTypeFilterValue.selectedOptions[0].label).toBe('Any');
    });

    it('Content Type filter has all possible content types', function () {
      const contentTypeFilterValue = Components.contentFilterValue(view)
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
      view.find('suggestions').assertNonExistent();
    });

    it('emits ShowSuggestions on arrow down', function () {
      const queryInput = Components.queryInput(view);

      queryInput.element.dispatchEvent(
        keyDown({
          keyCode: keycodes.DOWN
        })
      );

      sinon.assert.calledOnce(actions.ShowSuggestions);
    });

    it('selects the last pill on backspace', function () {
      const queryInput = Components.queryInput(view);

      queryInput.element.dispatchEvent(
        keyDown({
          keyCode: keycodes.BACKSPACE
        })
      );

      sinon.assert.calledOnce(actions.SetFocusOnLast);
    });

    it('emits HideSuggestions on esc', function () {
      const queryInput = Components.queryInput(view);

      queryInput.element.dispatchEvent(
        keyDown({
          keyCode: keycodes.ESC
        })
      );

      sinon.assert.calledOnce(actions.HideSuggestions);
    });

    it('emits HideSuggestions on enter', function () {
      const queryInput = Components.queryInput(view);

      queryInput.element.dispatchEvent(
        keyDown({
          keyCode: keycodes.ENTER
        })
      );

      sinon.assert.calledOnce(actions.HideSuggestions);
    });
  });

  describe('with searchTerm', () => {
    beforeEach(function () {
      render({
        input: 'xoxo'
      });
    });

    it('QueryInput is not focused', function () {
      const queryInputEl = Components.queryInput(view).element;

      expect(queryInputEl.value).toBe('xoxo');
      expect(queryInputEl.hasAttribute('autofocus')).toEqual(false);
    });
  });

  describe('with filters', () => {
    beforeEach(function () {
      render({
        filters: this.getFiltersFromQueryKey({
          contentTypes,
          searchFilters: [['sys.id', '', 'xoxo']],
          contentTypeId: '',
          users: []
        })
      });
    });

    it('QueryInput is not focused', function () {
      const queryInputEl = Components.queryInput(view).element;

      expect(queryInputEl.value).toBe('');
      expect(queryInputEl.hasAttribute('autofocus')).toEqual(false);
    });
  });
});
