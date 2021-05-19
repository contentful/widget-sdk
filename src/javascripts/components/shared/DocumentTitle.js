import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { isArray } from 'lodash';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import {
  getEnvironmentAliasesIds,
  isCurrentEnvironmentMaster,
} from 'core/services/SpaceEnvContext/utils';

/**
 * Component sets document title. The facade for react-helmet to make
 * usage from jade templates easier.
 *
 */
export default function DocumentTitle({ title }) {
  const { currentSpaceName, currentEnvironmentId, currentEnvironment, currentSpace } =
    useSpaceEnvContext();
  const isMaster = isCurrentEnvironmentMaster(currentSpace);
  const hasEnvironmentAliases = !!getEnvironmentAliasesIds(currentEnvironment).length;
  const hasEnvironmentTitle = !isMaster || hasEnvironmentAliases;
  const environmentId = hasEnvironmentTitle ? currentEnvironmentId : undefined;

  const titleSegments = isArray(title) ? title : [title];

  const docTitle = buildDocumentTitle({
    spaceName: currentSpaceName,
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
