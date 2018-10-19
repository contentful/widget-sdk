import { shallow } from 'enzyme';
import React from 'react';
import moment from 'moment';
import { Select } from '@contentful/ui-component-library';

import PeriodSelector from '../committed/PeriodSelector.es6';

let wrapper = null;
let props = null;
describe('PeriodSelector', () => {
  beforeEach(() => {
    const startDate = moment().subtract(12, 'days');
    props = {
      periods: [
        {
          sys: { type: 'UsagePeriod', id: 'period1' },
          startDate: startDate.toISOString(),
          endDate: null
        },
        {
          sys: { type: 'UsagePeriod', id: 'period1' },
          startDate: moment(startDate)
            .subtract(1, 'day')
            .subtract(1, 'month')
            .toISOString(),
          endDate: moment(startDate)
            .subtract(1, 'day')
            .toISOString()
        }
      ],
      selectedPeriodIndex: 0,
      onChange: jest.fn()
    };
    wrapper = shallow(<PeriodSelector {...props} />);
  });

  it('should call onChange when select was used', () => {
    expect(props.onChange).not.toHaveBeenCalled();
    wrapper.find(Select).simulate('change', { target: { value: 1 } });
    expect(props.onChange).toHaveBeenCalledWith({ target: { value: 1 } });
  });
});
