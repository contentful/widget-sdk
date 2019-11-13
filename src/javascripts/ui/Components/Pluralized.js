import React from 'react';
import PropTypes from 'prop-types';

import pluralize from 'pluralize';

function Pluralized({ text, count }) {
  const pluralizedText = pluralize(text, count, true);

  return <span>{pluralizedText}</span>;
}

Pluralized.propTypes = {
  text: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired
};

export default Pluralized;
