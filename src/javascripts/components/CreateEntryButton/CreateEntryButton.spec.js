import React from 'react';
import { cleanup, render, fireEvent } from '@testing-library/react';
import { noop } from 'lodash';
import '@testing-library/jest-dom/extend-expect';
import CreateEntryButton from './CreateEntryButton';

const CONTENT_TYPE_1 = { name: 'name-1', sys: { id: 'ID_1' } };
const CONTENT_TYPE_2 = { name: 'name-2', sys: { id: 'ID_2' } };
const CONTENT_TYPE_3 = { name: 'name-3', sys: { id: 'ID_3' } };

const findButton = getByTestId => getByTestId('create-entry-button');

describe('CreateEntryButton general', () => {
  afterEach(cleanup);

  const props = {
    contentTypes: [CONTENT_TYPE_1, CONTENT_TYPE_2, CONTENT_TYPE_3],
    onSelect: noop
  };

  it('renders a menu when with multiple content types', () => {
    const { getByTestId } = render(<CreateEntryButton {...props} />);
    expect(getByTestId('create-entry-button-menu-trigger')).toBeDefined();
    const button = findButton(getByTestId);
    expect(button).toBeDefined();
    expect(button.textContent).toBe('Add entry');
    expect(() => getByTestId('add-entry-menu')).toThrow(
      'Unable to find an element by: [data-test-id="add-entry-menu"]'
    );
    // dropdown icon
    expect(button.querySelector('svg')).toBeDefined();
  });

  it('renders suggestedContentTypeId as text when given', () => {
    const suggestedContentTypeId = 'Test-1';
    const { getByTestId } = render(
      <CreateEntryButton {...props} suggestedContentTypeId={suggestedContentTypeId} />
    );
    expect(getByTestId('create-entry-button-menu-trigger')).toBeDefined();
    const button = findButton(getByTestId);
    expect(button).toBeDefined();
    expect(button.textContent).toBe(`Add ${suggestedContentTypeId}`);
  });

  it('renders a menu on click when with multiple content types', () => {
    const { getByTestId } = render(<CreateEntryButton {...props} />);
    fireEvent.click(findButton(getByTestId));
    const menu = getByTestId('add-entry-menu');
    expect(menu).toBeDefined();
    const menuItems = menu.querySelectorAll('[role="menuitem"]');
    expect(menuItems).toHaveLength(props.contentTypes.length);
    menuItems.forEach((item, index) =>
      expect(item.textContent).toBe(props.contentTypes[index].name)
    );
  });

  it('renders custom text', () => {
    const propsOverrides = {
      text: 'CUSTOM_TEXT'
    };
    const { getByTestId } = render(<CreateEntryButton {...props} {...propsOverrides} />);
    expect(findButton(getByTestId).textContent).toBe(propsOverrides.text);
  });

  it('is a simple non-dropdown button when with a single content type', () => {
    render(<CreateEntryButton {...props} contentTypes={[CONTENT_TYPE_2]} />);
    expect(document.querySelector('svg')).toBeNull();
  });
});

describe('CreateEntryButton with multiple entries', () => {
  afterEach(cleanup);

  const props = {
    contentTypes: [CONTENT_TYPE_1, CONTENT_TYPE_2, CONTENT_TYPE_3],
    onSelect: noop
  };

  it('should display and close menu on button click', () => {
    const { getByTestId } = render(<CreateEntryButton {...props} />);
    fireEvent.click(findButton(getByTestId));
    expect(getByTestId('add-entry-menu')).toBeDefined();
    fireEvent.click(findButton(getByTestId));
    expect(() => getByTestId('add-entry-menu')).toThrow(
      'Unable to find an element by: [data-test-id="add-entry-menu"]'
    );
  });

  // eslint-disable-next-line
  it.skip('should render dropdown items for each content type', () => {
    // TODO: Add once Menu is replaced with forma instead of custom implementation
    const { getByTestId, getAllByTestId } = render(<CreateEntryButton {...props} />);
    fireEvent.click(findButton(getByTestId));
    expect(getAllByTestId('dropdown-icon')).toHaveLength(props.contentTypes.length);
  });

  it('calls onSelect after click on menu item', () => {
    // TODO: Possibly remove once menu is replace with forma if handled by forma automatically.
    // No need to test what was already tested in forma repo
    const selectSpy = jest.fn();
    const { getByTestId, getAllByTestId } = render(
      <CreateEntryButton {...props} onSelect={selectSpy} />
    );
    fireEvent.click(findButton(getByTestId));
    fireEvent.click(getAllByTestId('contentType')[1]);
    expect(selectSpy).toHaveBeenCalledWith(CONTENT_TYPE_2.sys.id);
  });
});

describe('CreateEntryButton with a single entry', () => {
  afterEach(cleanup);

  const props = {
    contentTypes: [CONTENT_TYPE_1],
    onSelect: noop
  };

  it('should fire the onSelect function when clicked', () => {
    const onSelectStub = jest.fn();
    const { getByTestId } = render(<CreateEntryButton {...props} onSelect={onSelectStub} />);
    fireEvent.click(findButton(getByTestId));
    expect(onSelectStub).toHaveBeenCalledWith(props.contentTypes[0].sys.id);
  });
});
