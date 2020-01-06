import React from 'react';
import { mount } from 'enzyme';
import EntityCard from './WrappedEntityCard';
import ScheduledActionActions from 'app/ScheduledActions/ScheduledActionAction';
import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext';

// https://github.com/airbnb/enzyme/issues/1875#issuecomment-451177239
jest.mock('react', () => {
  const r = jest.requireActual('react');

  return { ...r, memo: x => x };
});

describe('WrappedEntityCard', () => {
  let entity;
  let jobs;
  let widgetAPIMock;

  beforeEach(() => {
    entity = {
      sys: {
        id: 'entityId'
      }
    };

    jobs = [
      {
        action: ScheduledActionActions.Publish,
        scheduledAt: new Date().toISOString(),
        sys: {
          id: 'job1',
          entity: {
            sys: {
              id: entity.sys.id
            }
          }
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
          entity={entity}
          entityType="Entry"
          contentTypeName="Entry"
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
    entity.sys.id = 'nonexistent';

    const wrapper = mount(
      <WidgetAPIContext.Provider value={{ widgetAPI: widgetAPIMock }}>
        <EntityCard
          entity={entity}
          entityType="Entry"
          contentTypeName="Entry"
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
