import React from 'react';
import { Button } from '@contentful/forma-36-react-components';
import { render, fireEvent } from '@testing-library/react';
import StateLink from './StateLink';
import * as $stateMocked from 'ng/$state';

describe('StateLink', () => {
  beforeEach(() => {
    $stateMocked.go.mockClear();
    $stateMocked.href.mockClear();
  });

  it('should render <a>', () => {
    const { container } = render(<StateLink path="home.list" params={{ foo: 'bar' }} />);

    expect(container).toMatchInlineSnapshot(`
      <div>
        <a
          href="home.list?foo=bar"
        />
      </div>
    `);

    fireEvent.click(container.querySelector('a'));

    expect($stateMocked.href).toHaveBeenCalledWith('home.list', { foo: 'bar' });
    expect($stateMocked.go).toHaveBeenCalledWith('home.list', { foo: 'bar' }, undefined);
  });

  it('should render custom component', () => {
    const { container } = render(
      <StateLink component={Button} path="home.list" params={{ foo: 'bar' }} />
    );

    expect(container).toMatchInlineSnapshot(`
<div>
  <a
    class="Button__Button___1ZfFj a11y__focus-border--default___60AXp Button__Button--primary___JImeO"
    data-test-id="cf-ui-button"
    href="home.list?foo=bar"
    type="button"
  >
    <span
      class="TabFocusTrap__TabFocusTrap___39Vty Button__Button__inner-wrapper___3qrNC"
      tabindex="-1"
    />
  </a>
</div>
`);

    fireEvent.click(container.querySelector('a'));

    expect($stateMocked.href).toHaveBeenCalledWith('home.list', { foo: 'bar' });
    expect($stateMocked.go).toHaveBeenCalledWith('home.list', { foo: 'bar' }, undefined);
  });

  it('should pass all params to $state.go', () => {
    const { container } = render(
      <StateLink path="home.list" params={{ foo: 'bar' }} options={{ replace: true }} />
    );
    fireEvent.click(container.querySelector('a'));
    expect($stateMocked.href).toHaveBeenCalledWith('home.list', { foo: 'bar' });
    expect($stateMocked.go).toHaveBeenCalledWith('home.list', { foo: 'bar' }, { replace: true });
  });

  it('can be used as render prop and pass down onClick function', () => {
    const { container } = render(
      <StateLink path="home.list" params={{ foo: 'bar' }}>
        {({ onClick }) => <Button onClick={onClick}>Click me</Button>}
      </StateLink>
    );
    fireEvent.click(container.querySelector('button'));
    expect($stateMocked.href).not.toHaveBeenCalled();
    expect($stateMocked.go).toHaveBeenCalledWith('home.list', { foo: 'bar' }, undefined);
  });
});
