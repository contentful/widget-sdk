import React from 'react';
import Enzyme from 'enzyme';
import StateLink from './StateLink.es6';
import $state from '$state';

describe('StateLink', () => {
  beforeEach(() => {
    $state.go.resetHistory();
    $state.href.resetHistory();
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
    expect($state.href.calledWith('home.list')).toBeTruthy();
    expect($state.go.calledWith('home.list')).toBeTruthy();
  });

  it('should pass all params to $state.go', () => {
    const wrapper = Enzyme.mount(
      <StateLink to="home.list" params={{ foo: 'bar' }} options={{ replace: true }} />
    );
    wrapper.find('a').simulate('click');
    expect($state.href.calledWith('home.list', { foo: 'bar' })).toBeTruthy();
    expect($state.go.calledWith('home.list', { foo: 'bar' }, { replace: true })).toBeTruthy();
  });

  it('can be used as render prop and pass down onClick function', () => {
    const wrapper = Enzyme.mount(
      <StateLink to="home.list" params={{ foo: 'bar' }}>
        {({ onClick }) => <button onClick={onClick}>Click me</button>}
      </StateLink>
    );
    wrapper.find('button').simulate('click');
    expect($state.href.called).toBeFalsy();
    expect($state.go.calledWith('home.list', { foo: 'bar' })).toBeTruthy();
  });
});
