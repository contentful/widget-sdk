import React from 'react';
import { render as renderReact, wait, fireEvent, waitFor } from '@testing-library/react';
import View from './View';
import { contentTypes, brand } from './__tests__/helpers';
import keycodes from 'utils/keycodes';
import { getCurrentSpaceFeature } from 'data/CMA/ProductCatalog';

const onUpdate = jest.fn();

const searchFilters = [['sys.createdAt', 'op', 'value']];

const listViewContext = {
  getView: jest.fn().mockReturnValue({
    searchFilters: [],
    contentTypeId: '',
    searchText: '',
    order: {},
  }),
  setView: jest.fn(),
  setViewKey: jest.fn(),
  setViewAssigned: jest.fn(),
};

const render = (props = {}) => {
  const getContentTypes = jest.fn().mockReturnValue(contentTypes);

  const defaultProps = {
    isLoading: false,
    onUpdate,
    entityType: 'entry',
    users: [{ sys: { id: '1' } }],
    getContentTypes,
    initialState: { searchFilters },
    listViewContext,
    ...props,
  };

  const wrapper = renderReact(<View {...defaultProps} />);

  return { wrapper, onUpdate };
};

const renderWithInitialWait = async (props) => {
  const result = render(props);
  await wait();
  return result;
};

describe('app/ContentList/Search/View', () => {
  beforeEach(() => {
    getCurrentSpaceFeature.mockResolvedValue(false);

    listViewContext.getView = jest
      .fn()
      .mockReturnValue({ searchFilters: [], contentTypeId: '', searchText: '', order: {} });
    listViewContext.setView.mockClear();
    listViewContext.setViewKey.mockClear();
    listViewContext.setViewAssigned.mockClear();
    onUpdate.mockClear();
    document.body.setAttribute('tabindex', '0');
  });

  describe('key events', () => {
    it('has collapsed Suggestions', async () => {
      const { wrapper } = await renderWithInitialWait();
      expect(wrapper.queryByTestId('suggestions')).not.toBeInTheDocument();
    });

    it('emits ShowSuggestions on arrow down', async () => {
      const { wrapper } = await renderWithInitialWait();
      const queryInput = await wrapper.findByTestId('queryInput');
      fireEvent.keyDown(queryInput, { keyCode: keycodes.DOWN });
      expect(wrapper.queryByTestId('suggestions')).toBeInTheDocument();
    });

    it('selects the last pill on backspace', async () => {
      listViewContext.getView.mockReturnValue({
        searchText: '',
        order: {},
        searchFilters,
        contentTypeId: brand.name,
      });
      const { wrapper } = await renderWithInitialWait();
      const queryInput = await wrapper.findByTestId('queryInput');
      fireEvent.keyDown(queryInput, { keyCode: keycodes.BACKSPACE });
      await waitFor(() =>
        expect(wrapper.queryByTestId(searchFilters[0][0])).toEqual(document.activeElement)
      );
    });

    it('emits HideSuggestions on esc', async () => {
      const { wrapper } = await renderWithInitialWait();
      const queryInput = await wrapper.findByTestId('queryInput');
      fireEvent.keyDown(queryInput, { keyCode: keycodes.DOWN });
      await waitFor(() => expect(wrapper.queryByTestId('suggestions')).toBeInTheDocument());
      fireEvent.keyUp(queryInput, { keyCode: keycodes.ESC });
      await waitFor(() => expect(wrapper.queryByTestId('suggestions')).not.toBeInTheDocument());
    });

    it('emits HideSuggestions on enter', async () => {
      const { wrapper } = await renderWithInitialWait();
      const queryInput = await wrapper.findByTestId('queryInput');
      fireEvent.keyDown(queryInput, { keyCode: keycodes.DOWN });
      expect(wrapper.queryByTestId('suggestions')).toBeInTheDocument();
      fireEvent.keyDown(queryInput, { keyCode: keycodes.ENTER });
      expect(wrapper.queryByTestId('suggestions')).not.toBeInTheDocument();
    });
  });

  describe('search input', () => {
    it('should be able to type in a query', async () => {
      const { wrapper } = await renderWithInitialWait();
      const queryInput = await wrapper.findByTestId('queryInput');
      const query = 'query';
      fireEvent.change(queryInput, {
        target: { value: query },
      });
      expect(wrapper.queryByTestId('suggestions')).toBeInTheDocument();
      expect(listViewContext.setViewKey).toHaveBeenNthCalledWith(1, 'searchText', query);
      // onUpdate should be debounced
      expect(onUpdate).not.toHaveBeenCalled();
      await waitFor(() =>
        expect(onUpdate).toHaveBeenCalledWith({
          searchText: query,
        })
      );
    });
  });

  describe('filter suggestions', () => {
    it('selects the second suggestion', async () => {
      const { wrapper } = await renderWithInitialWait();
      const queryInput = await wrapper.findByTestId('queryInput');
      fireEvent.keyDown(queryInput, { keyCode: keycodes.DOWN });
      fireEvent.keyDown(queryInput, { keyCode: keycodes.DOWN });

      fireEvent.keyDown(document.activeElement, { keyCode: keycodes.ENTER });
      expect(wrapper.queryByTestId('suggestions')).not.toBeInTheDocument();
      expect(listViewContext.setViewAssigned).toHaveBeenNthCalledWith(1, {
        searchFilters: [['sys.updatedAt', '', undefined]],
        searchText: '',
      });
    });

    it('selects a text filter', async () => {
      const { wrapper } = await renderWithInitialWait();
      const queryInput = await wrapper.findByTestId('queryInput');
      fireEvent.keyDown(queryInput, { keyCode: keycodes.DOWN });

      const fieldId = 'sys.id';

      fireEvent.keyDown(wrapper.queryByTestId(`none::${fieldId}`), {
        keyCode: keycodes.ENTER,
      });
      expect(listViewContext.setViewAssigned).toHaveBeenNthCalledWith(1, {
        searchFilters: [['sys.id', 'match', undefined]],
        searchText: '',
      });
    });

    it('selects a contentType field filter', async () => {
      const { wrapper } = await renderWithInitialWait();
      const queryInput = await wrapper.findByTestId('queryInput');
      fireEvent.keyDown(queryInput, { keyCode: keycodes.DOWN });

      const fieldId = 'fields.symbol1';

      fireEvent.keyDown(wrapper.queryByTestId(`TEST_CT_ID::${fieldId}`), {
        keyCode: keycodes.ENTER,
      });
      expect(listViewContext.setViewKey).toHaveBeenNthCalledWith(1, 'contentTypeId', 'TEST_CT_ID');
      expect(listViewContext.setViewAssigned).toHaveBeenNthCalledWith(1, {
        searchFilters: [[fieldId, '', undefined]],
        searchText: '',
      });
    });
  });
});
