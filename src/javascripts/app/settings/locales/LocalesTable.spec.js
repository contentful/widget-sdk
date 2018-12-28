import React from 'react';
import Enzyme from 'enzyme';
import * as $stateMocked from 'ng/$state';
import LocalesTable from './LocalesTable.es6';

describe('app/settings/locales/LocalesTable', () => {
  beforeEach(() => {
    $stateMocked.go.mockClear();
  });

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

  const mount = () => {
    const wrapper = Enzyme.mount(<LocalesTable locales={locales} />);
    const list = wrapper.find('tbody');
    const rows = list.find('tr');
    const cells = list.find('td');
    return { wrapper, list, rows, cells };
  };

  it('show locales fetched with spaceContext', () => {
    expect.assertions(1);
    const { rows } = mount();
    expect(rows).toHaveLength(4);
  });

  it('shows fallback locale', () => {
    expect.assertions(2);
    const { cells } = mount();
    expect(cells.at(1)).toHaveText('None');
    expect(cells.at(6)).toHaveText('English (en-US)');
  });

  it('shows if available via CDA', () => {
    expect.assertions(2);

    const { cells } = mount();

    expect(cells.at(2)).toHaveText('Enabled');
    expect(cells.at(7)).toHaveText('Disabled');
  });

  it('shows if available via CMA', () => {
    expect.assertions(2);

    const { cells } = mount();

    expect(cells.at(3)).toHaveText('Enabled');
    expect(cells.at(8)).toHaveText('Disabled');
  });

  it('shows if optional for publishing', () => {
    expect.assertions(2);

    const { cells } = mount();

    expect(cells.at(4)).toHaveText('Content is required');
    expect(cells.at(9)).toHaveText('Can be published empty');
  });

  it('click on row should redirect to details page', () => {
    expect.assertions(2);

    const { rows } = mount();
    rows.at(0).simulate('click');
    expect($stateMocked.go).toHaveBeenCalledWith('^.detail', { localeId: 1 }, undefined);
    rows.at(3).simulate('click');
    expect($stateMocked.go).toHaveBeenCalledWith('^.detail', { localeId: 4 }, undefined);
  });
});
