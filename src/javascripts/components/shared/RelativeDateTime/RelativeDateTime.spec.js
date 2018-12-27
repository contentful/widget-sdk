import React from 'react';
import Enzyme from 'enzyme';
import RelativeDateTime from './index.es6';
import moment from 'moment';
jest.useFakeTimers();

describe('RelativeDateTime renders the date string relative to now()', () => {
  const now = jest.fn(new Date('2017-11-20T10:01:00.000Z').valueOf());
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockImplementation(now);
  });

  afterEach(() => {
    try {
      Date.now.mockRestore();
    } catch (e) {
      //
    }
  });

  it.each([
    ['a few seconds ago', '2017-11-20T10:00:00.001Z'],
    ['a minute ago', '2017-11-20T10:01:00.000Z'],
    ['2 hours ago', '2017-11-20T12:00:00.000Z'],
    ['Yesterday at 10:00 AM', '2017-11-21T09:59:59.999Z'],
    ['Last Monday at 10:00 AM', '2017-11-22T10:00:00.000Z'],
    ['11/20/2017', '2017-12-22T10:00:00.000Z']
  ])('renders relative date %s', (expectedText, referenceDate) => {
    now.mockReturnValue(new Date(referenceDate).valueOf());

    const value = '2017-11-20T10:00:00.000Z';
    const wrapper = Enzyme.mount(<RelativeDateTime value={value} />);
    expect(wrapper.text()).toBe(expectedText);
  });

  const advanceTime = desiredTime => {
    const oldNow = Date.now();
    now.mockReturnValue(desiredTime);
    jest.advanceTimersByTime(desiredTime - oldNow);
  };

  const expectInTime = (wrapper, expectedValue, timestamp) => {
    advanceTime(timestamp);
    expect(wrapper.text()).toBe(expectedValue);
  };

  it('has progressive timer that updates rendered date', () => {
    now.mockReturnValue(new Date('2017-11-20T10:00:00.001Z').valueOf());

    const value = new Date('2017-11-20T10:00:00.000Z').toISOString();
    const wrapper = Enzyme.mount(<RelativeDateTime value={value} />);

    expect(wrapper.text()).toBe('a few seconds ago');
    expectInTime(
      wrapper,
      'a few seconds ago',
      moment()
        .add(44, 's')
        .valueOf()
    );
    expectInTime(
      wrapper,
      'a minute ago',
      moment()
        .add(45, 's')
        .valueOf()
    );
    expectInTime(
      wrapper,
      '2 minutes ago',
      moment()
        .add(1, 'm')
        .valueOf()
    );
    expectInTime(
      wrapper,
      '4 minutes ago',
      moment()
        .add(2, 'm')
        .valueOf()
    );
    expectInTime(
      wrapper,
      'an hour ago',
      moment()
        .add(1, 'h')
        .valueOf()
    );
    expectInTime(
      wrapper,
      '3 hours ago',
      moment()
        .add(2, 'h')
        .valueOf()
    );
  });
});
