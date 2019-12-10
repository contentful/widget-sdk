import React from 'react';
import { render, wait, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import * as Navigator from 'states/Navigator';
import EntrySecondaryActions from './EntrySecondaryActions';

jest.mock('states/Navigator');
jest.mock('access_control/AccessChecker', () => ({
  canPerformActionOnEntryOfType: jest.fn().mockReturnValue(true)
}));

const entry = { data: { sys: { id: 'entryId' } } };
const entryActions = {
  onAdd: jest.fn().mockReturnValue(Promise.resolve(entry)),
  onDuplicate: jest.fn().mockReturnValue(Promise.resolve(entry)),
  onShowDisabledFields: jest.fn()
};
const onDelete = { execute: jest.fn() };
describe('EntrySecondaryActions', () => {
  afterEach(cleanup);
  const build = props => {
    const resultProps = {
      entityInfo: {
        id: 'entryId',
        contentType: {
          name: 'ContentType'
        }
      },
      entryActions,
      onDelete,
      ...props
    };

    return [render(<EntrySecondaryActions {...resultProps} />), resultProps];
  };

  it.each([['onAdd', 'cf-ui-button-action-add'], ['onDuplicate', 'cf-ui-button-action-duplicate']])(
    'Creates an entry for the current content type using %p',
    async (action, actionTestId) => {
      const [renderResult] = build();
      await triggerAction(renderResult, actionTestId);
      expect(entryActions[action]).toHaveBeenCalled();
      expect(Navigator.go).toHaveBeenCalledWith({
        path: '^.detail',
        params: {
          entryId: entry.data.sys.id,
          previousEntries: '',
          addToContext: false
        }
      });
    }
  );

  it('deletes the current entry', async () => {
    const [renderResult] = build();
    await triggerAction(renderResult, 'cf-ui-button-action-delete');
    expect(onDelete.execute).toHaveBeenCalledWith();
  });

  it('shows disabled fields', async () => {
    const [renderResult] = build();
    await triggerAction(renderResult, 'cf-ui-button-action-show-disabled-fields');
    expect(entryActions.onShowDisabledFields).toHaveBeenCalledWith();
  });
});

async function triggerAction(renderResult, actionTestId) {
  fireEvent.click(renderResult.getByTestId('cf-ui-button-actions'));
  fireEvent.click(renderResult.getByTestId(actionTestId).querySelector('button'));
  await wait();
}
