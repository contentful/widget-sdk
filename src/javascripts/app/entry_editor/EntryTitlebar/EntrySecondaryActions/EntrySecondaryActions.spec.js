import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import * as Navigator from 'states/Navigator';
import EntrySecondaryActions from './EntrySecondaryActions';

const mockEntry = { data: { sys: { id: 'entryId' } } };
const mockCurrentSpace = {
  createEntry: jest.fn().mockReturnValue(Promise.resolve(mockEntry)),
};

jest.mock('core/services/SpaceEnvContext', () => {
  return {
    useSpaceEnvContext: () => ({
      currentSpace: mockCurrentSpace,
    }),
    useSpaceEnvContentTypes: () => {
      return {
        currentSpaceContentTypes: [
          {
            fields: [],
            sys: {
              id: 'ctid',
            },
          },
        ],
      };
    },
  };
});

jest.mock('states/Navigator');
jest.mock('access_control/AccessChecker', () => ({
  canPerformActionOnEntryOfType: jest.fn().mockReturnValue(true),
}));
jest.mock('@contentful/editorial-primitives', () => ({
  valuePropertyAt: jest.fn(),
}));
jest.mock('core/utils/kefir', () => ({
  getValue: jest.fn().mockReturnValue([]),
}));
jest.mock('app/entity_editor/entityHelpers', () => ({
  alignSlugWithEntryTitle: jest.fn(),
  appendDuplicateIndexToEntryTitle: jest.fn(),
}));

const onDelete = { execute: jest.fn() };

describe('EntrySecondaryActions', () => {
  const build = (props) => {
    const resultProps = {
      entityInfo: {
        id: 'entryId',
        contentType: {
          name: 'ContentType',
        },
        contentTypeId: 'ctid',
      },
      editorData: {
        editorInterface: {
          controls: [],
        },
      },
      otDoc: {},
      preferences: {},
      onDelete,
      onShowDisabledFields: jest.fn(),
      ...props,
    };

    return [render(<EntrySecondaryActions {...resultProps} />), resultProps];
  };

  it.each([
    ['createEntry', 'cf-ui-button-action-add'],
    ['createEntry', 'cf-ui-button-action-duplicate'],
  ])('Creates an entry for the current content type using %p', async (action, actionTestId) => {
    const [renderResult] = build();
    await triggerAction(renderResult, actionTestId);
    expect(mockCurrentSpace[action]).toHaveBeenCalled();
    expect(Navigator.go).toHaveBeenCalledWith({
      path: '^.detail',
      params: {
        entryId: mockEntry.data.sys.id,
        previousEntries: '',
        addToContext: false,
      },
    });
  });

  it('deletes the current entry', async () => {
    const [renderResult] = build();
    await triggerAction(renderResult, 'cf-ui-button-action-delete');
    expect(onDelete.execute).toHaveBeenCalledWith();
  });

  it('shows disabled fields', async () => {
    const preferences = { showDisabledFields: false };
    const [renderResult] = build({ preferences });
    await triggerAction(renderResult, 'cf-ui-button-action-show-disabled-fields');
    expect(preferences.showDisabledFields).toBe(true);
  });
});

async function triggerAction(renderResult, actionTestId) {
  fireEvent.click(renderResult.getByTestId('cf-ui-button-actions'));
  fireEvent.click(renderResult.getByTestId(actionTestId).querySelector('button'));
  await waitFor(() => {});
}
