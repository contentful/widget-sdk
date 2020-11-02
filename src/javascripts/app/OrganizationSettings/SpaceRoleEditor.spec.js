import React from 'react';
import { render, within } from '@testing-library/react';
import { ADMIN_ROLE_ID } from 'access_control/constants';
import SpaceRoleEditor from './SpaceRoleEditor';

describe('SpaceRoleEditor', () => {
  let changeCb;

  const roleOptions = [
    {
      name: 'Police officer',
      sys: { id: 'police' },
    },
    {
      name: 'Thief',
      sys: { id: 'thief' },
    },
  ];

  const build = (props) => {
    changeCb = jest.fn();
    const defaultProps = {
      options: roleOptions,
      value: [],
      onChange: changeCb,
    };

    return render(<SpaceRoleEditor {...Object.assign(defaultProps, props)} />);
  };

  it('renders the component', () => {
    expect(build().container).toMatchSnapshot();
  });

  it('shows a list of options', async () => {
    const { container, findByRole } = build();
    const dropdownButton = await findByRole('button');
    dropdownButton.click();
    expect(container).toMatchSnapshot();
  });

  it('shows only admin role if no any other role options are available', async () => {
    const { findByRole, queryAllByTestId } = build({ options: [] });

    const dropdownButton = await findByRole('button');
    dropdownButton.click();

    const roleOptions = queryAllByTestId('space-role-editor.role-option');
    expect(roleOptions).toHaveLength(0);
  });

  it('removes the admin role if any other role is selected', async () => {
    const { findByRole, findAllByTestId } = build({ value: [ADMIN_ROLE_ID] });

    const dropdownButton = await findByRole('button');
    dropdownButton.click();

    const roleOptions = await findAllByTestId('space-role-editor.role-option');
    const roleOptionButton = await within(roleOptions[0]).findByRole('button');
    roleOptionButton.click();

    expect(changeCb).toHaveBeenCalledWith(['police']);
  });

  it('removes any other role if admin is selected', async () => {
    const { findByRole, findByTestId } = build({ value: ['police', 'thief'] });

    const dropdownButton = await findByRole('button');
    dropdownButton.click();

    const adminOption = await findByTestId('space-role-editor.admin-option');
    const adminOptionButton = await within(adminOption).findByRole('button');
    adminOptionButton.click();

    expect(changeCb).toHaveBeenCalledWith([ADMIN_ROLE_ID]);
  });

  it('allows multiple roles', async () => {
    const { findByRole, findAllByTestId } = build({ value: ['police'] });

    const dropdownButton = await findByRole('button');
    dropdownButton.click();

    const roleOptions = await findAllByTestId('space-role-editor.role-option');
    const roleOptionButton = await within(roleOptions[1]).findByRole('button');
    roleOptionButton.click();

    expect(changeCb).toHaveBeenCalledWith(['police', 'thief']);
  });
});
