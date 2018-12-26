import React from 'react';
import Enzyme from 'enzyme';
import { UserNameFormatter } from './index.es6';

describe('UserNameFormatter', () => {
  const mount = (user, currentUser) =>
    Enzyme.mount(<UserNameFormatter user={user} currentUser={currentUser} />);
  it('renders Me if passed user is the logged-in user', () => {
    const user = { sys: { id: 1 } };
    const currentUser = { sys: { id: 1 } };

    const wrapper = mount(user, currentUser);

    expect(wrapper.text()).toBe('Me');
  });

  it('renders full name of the user if it differs from the logged-in user', () => {
    const user = { sys: { id: 1 }, firstName: 'John', lastName: 'Doe' };
    const currentUser = { sys: { id: 2 } };

    const wrapper = mount(user, currentUser);

    expect(wrapper.text()).toBe('John Doe');
  });

  it('renders nothing if one of the users is not passed', () => {
    const user = null;
    const currentUser = { sys: { id: 2 } };

    const wrapper = mount(user, currentUser);

    expect(wrapper.text()).toBe('');
  });
});
