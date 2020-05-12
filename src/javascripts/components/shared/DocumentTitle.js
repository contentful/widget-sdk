import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { isArray } from 'lodash';

import { getModule } from 'core/NgRegistry';

/**
 * Component sets document title. The facade for react-helmet to make
 * usage from jade templates easier.
 *
 */
export default function DocumentTitle({ title }) {
  const spaceContext = getModule('spaceContext');

  const titleSegments = isArray(title) ? title : [title];
  const spaceName = getSpaceName(spaceContext);
  const environmentId = getEnvironmentId(spaceContext);

  const docTitle = buildDocumentTitle({
    spaceName,
    environmentId,
    titleSegments: titleSegments,
  });

  return (
    <Helmet>
      <title>{docTitle}</title>
    </Helmet>
  );
}

DocumentTitle.propTypes = {
  /**
   * can be a plain string ('Home', 'Content') or
   * an array of string for scoped titles (['New Locale', 'Locales'])
   */
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]).isRequired,
};

function buildDocumentTitle({ titleSegments, spaceName, environmentId }) {
  const titleParts = [...titleSegments, spaceName, environmentId, 'Contentful'].filter(Boolean);
  return titleParts.join(' — ');
}

function getSpaceName(spaceContext) {
  try {
    return spaceContext.getData('name');
  } catch (error) {
    return undefined;
  }
}

/**
 * Returns envirnment id if the user has more then one environment.
 *
 * @param {*} spaceContext
 * @returns
 */
function getEnvironmentId(spaceContext) {
  try {
    if (spaceContext.environments.length > 1) {
      return spaceContext.getEnvironmentId();
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
}
