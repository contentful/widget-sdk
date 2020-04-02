import React from 'react';
import PropTypes from 'prop-types';

/**
 * Migrated legacy implementation of the +pluralize-entity mixin
 * Consider using Intl and PluralRules in future.
 *
 */
export default function PluralizeEntityMessage({ entityType, count, testId, restOfTheMsg }) {
  const endsWithY = !!entityType.match(/(y|Y)$/);
  const plural = endsWithY ? entityType.replace(/(.*)(y|Y)$/, '$1ies') : `${entityType}s`;

  return (
    <span data-test-id={testId}>
      {count} {count === 1 ? entityType : plural} {restOfTheMsg}
    </span>
  );
}

PluralizeEntityMessage.propTypes = {
  testId: PropTypes.string,
  entityType: PropTypes.string,
  count: PropTypes.number,
  restOfTheMsg: PropTypes.string,
};
