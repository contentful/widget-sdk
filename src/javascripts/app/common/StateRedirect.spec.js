import React from 'react';

import { render } from '@testing-library/react';
import * as $stateMocked from 'ng/$state';
import StateRedirect from './StateRedirect';

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('StateRedirect', () => {
  beforeEach(() => {
    $stateMocked.go.mockClear();
  });
  it('should redirect to passed params when it is mounted', async () => {
    render(<StateRedirect path="home.list" params={{ foo: 'bar' }} options={{ replace: true }} />);
    await flush();
    expect($stateMocked.go).toHaveBeenCalledWith('home.list', { foo: 'bar' }, { replace: true });
  });
});
