import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

/**
 * Renders the element with a string indicating the time
 * relative to now.
 *
 * Uses the `moment.calendar()` function and progressive timer
 * to render up-to-date relative time.
 * Component must be used with `key` prop.
 * E.g. <RelativeDateTime key={dateString} value={dateString} />
 *
 * @class RelativeDateTime
 * @extends {Component}
 */
export default class RelativeDateTime extends Component {
  static propTypes = {
    value: PropTypes.string.isRequired
  };
  componentDidMount() {
    this.scheduleUpdate();
  }
  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  scheduleUpdate() {
    this.timer = setTimeout(() => {
      this.forceUpdate();
      this.scheduleUpdate();
    }, nextUpdateIn(this.props.value));
  }

  render() {
    const date = moment(this.props.value);
    const dateDiffString = diffString(date, moment());

    return <time>{dateDiffString}</time>;
  }
}

function diffString(a, b) {
  if (
    Math.abs(
      a
        .clone()
        .startOf('day')
        .diff(b, 'days', true)
    ) < 1
  ) {
    return a.from(b);
  } else {
    return a.calendar(b);
  }
}
function nextUpdateIn(momentDate) {
  const delta = Math.abs(moment().diff(momentDate));

  if (delta < 45e3) return 45e3 - delta;
  if (delta < 90e3) return 90e3 - delta;
  if (delta < 45 * 60e3) return 60e3 - ((delta + 30e3) % 60e3);
  return 3660e3 - (delta % 3600e3);
}
