import React from 'react';
import PropTypes from 'prop-types';

function Price({ value, currency, unit, style, testId }) {
  const valueStr = parseInt(value, 10).toLocaleString('en-US');
  const unitStr = unit && ` /${unit}`;

  const priceStr = [currency, valueStr, unitStr].join('');

  return (
    <span data-test-id={testId} style={style}>
      {priceStr}
    </span>
  );
}

Price.propTypes = {
  value: PropTypes.number.isRequired,
  currency: PropTypes.string.isRequired,
  unit: PropTypes.string,
  style: PropTypes.object,
  testId: PropTypes.string,
};

Price.defaultProps = {
  value: 0,
  currency: '$',
  unit: null,
  style: null,
  testId: null,
};

export default Price;
