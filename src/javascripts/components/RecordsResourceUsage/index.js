import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { HelpText } from '@contentful/forma-36-react-components';

const warnThreshold = 0.9;
const errorThreshold = 0.95;

export default function RecordsResourceUsage({ recordsUsage = 0, recordsLimit = 0 }) {
  const usagePercentage = recordsUsage / recordsLimit;

  return (
    <div
      data-test-id="container"
      className={classnames('resource-usage', {
        'resource-usage--warn':
          usagePercentage >= warnThreshold && usagePercentage < errorThreshold,
        'resource-usage--danger': usagePercentage >= errorThreshold,
      })}>
      <HelpText>
        Usage: {recordsUsage} / {recordsLimit} entries and assets
      </HelpText>
    </div>
  );
}

RecordsResourceUsage.propTypes = {
  recordsUsage: PropTypes.number.isRequired,
  recordsLimit: PropTypes.number.isRequired,
};

export { RecordsResourceUsage };
