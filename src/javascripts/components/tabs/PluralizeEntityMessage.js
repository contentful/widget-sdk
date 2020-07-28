import React from 'react';
import PropTypes from 'prop-types';
import { HelpText } from '@contentful/forma-36-react-components';

/**
 * Migrated legacy implementation of the +pluralize-entity mixin
 * Consider using Intl and PluralRules in future.
 *
 */
export default function PluralizeEntityMessage({
  className,
  entityType,
  count,
  testId,
  restOfTheMsg,
}) {
  const endsWithY = !!entityType.match(/(y|Y)$/);
  const plural = endsWithY ? entityType.replace(/(.*)(y|Y)$/, '$1ies') : `${entityType}s`;

  return (
    <HelpText className={className} testId={testId}>
      {count} {count === 1 ? entityType : plural} {restOfTheMsg}
    </HelpText>
  );
}

PluralizeEntityMessage.propTypes = {
  className: PropTypes.string,
  testId: PropTypes.string,
  entityType: PropTypes.string,
  count: PropTypes.number,
  restOfTheMsg: PropTypes.string,
};
