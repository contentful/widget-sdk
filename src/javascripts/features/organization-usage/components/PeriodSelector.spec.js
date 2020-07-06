import { shallow } from 'enzyme';
import 'jest-enzyme';
import React from 'react';
import moment from 'moment';
import { Select, Option } from '@contentful/forma-36-react-components';

import { PeriodSelector } from './PeriodSelector';

const DATE_FORMAT = 'YYYY-MM-DD';

const render = (props) => shallow(<PeriodSelector {...props} />);

describe('PeriodSelector', () => {
  let props;

  beforeAll(() => {
    // set fixed date for stable snapshots
    // moment('2017-12-01').unix() = 1512082800
    jest.spyOn(Date, 'now').mockImplementation(() => 1512082800);
  });

  afterAll(() => {
    Date.now.mockRestore();
  });

  beforeEach(() => {
    const startDate = moment().startOf('day').subtract(12, 'days');
    props = {
      periods: [
        {
          sys: { type: 'UsagePeriod', id: 'period1' },
          startDate: startDate.format(DATE_FORMAT),
          endDate: null,
        },
        {
          sys: { type: 'UsagePeriod', id: 'period1' },
          startDate: moment(startDate).subtract(1, 'day').subtract(1, 'month').format(DATE_FORMAT),
          endDate: moment(startDate).subtract(1, 'day').format(DATE_FORMAT),
        },
      ],
      selectedPeriodIndex: 0,
      onChange: jest.fn(),
      isTeamOrEnterpriseCustomer: true,
    };
  });

  it('should render', () => {
    const wrapper = render(props);
    expect(wrapper).toMatchSnapshot();
  });

  it('should call onChange when option is selected', () => {
    const wrapper = render(props);
    expect(props.onChange).not.toHaveBeenCalled();
    wrapper.find(Select).simulate('change', { target: { value: 1 } });
    expect(props.onChange).toHaveBeenCalledWith({ target: { value: 1 } });
  });

  it('should correctly indicate the period is a current period', () => {
    // when endDate is null (default)
    expect(render(props).find(Option).first().html()).toContain('current');

    // when endDate is given (for the community tier)
    props.periods[0].endDate = moment().format(DATE_FORMAT); // today
    expect(render(props).find(Option).first().html()).toContain('current');
  });
});
