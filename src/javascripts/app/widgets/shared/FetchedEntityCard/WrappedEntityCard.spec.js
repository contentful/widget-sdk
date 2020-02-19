import React from 'react';
import { mount } from 'enzyme';
import 'jest-enzyme';
import EntityCard from './WrappedEntityCard';
import ScheduledActionActions from 'app/ScheduledActions/ScheduledActionAction';
import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext';

// https://github.com/airbnb/enzyme/issues/1875#issuecomment-451177239
jest.mock('react', () => {
  const r = jest.requireActual('react');

  return { ...r, memo: x => x };
});

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
      jobs: {
        getPendingJobs: jest.fn().mockReturnValue(jobs)
      }
    };
  });

  it('should display the tooltip with an icon for a scheduled entry', () => {
    const wrapper = mount(
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

    const tooltip = wrapper.find('ScheduleTooltip');

    expect(tooltip.exists()).toBeTrue();
    expect(tooltip.children().length > 0).toBeTrue();
    expect(tooltip.prop('job')).toEqual(jobs[0]);
    expect(tooltip.prop('jobsCount')).toBe(jobs.length);
  });

  it('should not display the tooltip with an icon for an entry that was not scheduled', () => {
    const wrapper = mount(
      <WidgetAPIContext.Provider value={{ widgetAPI: widgetAPIMock }}>
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

    const tooltip = wrapper.find('ScheduleTooltip');

    expect(tooltip.exists()).toBeTrue();
    expect(tooltip.children()).toHaveLength(0);
  });
});
