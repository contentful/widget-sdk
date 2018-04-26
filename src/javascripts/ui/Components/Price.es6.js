import React from 'react';
import PropTypes from 'prop-types';

function Price ({ value, currency, unit, style }) {
  const valueStr = parseInt(value, 10).toLocaleString('en-US');
  const unitStr = unit && ` /${unit}`;

  const priceStr = [currency, valueStr, unitStr].join('');

  return <span style={style}>{priceStr}</span>;
}

Price.propTypes = {
  value: PropTypes.number.isRequired,
  currency: PropTypes.string.isRequired,
  unit: PropTypes.string,
  style: PropTypes.object
};

Price.defaultProps = {
  value: 0,
  currency: '$',
  unit: null,
  style: null
};

export default Price;
