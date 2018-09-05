/* eslint-disable no-unused-vars */
import { range, keyBy, orderBy, take, sum } from 'lodash';
import moment from 'moment';
import random from 'random';

const spaceIds = ['rsrelvblded6', 'dlom3mc1dekh', '934t3c7yth1l', '6liu3yrd45z3', '37ocojeopr4s'];
const orgLimit = 2000000;
const numberOfPreviousPeriods = 50;
const API_FORMAT = 'YYYY-MM-DD';

const createPreviousPeriods = currentPeriod =>
  range(numberOfPreviousPeriods)
    .reduce(
      ([{ start, end, id }, ...rest]) => {
        const previousEnd = moment(start).subtract(1, 'day');
        const previousStart = moment(start).subtract(1, 'month');
        return [
          { start: previousStart, end: previousEnd, id: random.id() },
          { start, end, id },
          ...rest
        ];
      },
      [currentPeriod]
    )
    .reverse();

const periods = createPreviousPeriods({
  start: moment(),
  end: null,
  id: random.id()
});
const periodsById = keyBy(periods, 'id');

const delayedPromise = (duration = 1000) => new Promise(resolve => setTimeout(resolve, duration));

const getPeriods = endpoint =>
  delayedPromise().then(() => ({
    total: numberOfPreviousPeriods,
    sys: { type: 'Array' },
    items: periods.map(({ start, end, id }) => ({
      sys: { type: 'UsagePeriod', id },
      startDate: start.format(API_FORMAT),
      endDate: end ? end.format(API_FORMAT) : end
    }))
  }));

const periodDuration = periodId => {
  const { start, end } = periodsById[periodId];
  return (end || moment()).diff(start, 'days') + 1;
};

const getOrgUsage = (endpoint, periodId) => {
  const duration = periodDuration(periodId);
  const usage = range(duration).map(() => Math.round((Math.random() * orgLimit * 2) / 30));
  return delayedPromise().then(() => ({
    sys: {
      type: 'OrganizationUsage',
      id: `usage-${periodId}`
    },
    usage
  }));
};

const getApiUsage = (endpoint, periodId, api) => {
  const duration = periodDuration(periodId);
  const spaces = spaceIds.map((spaceId, index) => {
    const factor = [100, 1, 5, 10, 20, 30][index];
    return {
      spaceId,
      usage: range(duration).map(index =>
        Math.round(
          ((Math.random() + 0.5) * (index === 20 ? 200 : factor) * orgLimit) /
            20 /
            30 /
            3 /
            spaceIds.length
        )
      )
    };
  });

  return delayedPromise().then(() => ({
    total: Math.min(spaceIds.length, 3),
    sys: { type: 'Array' },
    items: take(
      orderBy(
        spaces.map(({ spaceId, usage }) => ({
          sys: {
            type: 'SpaceResourceUsage',
            id: `${api}-${periodId}`,
            space: { sys: { id: spaceId } }
          },
          usage
        })),
        ({ usage }) => sum(usage),
        'desc'
      ),
      3
    )
  }));
};

export { getPeriods, getOrgUsage, getApiUsage };
