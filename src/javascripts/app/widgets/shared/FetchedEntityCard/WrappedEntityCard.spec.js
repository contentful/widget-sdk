import React from 'react';
import { render, waitForElement } from '@testing-library/react';
import EntityCard from './WrappedEntityCard';
import ScheduledActionActions from 'app/ScheduledActions/ScheduledActionAction';
import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext';

describe('WrappedEntityCard', () => {
  const JOB_ENTITY_ID = 'entity-id';
  const JOB_ENTITY_TYPE = 'Entry';
  let jobs;
  let widgetAPIMock;

  beforeEach(() => {
    jobs = [
      {
        action: ScheduledActionActions.Publish,
        scheduledFor: {
          datetime: new Date().toISOString()
        },
        entity: {
          sys: {
            id: JOB_ENTITY_ID,
            linkType: JOB_ENTITY_TYPE,
            type: 'Link'
          }
        },
        sys: {
          id: 'job1'
        }
      }
    ];

    widgetAPIMock = {
      scheduledActions: {
        getEntityScheduledActions: jest.fn().mockResolvedValue(jobs)
      }
    };
  });

  it('should display the tooltip with an icon for a scheduled entry', async () => {
    const { getByTestId } = render(
      <WidgetAPIContext.Provider value={{ widgetAPI: widgetAPIMock }}>
        <EntityCard
          entityId={JOB_ENTITY_ID}
          entityType={JOB_ENTITY_TYPE}
          contentTypeName="SomeEntry"
          entityDescription="Test"
          entityTitle="Hello world"
          statusIcon="Clock"
          readOnly={true}
        />
      </WidgetAPIContext.Provider>
    );

    await waitForElement(() => getByTestId('schedule-icon'));
    expect(widgetAPIMock.scheduledActions.getEntityScheduledActions).toHaveBeenCalledWith(
      'Entry',
      'entity-id'
    );
  });

  it('should not display the tooltip with an icon for an entry that was not scheduled', async () => {
    const widgetAPI = {
      scheduledActions: {
        getEntityScheduledActions: jest.fn().mockResolvedValue([])
      }
    };
    const { getByTestId } = render(
      <WidgetAPIContext.Provider
        value={{
          widgetAPI: widgetAPI
        }}>
        <EntityCard
          entityId="another-entity-not-scheduled"
          entityType="Entry"
          contentTypeName="SomeEntry"
          entityDescription="Test"
          entityTitle="Hello world"
          statusIcon="Clock"
          readOnly={true}
        />
      </WidgetAPIContext.Provider>
    );

    let foundIcon = true;

    try {
      await waitForElement(() => getByTestId('schedule-icon'));
    } catch (e) {
      foundIcon = false;
    }

    expect(foundIcon).toBeFalsy();
    expect(widgetAPI.scheduledActions.getEntityScheduledActions).toHaveBeenCalledWith(
      'Entry',
      'another-entity-not-scheduled'
    );
  });
});
