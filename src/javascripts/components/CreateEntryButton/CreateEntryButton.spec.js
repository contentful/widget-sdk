import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { noop } from 'lodash';

import CreateEntryButton from './CreateEntryButton';

const CONTENT_TYPE_1 = { name: 'name-1', sys: { id: 'ID_1' } };
const CONTENT_TYPE_2 = { name: 'name-2', sys: { id: 'ID_2' } };
const CONTENT_TYPE_3 = { name: 'name-3', sys: { id: 'ID_3' } };

const findButton = getByTestId => getByTestId('create-entry-button');

describe('CreateEntryButton general', () => {
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
    expect(() => getByTestId('add-entry-menu-container')).toThrow(
      'Unable to find an element by: [data-test-id="add-entry-menu-container"]'
    );
    // dropdown icon
    expect(button.querySelector('svg')).toBeDefined();
  });

  it('renders suggestedContentType as text when given', () => {
    const suggestedContentTypeId = 'ID_2';
    const { getByTestId } = render(
      <CreateEntryButton {...props} suggestedContentTypeId={suggestedContentTypeId} />
    );
    expect(getByTestId('create-entry-button-menu-trigger')).toBeDefined();
    const button = findButton(getByTestId);
    expect(button).toBeDefined();
    expect(button.textContent).toBe(`Add ${CONTENT_TYPE_2.name}`);
  });

  it('renders the name of the content type as part of the text if only 1 content type is given', () => {
    const { getByTestId } = render(
      <CreateEntryButton onSelect={props.onSelect} contentTypes={[CONTENT_TYPE_1]} />
    );
    expect(getByTestId('create-entry-button-menu-trigger')).toBeDefined();
    const button = findButton(getByTestId);
    expect(button).toBeDefined();
    expect(button.textContent).toBe(`Add ${CONTENT_TYPE_1.name}`);
  });

  it('renders a menu on click when with multiple content types', () => {
    const { getByTestId } = render(<CreateEntryButton {...props} />);
    fireEvent.click(findButton(getByTestId));
    const menu = getByTestId('add-entry-menu-container');
    expect(menu).toBeDefined();
    const menuItems = menu.querySelectorAll('[data-test-id="contentType"]');
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
  const props = {
    contentTypes: [CONTENT_TYPE_1, CONTENT_TYPE_2, CONTENT_TYPE_3],
    onSelect: noop
  };

  it('should display and close menu on button click', () => {
    const { getByTestId } = render(<CreateEntryButton {...props} />);
    fireEvent.click(findButton(getByTestId));
    expect(getByTestId('add-entry-menu-container')).toBeDefined();
    fireEvent.click(findButton(getByTestId));
    expect(() => getByTestId('add-entry-menu-container')).toThrow(
      'Unable to find an element by: [data-test-id="add-entry-menu-container"]'
    );
  });

  it('should render dropdown items for each content type', () => {
    const { getByTestId, getAllByTestId } = render(<CreateEntryButton {...props} />);
    fireEvent.click(findButton(getByTestId));
    expect(getAllByTestId('cf-ui-dropdown-list-item-button')).toHaveLength(
      props.contentTypes.length
    );
  });

  it('calls onSelect after click on menu item', () => {
    const selectSpy = jest.fn();
    const { getByTestId, getAllByTestId } = render(
      <CreateEntryButton {...props} onSelect={selectSpy} />
    );
    fireEvent.click(findButton(getByTestId));
    fireEvent.click(
      getAllByTestId('contentType')[1].querySelector(
        '[data-test-id="cf-ui-dropdown-list-item-button"]'
      )
    );
    expect(selectSpy).toHaveBeenCalledWith(CONTENT_TYPE_2.sys.id);
  });
});

describe('CreateEntryButton with a single entry', () => {
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
