import React from 'react';
import Enzyme from 'enzyme';
import StateLink from './StateLink.es6';
import * as $stateMocked from 'ng/$state';

describe('StateLink', () => {
  beforeEach(() => {
    $stateMocked.go.mockClear();
    $stateMocked.href.mockClear();
  });

  it('should render <a>', () => {
    const wrapper = Enzyme.mount(<StateLink to="home.list" />);
    expect(wrapper.find('a')).toMatchInlineSnapshot(`
<a
  href="http://url-for-state-home.list"
  onClick={[Function]}
/>
`);
    wrapper.find('a').simulate('click');
    expect($stateMocked.href).toHaveBeenCalledWith('home.list', undefined);
    expect($stateMocked.go).toHaveBeenCalledWith('home.list', undefined, undefined);
  });

  it('should pass all params to $state.go', () => {
    const wrapper = Enzyme.mount(
      <StateLink to="home.list" params={{ foo: 'bar' }} options={{ replace: true }} />
    );
    wrapper.find('a').simulate('click');
    expect($stateMocked.href).toHaveBeenCalledWith('home.list', { foo: 'bar' });
    expect($stateMocked.go).toHaveBeenCalledWith('home.list', { foo: 'bar' }, { replace: true });
  });

  it('can be used as render prop and pass down onClick function', () => {
    const wrapper = Enzyme.mount(
      <StateLink to="home.list" params={{ foo: 'bar' }}>
        {({ onClick }) => <button onClick={onClick}>Click me</button>}
      </StateLink>
    );
    wrapper.find('button').simulate('click');
    expect($stateMocked.href).not.toHaveBeenCalled();
    expect($stateMocked.go).toHaveBeenCalledWith('home.list', { foo: 'bar' }, undefined);
  });
});
