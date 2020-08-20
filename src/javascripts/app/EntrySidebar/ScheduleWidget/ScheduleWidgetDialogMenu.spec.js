import React from 'react';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { ScheduleWidgetDialogMenu } from './ScheduleWidgetDialogMenu';
import * as Popup from 'app/entity_editor/UnpublishedReferencesWarning';

describe('SchedulesTimelineWidgetDialogMenu', () => {
  afterEach(cleanup);
  const getComponentProps = (overrides) => ({
    entity: {
      sys: {
        id: 'entity-id',
        type: 'Entry',
      },
    },
    toggleScheduledActionsDialog: jest.fn(),
    isScheduleEntryDialogShown: false,
    isScheduledActionsFeatureEnabled: false,
    spaceId: 'space-id',
    environmentId: 'master',
    ...overrides,
  });

  it('should render the option to scheduled action if scheduled actions feature is enabled', async () => {
    const props = getComponentProps({ isScheduledActionsFeatureEnabled: true });
    const { getByTestId } = render(<ScheduleWidgetDialogMenu {...props} />);

    expect(getByTestId('schedule-entity-button')).toBeDefined();

    jest.spyOn(Popup, 'showUnpublishedReferencesWarning').mockResolvedValue(true);
    fireEvent.click(getByTestId('schedule-entity-button'));

    await waitFor(() => expect(props.toggleScheduledActionsDialog).toHaveBeenCalled());
  });
});
