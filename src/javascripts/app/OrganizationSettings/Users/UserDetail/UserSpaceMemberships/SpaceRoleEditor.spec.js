import React from 'react';
import { mount } from 'enzyme';
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

  beforeEach(() => {});

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
    component.props({ value: ['admin'] });
    component.find('button').simulate('click');
    component
      .find('input')
      .at(1)
      .simulate('change', { target: { checked: true } });
    expect(changeCb).toHaveBeenCalledWith(['police']);
  });

  it('removes any other role if admin is selected', () => {
    const component = render();
    component.props({ value: ['police', 'thief'] });
    component.find('button').simulate('click');
    component
      .find('input')
      .at(0)
      .simulate('change', { target: { checked: true } });
    expect(changeCb).toHaveBeenCalledWith(['admin']);
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
