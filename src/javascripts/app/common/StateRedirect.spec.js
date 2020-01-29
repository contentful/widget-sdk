import React from 'react';

import { render } from '@testing-library/react';
import * as $stateMocked from 'ng/$state';
import StateRedirect from './StateRedirect';

describe('StateRedirect', () => {
  beforeEach(() => {
    $stateMocked.go.mockClear();
  });
  it('should redirect to passed params when it is mounted', () => {
    render(<StateRedirect to="home.list" params={{ foo: 'bar' }} options={{ replace: true }} />);
    expect($stateMocked.go).toHaveBeenCalledWith('home.list', { foo: 'bar' }, { replace: true });
  });
});
