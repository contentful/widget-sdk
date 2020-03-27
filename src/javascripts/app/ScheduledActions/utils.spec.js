import { filterRelevantJobsForEntity, sortJobsByRelevance } from './utils';

const ENTITY_ID = 'entry-id';
const ENTITY_TYPE = 'Entry';

const DATE_NOW = new Date();

const newJob = ({ entityType = ENTITY_TYPE, entityId = ENTITY_ID, date = DATE_NOW }) => ({
  sys: {
    id: 'job1',
  },
  action: 'publish',
  scheduledFor: {
    datetime: date.toISOString(),
  },
  entity: {
    sys: {
      type: 'Link',
      linkType: entityType,
      id: entityId,
    },
  },
});

const JOBS = {
  past: newJob({ date: new Date(Date.now() - 1000) }),
  now: newJob({ date: new Date() }),
  future: newJob({ date: new Date(Date.now() + 1000) }),
  otherEntity: newJob({ entityId: 'another-entity-id' }),
  otherEntityWithAnotherType: newJob({ entityType: 'Asset' }),
};

describe('filterRelevantJobsForEntity()', () => {
  it('returns an empty array on empty input', () => {
    const relevantJobs = filterRelevantJobsForEntity([], ENTITY_TYPE, ENTITY_ID);
    expect(relevantJobs).toEqual([]);
  });

  it('returns an empty array if no relevant jobs are given', () => {
    const jobs = [JOBS.otherEntity, JOBS.otherEntityWithAnotherType];
    const relevantJobs = filterRelevantJobsForEntity(jobs, ENTITY_TYPE, ENTITY_ID);
    expect(relevantJobs).toEqual([]);
  });

  it('returns relevant jobs', () => {
    const jobs = [JOBS.now, JOBS.otherEntity, JOBS.past, JOBS.otherEntityWithAnotherType];
    const relevantJobs = filterRelevantJobsForEntity(jobs, ENTITY_TYPE, ENTITY_ID);
    expect(relevantJobs).toEqual([JOBS.now, JOBS.past]);
  });
});

describe('sortJobsByRelevance()', () => {
  it('handles an empty array', () => {
    expect(sortJobsByRelevance([])).toEqual([]);
  });

  it('returns a new array', () => {
    const input = [];
    const output = sortJobsByRelevance(input);
    expect(output).not.toBe(input);
  });

  it('Sorts jobs starting from soonest to most distant', () => {
    const jobs = [JOBS.now, JOBS.past, JOBS.now, JOBS.future];
    const expectedJobs = [JOBS.past, JOBS.now, JOBS.now, JOBS.future];
    expect(sortJobsByRelevance(jobs)).toEqual(expectedJobs);
  });
});
