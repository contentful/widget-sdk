import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { render, cleanup, fireEvent } from '@testing-library/react';
import StateLink from './StateLink.es6';
import * as $stateMocked from 'ng/$state';

describe('StateLink', () => {
  beforeEach(() => {
    $stateMocked.go.mockClear();
    $stateMocked.href.mockClear();
  });

  afterEach(cleanup);

  it('should render <a>', () => {
    const { container } = render(<StateLink to="home.list" />);
    expect(container.querySelector('a')).toHaveAttribute('href', 'home.list');

    fireEvent.click(container.querySelector('a'));

    expect($stateMocked.href).toHaveBeenCalledWith('home.list', undefined);
    expect($stateMocked.go).toHaveBeenCalledWith('home.list', undefined, undefined);
  });

  it('should pass all params to $state.go', () => {
    const { container } = render(
      <StateLink to="home.list" params={{ foo: 'bar' }} options={{ replace: true }} />
    );
    fireEvent.click(container.querySelector('a'));
    expect($stateMocked.href).toHaveBeenCalledWith('home.list', { foo: 'bar' });
    expect($stateMocked.go).toHaveBeenCalledWith('home.list', { foo: 'bar' }, { replace: true });
  });

  it('can be used as render prop and pass down onClick function', () => {
    const { container } = render(
      <StateLink to="home.list" params={{ foo: 'bar' }}>
        {({ onClick }) => <button onClick={onClick}>Click me</button>}
      </StateLink>
    );
    fireEvent.click(container.querySelector('button'));
    expect($stateMocked.href).not.toHaveBeenCalled();
    expect($stateMocked.go).toHaveBeenCalledWith('home.list', { foo: 'bar' }, undefined);
  });
});
