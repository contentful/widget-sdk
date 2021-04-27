import { range } from 'lodash';
import moment from 'moment';

export type PeriodToDatesArgs = {
  startDate: string;
  endDate?: string;
};

export type PeriodToDatesResponse = string[];

export const periodToDates = ({ startDate, endDate }: PeriodToDatesArgs): PeriodToDatesResponse =>
  range(
    (endDate ? moment(endDate) : moment(startDate).add(1, 'month').subtract(1, 'day')) // no end => is current period
      .diff(moment(startDate), 'days') + 1
  )
    .map((index) => moment(startDate).add(index, 'days'))
    .map((moment) => moment.format('D MMM'));
