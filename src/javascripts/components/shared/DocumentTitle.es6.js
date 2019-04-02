import React from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';

import { getModule } from 'NgRegistry.es6';

const spaceContext = getModule('spaceContext');

/**
 * Component sets document title. The facade for react-helmet to make
 * usage from jade templates easier.
 *
 */
export default function DocumentTitle({ title, scope }) {
  const spaceName = getSpaceName(spaceContext);
  const environmentId = getEnvironmentId(spaceContext);

  const docTitle = buildDocumentTitle({
    spaceName,
    environmentId,
    scope,
    title
  });

  return (
    <Helmet>
      <title>{docTitle}</title>
    </Helmet>
  );
}

DocumentTitle.propTypes = {
  // Locales, Entries, Users etc
  scope: PropTypes.string,
  title: PropTypes.string.isRequired
};

function buildDocumentTitle({ title, scope, spaceName, environmentId }) {
  const titleParts = [title, scope, spaceName, environmentId, 'Contentful'].filter(Boolean);
  return titleParts.join(' — ');
}

function getSpaceName(spaceContext) {
  try {
    return spaceContext.space.data.name;
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
