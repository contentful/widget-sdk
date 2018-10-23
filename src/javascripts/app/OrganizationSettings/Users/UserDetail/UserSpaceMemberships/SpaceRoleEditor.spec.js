import React from 'react';
import { mount } from 'enzyme';
import SpaceRoleEditor from './SpaceRoleEditor.es6';
import sinon from 'sinon';

const MockedProvider = require('../../../../../reactServiceContext').MockedProvider;

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
    changeCb = sinon.stub();
    const defaultProps = {
      options: roleOptions,
      value: [],
      onChange: changeCb
    };

    return mount(
      <MockedProvider
        services={{
          'access_control/SpaceMembershipRepository.es6': {
            ADMIN_ROLE: {
              name: 'Admin',
              sys: { id: 'admin' }
            },
            ADMIN_ROLE_ID: 'admin'
          }
        }}>
        <SpaceRoleEditor {...Object.assign(defaultProps, props)} />
      </MockedProvider>
    );
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
    expect(changeCb.getCall(0).args[0]).toEqual(['police']);
  });

  it('removes any other role if admin is selected', () => {
    const component = render();
    component.props({ value: ['police', 'thief'] });
    component.find('button').simulate('click');
    component
      .find('input')
      .at(0)
      .simulate('change', { target: { checked: true } });
    expect(changeCb.getCall(0).args[0]).toEqual(['admin']);
  });

  it('allows multiple roles', () => {
    const component = render({ value: ['police'] });
    component.find('button').simulate('click');
    component
      .find('input')
      .at(2)
      .simulate('change', { target: { checked: true } });
    expect(changeCb.getCall(0).args[0]).toEqual(expect.arrayContaining(['police', 'thief']));
  });
});
