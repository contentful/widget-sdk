import {
  BulkTaggingProvider,
  useBulkTaggingProvider,
} from 'features/content-tags/editor/state/BulkTaggingProvider';
import React, { useEffect, useState } from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { cloneDeep } from 'lodash';
import '@testing-library/jest-dom/extend-expect';

const STATES = {
  initialTag: { value: 'tag-one', occurrence: 5, label: 'Tag one' },
  initialTagRemoved: { value: 'tag-one', occurrence: 0, label: 'Tag one' },
  initialTagAppliedToAll: { value: 'tag-one', occurrence: 10, label: 'Tag one' },
  newTag: { value: 'tag-two', occurrence: 10, label: 'Tag two' },
};

const MapOf = (state) => {
  const result = new Map();
  if (Array.isArray(state)) {
    state.forEach((s) => result.set(s.value, s));
  } else {
    result.set(state.value, state);
  }
  return result;
};

const TestComponent = ({ statesSequence }) => {
  const { hasChanges, push, back, renderState } = useBulkTaggingProvider();
  const [sequence, setSequence] = useState(statesSequence);

  const pushNextState = () => {
    const nextSequence = cloneDeep(sequence);
    push(nextSequence.shift());
    setSequence(nextSequence);
  };

  useEffect(() => {
    if (statesSequence) {
      // set initial state
      pushNextState();
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderTag = (tag) => {
    return (
      <li data-test-id={`result-list-item-${tag.value}`} id={tag.value} key={tag.value}>
        <label data-test-id={`label-${tag.value}`}>{tag.label}</label>
        <label data-test-id={`occurrence-${tag.value}`}>{tag.occurrence}</label>
        <label data-test-id={`change-type-${tag.value}`}>{tag.changeType}</label>
      </li>
    );
  };

  return (
    <React.Fragment>
      <input readOnly={true} type="checkbox" data-test-id={'has-changes'} checked={hasChanges} />
      <button onClick={pushNextState} data-test-id={'push-button'} />
      <button onClick={back} data-test-id={'back-button'} />
      <ul data-test-id={'result-list-new'}>{renderState.newTags.map(renderTag)}</ul>
      <ul data-test-id={'result-list'}>{renderState.tags.map(renderTag)}</ul>
    </React.Fragment>
  );
};

const withProvider = (children) => {
  return <BulkTaggingProvider>{children}</BulkTaggingProvider>;
};

const setup = (statesSequence) => {
  const queries = render(withProvider(<TestComponent statesSequence={statesSequence} />));
  return {
    events: { ...userEvent, ...fireEvent },
    hasChanges: queries.getByTestId('has-changes'),
    pushButton: queries.getByTestId('push-button'),
    backButton: queries.getByTestId('back-button'),
    newTagsList: queries.getByTestId('result-list-new'),
    tagsList: queries.getByTestId('result-list'),
    queries,
  };
};

describe('A BulkTaggingProvider', () => {
  it('initializes with no state', () => {
    const { hasChanges } = setup();
    expect(hasChanges).toBeInTheDocument();
    expect(hasChanges).toHaveProperty('checked', false);
  });

  it('can push new state', async () => {
    const { hasChanges, pushButton, tagsList, newTagsList } = setup([
      MapOf(STATES.initialTag),
      MapOf(STATES.initialTagAppliedToAll),
    ]);

    await act(async () => {
      pushButton.click();
    });

    expect(tagsList.children).toHaveLength(1);
    expect(newTagsList.children).toHaveLength(0);
    expect(hasChanges).toHaveProperty('checked', true);
  });

  it('can push new state and walk back', async () => {
    const { hasChanges, pushButton, backButton } = setup([
      MapOf(STATES.initialTag),
      MapOf(STATES.initialTagAppliedToAll),
    ]);

    await act(async () => {
      pushButton.click();
      backButton.click();
    });

    expect(hasChanges).toHaveProperty('checked', false);
  });

  it('can compute a changeType', async () => {
    const { pushButton, backButton, queries } = setup([
      MapOf(STATES.initialTag),
      MapOf(STATES.initialTagAppliedToAll),
      MapOf(STATES.initialTagRemoved),
    ]);

    expect(queries.getByTestId('change-type-tag-one')).toHaveTextContent('NONE');
    expect(queries.getByTestId('occurrence-tag-one')).toHaveTextContent('5');

    await act(async () => {
      pushButton.click();
    });

    expect(queries.getByTestId('change-type-tag-one')).toHaveTextContent('ALL');
    expect(queries.getByTestId('occurrence-tag-one')).toHaveTextContent('10');

    await act(async () => {
      pushButton.click();
    });

    expect(queries.getByTestId('change-type-tag-one')).toHaveTextContent('REMOVED');
    expect(queries.getByTestId('occurrence-tag-one')).toHaveTextContent('0');

    await act(async () => {
      backButton.click();
    });

    expect(queries.getByTestId('change-type-tag-one')).toHaveTextContent('ALL');
    expect(queries.getByTestId('occurrence-tag-one')).toHaveTextContent('10');
  });

  it('can compute a changeType for a new tag', async () => {
    const { pushButton, queries, tagsList, newTagsList } = setup([
      MapOf(STATES.initialTag),
      MapOf([STATES.initialTag, STATES.newTag]),
    ]);

    await act(async () => {
      pushButton.click();
    });

    expect(tagsList.children).toHaveLength(1);
    expect(newTagsList.children).toHaveLength(1);

    expect(queries.getByTestId('change-type-tag-one')).toHaveTextContent('NONE');
    expect(queries.getByTestId('occurrence-tag-one')).toHaveTextContent('5');
    expect(queries.getByTestId('change-type-tag-two')).toHaveTextContent('NEW');
    expect(queries.getByTestId('occurrence-tag-two')).toHaveTextContent('10');
  });
});
