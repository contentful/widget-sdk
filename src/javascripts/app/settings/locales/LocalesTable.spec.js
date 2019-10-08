import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { render, cleanup, fireEvent } from '@testing-library/react';
import * as $stateMocked from 'ng/$state';
import LocalesTable from './LocalesTable.es6';

describe('app/settings/locales/LocalesTable', () => {
  beforeEach(() => {
    $stateMocked.go.mockClear();
  });

  afterEach(cleanup);

  const locales = [
    {
      sys: { id: 1 },
      name: 'English',
      code: 'en-US',
      default: true,
      contentManagementApi: true,
      contentDeliveryApi: true,
      optional: false,
      fallbackCode: null
    },
    {
      sys: { id: 2 },
      name: 'German',
      code: 'de-DE',
      default: false,
      contentManagementApi: false,
      contentDeliveryApi: false,
      optional: true,
      fallbackCode: 'en-US'
    },
    {
      sys: { id: 3 },
      name: 'Polish',
      code: 'pl-PL',
      default: false,
      contentManagementApi: true,
      contentDeliveryApi: false
    },
    {
      sys: { id: 4 },
      name: 'Tajik',
      code: 'tg-TG',
      default: false,
      contentManagementApi: false,
      contentDeliveryApi: true
    }
  ];

  const renderComponent = () => {
    const { container } = render(<LocalesTable locales={locales} />);
    const list = container.querySelector('tbody');
    const rows = list.querySelectorAll('tr');
    const cells = list.querySelectorAll('td');
    return { list, rows, cells };
  };

  it('show locales fetched with spaceContext', () => {
    expect.assertions(1);
    const { rows } = renderComponent();
    expect(rows).toHaveLength(4);
  });

  it('shows fallback locale', () => {
    expect.assertions(2);
    const { cells } = renderComponent();
    expect(cells[1]).toHaveTextContent('None');
    expect(cells[6]).toHaveTextContent('English (en-US)');
  });

  it('shows if available via CDA', () => {
    expect.assertions(2);

    const { cells } = renderComponent();

    expect(cells[2]).toHaveTextContent('Enabled');
    expect(cells[7]).toHaveTextContent('Disabled');
  });

  it('shows if available via CMA', () => {
    expect.assertions(2);

    const { cells } = renderComponent();

    expect(cells[3]).toHaveTextContent('Enabled');
    expect(cells[8]).toHaveTextContent('Disabled');
  });

  it('shows if optional for publishing', () => {
    expect.assertions(2);

    const { cells } = renderComponent();

    expect(cells[4]).toHaveTextContent('Content is required');
    expect(cells[9]).toHaveTextContent('Can be published empty');
  });

  it('click on row should redirect to details page', () => {
    expect.assertions(2);
    const { rows } = renderComponent();

    fireEvent.click(rows[0]);
    expect($stateMocked.go).toHaveBeenCalledWith('^.detail', { localeId: 1 }, undefined);

    fireEvent.click(rows[3]);
    expect($stateMocked.go).toHaveBeenCalledWith('^.detail', { localeId: 4 }, undefined);
  });
});
