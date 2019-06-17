import React from 'react';
import 'jest-dom/extend-expect';
import { render, cleanup } from '@testing-library/react';
import * as $stateMocked from 'ng/$state';
import StateRedirect from './StateRedirect.es6';

describe('StateRedirect', () => {
  beforeEach(() => {
    $stateMocked.go.mockClear();
  });
  afterEach(cleanup);
  it('should redirect to passed params when it is mounted', () => {
    render(<StateRedirect to="home.list" params={{ foo: 'bar' }} options={{ replace: true }} />);
    expect($stateMocked.go).toHaveBeenCalledWith('home.list', { foo: 'bar' }, { replace: true });
  });
});
