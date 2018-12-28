import React from 'react';
import Enzyme from 'enzyme';
import * as $stateMocked from 'ng/$state';
import StateRedirect from './StateRedirect.es6';

describe('StateRedirect', () => {
  beforeEach(() => {
    $stateMocked.go.mockClear();
  });
  it('should redirect to passed params when it is mounted', () => {
    Enzyme.mount(
      <StateRedirect to="home.list" params={{ foo: 'bar' }} options={{ replace: true }} />
    );
    expect($stateMocked.go).toHaveBeenCalledWith('home.list', { foo: 'bar' }, { replace: true });
  });
});
