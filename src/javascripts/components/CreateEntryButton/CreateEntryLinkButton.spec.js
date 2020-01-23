import React from 'react';
import { noop } from 'lodash';
import {
  render,
  cleanup,
  fireEvent,
  wait,
  waitForElement,
  waitForElementToBeRemoved
} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import CreateEntryLinkButton from './CreateEntryLinkButton';

const CONTENT_TYPE_1 = { name: 'name-1', sys: { id: 'ID_1' } };
const CONTENT_TYPE_2 = { name: 'name-2', sys: { id: 'ID_2' } };
const CONTENT_TYPE_3 = { name: 'name-3', sys: { id: 'ID_3' } };

const findButton = getByTestId => getByTestId('create-entry-link-button');

describe('CreateEntryLinkButton general', () => {
  afterEach(cleanup);

  const props = {
    contentTypes: [CONTENT_TYPE_1, CONTENT_TYPE_2, CONTENT_TYPE_3],
    onSelect: noop
  };

  it('renders with multiple content types as list', () => {
    const { getByTestId } = render(<CreateEntryLinkButton {...props} />);
    expect(getByTestId('create-entry-button-menu-trigger')).toBeDefined();
    const link = findButton(getByTestId);
    expect(link).toBeDefined();
    expect(link.textContent).toBe('Add entry');
    expect(getByTestId('dropdown-icon')).toBeDefined();
    expect(() => getByTestId('add-entry-menu')).toThrow(
      'Unable to find an element by: [data-test-id="add-entry-menu"]'
    );
  });

  it('renders dropdown menu on click when with multiple content types', () => {
    const { getByTestId } = render(<CreateEntryLinkButton {...props} />);
    fireEvent.click(findButton(getByTestId));
    const menu = getByTestId('add-entry-menu');
    expect(menu).toBeDefined();
    const menuItems = menu.querySelectorAll('[role="menuitem"]');
    expect(menuItems).toHaveLength(props.contentTypes.length);
    menuItems.forEach((item, index) =>
      expect(item.textContent).toBe(props.contentTypes[index].name)
    );
  });

  it('renders custom text, icon', () => {
    const propsOverrides = {
      text: 'CUSTOM_TEXT',
      hasPlusIcon: true
    };
    const { getByTestId } = render(<CreateEntryLinkButton {...props} {...propsOverrides} />);
    const link = findButton(getByTestId);
    expect(link.textContent).toBe(propsOverrides.text);
    expect(link.querySelectorAll('svg')).toHaveLength(2);
  });
});

describe('CreateEntryLinkButton with multiple entries', () => {
  afterEach(cleanup);

  const props = {
    contentTypes: [CONTENT_TYPE_1, CONTENT_TYPE_2, CONTENT_TYPE_3],
    onSelect: noop
  };

  it('should display and close menu on button click', () => {
    const { getByTestId } = render(<CreateEntryLinkButton {...props} />);
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
    const { getByTestId } = render(<CreateEntryLinkButton {...props} />);
    fireEvent.click(findButton(getByTestId));
    expect(getByTestId('dropdown-icon')).toHaveLength(props.contentTypes.length);
  });

  it('calls onSelect after click on menu item', () => {
    // TODO: Possibly remove once menu is replace with forma if handled by forma automatically.
    // No need to test what was already tested in forma repo
    const selectSpy = jest.fn();
    const { getByTestId, getAllByTestId } = render(
      <CreateEntryLinkButton {...props} onSelect={selectSpy} />
    );
    fireEvent.click(findButton(getByTestId));
    fireEvent.click(getAllByTestId('contentType')[1]);
    expect(selectSpy).toHaveBeenCalledWith(CONTENT_TYPE_2.sys.id);
  });
});

describe('CreateEntryLinkButton with a single entry', () => {
  afterEach(cleanup);

  const props = {
    contentTypes: [CONTENT_TYPE_1],
    onSelect: noop
  };

  it('should fire the onSelect function when clicked', () => {
    const onSelectStub = jest.fn();
    const { getByTestId } = render(<CreateEntryLinkButton {...props} onSelect={onSelectStub} />);
    fireEvent.click(findButton(getByTestId));
    expect(onSelectStub).toHaveBeenCalledWith(props.contentTypes[0].sys.id);
    expect(() => getByTestId('cf-ui-spinner')).toThrow(
      'Unable to find an element by: [data-test-id="cf-ui-spinner"]'
    );
  });
});

describe('CreateEntryLinkButton common', () => {
  afterEach(cleanup);

  it('should render a spinner if onSelect returns a promise', async () => {
    const onSelect = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
    const { getByTestId, container } = render(
      <CreateEntryLinkButton contentTypes={[CONTENT_TYPE_1]} onSelect={onSelect} />
    );
    fireEvent.click(findButton(getByTestId));
    expect(onSelect).toHaveBeenCalled();
    const spinner = await waitForElement(() => getByTestId('cf-ui-spinner'), { container });
    expect(spinner).toBeDefined();
    expect(spinner.textContent).toMatch(/Loading/g);
  });

  it('should hide a spinner after the promise from onSelect resolves', async () => {
    const onSelect = jest.fn(() => new Promise(resolve => setTimeout(resolve, 500)));
    const { getByTestId, container } = render(
      <CreateEntryLinkButton contentTypes={[CONTENT_TYPE_1]} onSelect={onSelect} />
    );
    fireEvent.click(findButton(getByTestId));
    const getSpinner = () => getByTestId('cf-ui-spinner');
    const spinner = await waitForElement(getSpinner, { container });
    expect(spinner).toBeDefined();
    await waitForElementToBeRemoved(() => document.querySelector('[data-test-id="cf-ui-spinner"]'));
    expect(getSpinner).toThrow('Unable to find an element by: [data-test-id="cf-ui-spinner"]');
  });

  it('does not emit onSelect on subsequent click before the promise from onSelect resolves', async () => {
    const onSelect = jest.fn(() => new Promise(resolve => setTimeout(() => resolve(), 200)));
    const { getByTestId } = render(
      <CreateEntryLinkButton contentTypes={[CONTENT_TYPE_1]} onSelect={onSelect} />
    );
    fireEvent.click(findButton(getByTestId));
    fireEvent.click(findButton(getByTestId));
    fireEvent.click(findButton(getByTestId));
    await wait(noop, 1000);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('emits onSelect on subsequent click after the promise from onSelect resolves', async () => {
    const onSelect = jest.fn(() => Promise.resolve());
    const { getByTestId } = render(
      <CreateEntryLinkButton contentTypes={[CONTENT_TYPE_1]} onSelect={onSelect} />
    );
    fireEvent.click(findButton(getByTestId));
    await wait(noop, 100);
    fireEvent.click(findButton(getByTestId));
    expect(onSelect).toHaveBeenCalledTimes(2);
  });
});
