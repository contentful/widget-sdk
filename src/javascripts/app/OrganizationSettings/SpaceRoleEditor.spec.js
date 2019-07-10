import React from 'react';
import { mount } from 'enzyme';
import { ADMIN_ROLE_ID } from 'access_control/constants.es6';
import SpaceRoleEditor from './SpaceRoleEditor.es6';

describe('SpaceRoleEditor', () => {
  let changeCb;

  const roleOptions = [
    {
      name: 'Police officer',
      sys: { id: 'police' }
    },
    {
      name: 'Thief',
      sys: { id: 'thief' }
    }
  ];

  const render = props => {
    changeCb = jest.fn();
    const defaultProps = {
      options: roleOptions,
      value: [],
      onChange: changeCb
    };

    return mount(<SpaceRoleEditor {...Object.assign(defaultProps, props)} />);
  };

  it('renders the component', () => {
    expect(render()).toMatchSnapshot();
  });

  it('shows a list of options', () => {
    const component = render();
    component.find('button').simulate('click');
    expect(component).toMatchSnapshot();
  });

  it('removes the admin role if any other role is selected', () => {
    const component = render();
    component.props({ value: [ADMIN_ROLE_ID] });
    component.find('button').simulate('click');
    component
      .find('[data-test-id="space-role-editor.role-option"]')
      .at(0)
      .find('button')
      .simulate('click');
    expect(changeCb).toHaveBeenCalledWith(['police']);
  });

  it('removes any other role if admin is selected', () => {
    const component = render();
    component.props({ value: ['police', 'thief'] });
    component.find('button').simulate('click');
    component
      .find('[data-test-id="space-role-editor.admin-option"]')
      .find('button')
      .simulate('click');
    expect(changeCb).toHaveBeenCalledWith([ADMIN_ROLE_ID]);
  });

  it('allows multiple roles', () => {
    const component = render({ value: ['police'] });
    component.find('button').simulate('click');
    component
      .find('input')
      .at(2)
      .simulate('change', { target: { checked: true } });
    expect(changeCb).toHaveBeenCalledWith(['police', 'thief']);
  });
});
