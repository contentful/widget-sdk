import React from 'react';
import { shallow } from 'enzyme';
import { Icon } from '@contentful/forma-36-react-components';
import ScheduledActionActions from 'app/ScheduledActions/ScheduledActionAction';

import ScheduleTooltip, { ScheduleTooltipContent } from './ScheduleTooltip';
import * as FormattedDateAndTime from './FormattedDateAndTime';

const formatDateAndTimeSpy = jest.spyOn(FormattedDateAndTime, 'formatDateAndTime');

describe('ScheduleTooltip', () => {
  it('should not display anything if no jobs were given', () => {
    const wrapper = shallow(
      <ScheduleTooltip>
        <Icon icon="Clock" />
      </ScheduleTooltip>
    );

    expect(wrapper.html()).toBeNull();
  });

  it('should wrap any node and display a tooltip', () => {
    const job = {
      action: ScheduledActionActions.Publish,
      scheduledFor: {
        datetime: new Date(Date.now() * 2).toISOString()
      },
      sys: {
        id: 'job1'
      }
    };

    const wrapper = shallow(
      <ScheduleTooltip job={job} jobsCount={1}>
        <Icon icon="Clock" />
      </ScheduleTooltip>
    );

    expect(wrapper.exists('Tooltip')).toBe(true);
    expect(wrapper.exists('Icon')).toBe(true);
    expect(wrapper.find('Tooltip').prop('isVisible')).toBe(false);
  });

  it('should ble able to process the array of jobs to show the correct data for the entry', () => {
    const targetEntryId = 'entryId';
    const jobs = [
      {
        action: ScheduledActionActions.Publish,
        scheduledFor: {
          datetime: new Date(Date.now() * 2).toISOString()
        },
        entity: {
          sys: {
            id: targetEntryId
          }
        },
        sys: {
          id: 'job1'
        }
      },
      {
        action: ScheduledActionActions.Unpublish,
        scheduledFor: {
          datetime: new Date(Date.now() * 0.5).toISOString()
        },
        entity: {
          sys: {
            id: 'bla-bla'
          }
        },
        sys: {
          id: 'job2'
        }
      },
      {
        action: ScheduledActionActions.Unpublish,
        scheduledFor: {
          datetime: new Date(Date.now() * 0.2).toISOString()
        },
        entity: {
          sys: {
            id: targetEntryId
          }
        },
        sys: {
          id: 'job2'
        }
      }
    ];

    const wrapper = shallow(
      <ScheduleTooltip jobs={jobs} filter={job => job.entity.sys.id === targetEntryId}>
        <Icon icon="Clock" />
      </ScheduleTooltip>
    );

    expect(wrapper.exists('Tooltip')).toBe(true);
    expect(wrapper.exists('Icon')).toBe(true);
    const tooltipContent = wrapper.dive().find('ScheduleTooltipContent');
    expect(tooltipContent.exists()).toBe(true);
    expect(tooltipContent.prop('job')).toEqual(jobs[jobs.length - 1]);
    expect(tooltipContent.prop('jobsCount')).toBe(jobs.length - 1);
  });

  it('should prioritize the explicitly given job and jobsCount props over jobs array and filter function', () => {
    const job = {
      action: ScheduledActionActions.Publish,
      scheduledFor: {
        datetime: new Date(Date.now() * 2).toISOString()
      },
      entity: {
        sys: {
          id: 'entryId'
        }
      },
      sys: {
        id: 'job1'
      }
    };

    const filter = jest.fn();

    const wrapper = shallow(
      <ScheduleTooltip job={job} jobs={[]} jobsCount={1} filter={filter}>
        <Icon icon="Clock" />
      </ScheduleTooltip>
    );

    expect(wrapper.exists('Tooltip')).toBe(true);
    expect(wrapper.exists('Icon')).toBe(true);
    const tooltipContent = wrapper.dive().find('ScheduleTooltipContent');
    expect(tooltipContent.exists()).toBe(true);
    expect(tooltipContent.prop('job')).toEqual(job);
    expect(tooltipContent.prop('jobsCount')).toBe(1);
    expect(filter).not.toHaveBeenCalled();
  });
});

describe('ScheduleTooltipContent', () => {
  it('should not display anything if job is undefined', () => {
    const wrapper = shallow(<ScheduleTooltipContent />);

    expect(wrapper.html()).toBeNull();
  });

  it('should display the information about the schedule for the entry [multiple jobs]', () => {
    const job = {
      action: ScheduledActionActions.Publish,
      scheduledFor: {
        datetime: new Date(Date.now() * 2).toISOString()
      },
      sys: {
        id: 'job1'
      }
    };

    const jobsCount = 3;

    const wrapper = shallow(<ScheduleTooltipContent job={job} jobsCount={jobsCount} />);
    expect(wrapper.html()).not.toBeNull();
    expect(formatDateAndTimeSpy).toHaveBeenCalledWith(job.scheduledFor.datetime);
    expect(
      wrapper
        .find('Tag')
        .dive()
        .text()
    ).toBe(job.action.toUpperCase());
    expect(
      wrapper
        .find('Paragraph')
        .render()
        .text()
    ).toBe(`+ ${jobsCount - 1} more`);
  });

  it('should display the information about the schedule for the entry [one job]', () => {
    const job = {
      action: ScheduledActionActions.Publish,
      scheduledFor: {
        datetime: new Date(Date.now() * 2).toISOString()
      },
      sys: {
        id: 'job1'
      }
    };

    const jobsCount = 1;

    const wrapper = shallow(<ScheduleTooltipContent job={job} jobsCount={jobsCount} />);
    expect(wrapper.html()).not.toBeNull();
    expect(formatDateAndTimeSpy).toHaveBeenCalledWith(job.scheduledFor.datetime);
    expect(
      wrapper
        .find('Tag')
        .dive()
        .text()
    ).toBe(job.action.toUpperCase());
    expect(wrapper.exists('Paragraph')).toBe(false);
  });
});
