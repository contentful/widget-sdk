import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import * as Navigator from 'states/Navigator';
import EntrySecondaryActions from './EntrySecondaryActions';
import { SpaceEnvContext } from 'core/services/SpaceEnvContext/SpaceEnvContext';

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

const entry = { data: { sys: { id: 'entryId' } } };
const onDelete = { execute: jest.fn() };

const currentSpace = {
  createEntry: jest.fn().mockReturnValue(Promise.resolve(entry)),
};

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

    return [
      render(
        <SpaceEnvContext.Provider
          value={{
            currentSpaceContentTypes: [
              {
                fields: [],
                sys: {
                  id: resultProps.entityInfo.contentTypeId,
                },
              },
            ],
            currentSpace,
          }}>
          <EntrySecondaryActions {...resultProps} />
        </SpaceEnvContext.Provider>
      ),
      resultProps,
    ];
  };

  it.each([
    ['createEntry', 'cf-ui-button-action-add'],
    ['createEntry', 'cf-ui-button-action-duplicate'],
  ])('Creates an entry for the current content type using %p', async (action, actionTestId) => {
    const [renderResult] = build();
    await triggerAction(renderResult, actionTestId);
    expect(currentSpace[action]).toHaveBeenCalled();
    expect(Navigator.go).toHaveBeenCalledWith({
      path: '^.detail',
      params: {
        entryId: entry.data.sys.id,
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
