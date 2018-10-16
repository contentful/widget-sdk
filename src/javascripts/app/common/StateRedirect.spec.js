import React from 'react';
import Enzyme from 'enzyme';
import $state from '$state';
import StateRedirect from './StateRedirect.es6';

describe('StateRedirect', () => {
  beforeEach(() => {
    $state.go.resetHistory();
  });
  it('should redirect to passed params when it is mounted', () => {
    Enzyme.mount(
      <StateRedirect to="home.list" params={{ foo: 'bar' }} options={{ replace: true }} />
    );
    expect($state.go.calledWith('home.list', { foo: 'bar' }, { replace: true })).toBeTruthy();
  });
});
