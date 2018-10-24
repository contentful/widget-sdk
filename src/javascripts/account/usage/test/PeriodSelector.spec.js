import { shallow } from 'enzyme';
import React from 'react';
import moment from 'moment';
import sinon from 'sinon';
import { Select } from '@contentful/ui-component-library';

import PeriodSelector from '../committed/PeriodSelector.es6';

const DATE_FORMAT = 'YYYY-MM-DD';

let wrapper = null;
let props = null;
describe('PeriodSelector', () => {
  let clock = null;

  beforeAll(() => {
    // set fixed date for stable snapshots
    clock = sinon.useFakeTimers(moment('2017-12-01').unix());
  });

  afterAll(() => {
    clock.restore();
  });

  beforeEach(() => {
    const startDate = moment()
      .startOf('day')
      .subtract(12, 'days');
    props = {
      periods: [
        {
          sys: { type: 'UsagePeriod', id: 'period1' },
          startDate: startDate.format(DATE_FORMAT),
          endDate: null
        },
        {
          sys: { type: 'UsagePeriod', id: 'period1' },
          startDate: moment(startDate)
            .subtract(1, 'day')
            .subtract(1, 'month')
            .format(DATE_FORMAT),
          endDate: moment(startDate)
            .subtract(1, 'day')
            .format(DATE_FORMAT)
        }
      ],
      selectedPeriodIndex: 0,
      onChange: sinon.stub()
    };
    wrapper = shallow(<PeriodSelector {...props} />);
  });

  it('should render', () => {
    expect(wrapper).toMatchSnapshot();
  });

  it('should call onChange when option is selected', () => {
    expect(props.onChange.called).toBe(false);
    wrapper.find(Select).simulate('change', { target: { value: 1 } });
    expect(props.onChange.calledWith({ target: { value: 1 } })).toBe(true);
  });
});
