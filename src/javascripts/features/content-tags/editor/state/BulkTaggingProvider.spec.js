import {
  BulkTaggingProvider,
  useBulkTaggingProvider,
} from 'features/content-tags/editor/state/BulkTaggingProvider';
import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const TestComponent = ({ newState }) => {
  const { hasChanges, push } = useBulkTaggingProvider();
  const pushState = () => {
    push(newState);
  };
  return (
    <React.Fragment>
      <input readOnly={true} type="checkbox" data-test-id={'has-changes'} checked={hasChanges} />
      <button onClick={pushState} data-test-id={'push-button'}>
        push button
      </button>
    </React.Fragment>
  );
};

const withProvider = (children) => {
  return <BulkTaggingProvider>{children}</BulkTaggingProvider>;
};

const setup = (newState) => {
  const queries = render(withProvider(<TestComponent newState={newState} />));
  return {
    events: { ...userEvent, ...fireEvent },
    hasChanges: queries.getByTestId('has-changes'),
    pushButton: queries.getByTestId('push-button'),
    queries,
  };
};

describe('A BulkTaggingProvider', () => {
  it('initializes with no changes', () => {
    const { hasChanges } = setup();
    expect(hasChanges).toBeInTheDocument();
    expect(hasChanges).toHaveProperty('checked', false);
  });

  it('can push new state', async () => {
    const state = new Map();

    state.set('tag-one', { value: 'tag-one', occurrence: 1, label: 'Tag one' });

    const { hasChanges, pushButton } = setup(state);

    act(() => {
      /* we have to push twice, since the initial state is not counted as a change */
      pushButton.click();
      pushButton.click();
    });

    expect(hasChanges).toHaveProperty('checked', true);
  });
});
