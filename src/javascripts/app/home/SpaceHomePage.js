import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { Spinner } from '@contentful/forma-36-react-components';
import AuthorEditorSpaceHome from './AuthorEditorSpaceHome';
import AdminSpaceHome from './AdminSpaceHome';
import TEAAdminSpaceHome from './TEAAdminSpaceHome';
import ModernStackAdminSpaceHome from './ModernStackAdminSpaceHome';
import ReadOnlySpaceHome from './ReadOnlySpaceHome';
import EmptySpaceHome from './EmptySpaceHome';
import DocumentTitle from 'components/shared/DocumentTitle';
import {
  getPerson,
  getCredentials,
  isDevOnboardingSpace,
  isContentOnboardingSpace,
} from 'components/shared/auto_create_new_space/CreateModernOnboardingUtils';
import { getModule } from 'core/NgRegistry';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';
import * as K from 'utils/kefir';
import * as accessChecker from 'access_control/AccessChecker';
import { useAsync } from 'core/hooks';
import { getOrgFeature } from 'data/CMA/ProductCatalog';
import * as logger from 'services/logger';
import { getApiKeyRepo } from 'app/settings/api/services/ApiKeyRepoInstance';

const isTEASpace = () => {
  const spaceContext = getModule('spaceContext');
  const publishedCTs = K.getValue(spaceContext.publishedCTs.items$) || [];
  return (
    publishedCTs.find((ct) => {
      return get(ct, ['sys', 'id']) === 'layoutHighlightedCourse';
    }) || isContentOnboardingSpace(spaceContext.space)
  );
};

const fetchData = (setLoading, setState, isSpaceAdmin) => async () => {
  const spaceContext = getModule('spaceContext');
  setLoading(true);

  const hasTeamsEnabled = await getOrgFeature(spaceContext.getId(), 'teams', false);

  const isTEA = isTEASpace();

  if (!spaceContext.space || !isSpaceAdmin) {
    setLoading(false);
    return;
  }

  if (isTEA) {
    let key;
    try {
      [key] = await getApiKeyRepo().getAll();
    } catch (e) {
      logger.logError('Space Home', e);
    }

    // there might be no keys - it was not created yet, or user explicitly removed them
    if (key) {
      const keyWithPreview = await getApiKeyRepo().get(key.sys.id);

      setState({
        hasTeamsEnabled,
        cdaToken: key.accessToken,
        cpaToken: keyWithPreview.preview_api_key.accessToken,
      });
    }

    setLoading(false);

    return;
  } else {
    if (isDevOnboardingSpace(get(spaceContext, 'space'))) {
      const [credentials, personEntry] = await Promise.all([getCredentials(), getPerson()]);
      setState({
        hasTeamsEnabled,
        managementToken: credentials && credentials.managementToken,
        personEntry,
      });
    } else {
      setState({
        hasTeamsEnabled,
      });
    }
    setLoading(false);
    return;
  }
};

// TODO should fix this template being used by both spaceHome and Home
const SpaceHomePage = ({ spaceTemplateCreated, orgOwnerOrAdmin, orgId }) => {
  const spaceContext = getModule('spaceContext');
  const [isLoading, setLoading] = useState(true);
  const [
    { managementToken, personEntry, cdaToken, cpaToken, hasTeamsEnabled },
    setState,
  ] = useState({});

  const currentSpace = spaceContext.space;

  const isSpaceAdmin = get(currentSpace, ['data', 'spaceMember', 'admin']);

  useAsync(useCallback(fetchData(setLoading, setState, isSpaceAdmin), [spaceTemplateCreated]));

  const isAuthorOrEditor = accessChecker.isAuthorOrEditor(
    spaceContext.getData('spaceMember.roles', false)
  );

  const readOnlySpace = Boolean(get(currentSpace, ['data', 'readOnlyAt']));

  const spaceHomeProps = {
    spaceName: spaceContext.getData('name'),
    orgName: spaceContext.getData('organization.name'),
    orgId: spaceContext.getData('organization.sys.id'),
    spaceId: spaceContext.getData('sys.id'),
  };

  const isSupportEnabled = spaceContext.getData('organization.isBillable');

  let adminSpaceHomePage;

  const isModernStack = isDevOnboardingSpace(currentSpace);

  const isTEA = isTEASpace();

  if (spaceContext.space && !isLoading && isSpaceAdmin) {
    if (isTEA && cdaToken && cpaToken) {
      adminSpaceHomePage = (
        <TEAAdminSpaceHome
          spaceName={spaceHomeProps.spaceName}
          spaceId={spaceHomeProps.spaceId}
          orgId={spaceHomeProps.orgId}
          cdaToken={cdaToken}
          cpaToken={cpaToken}
          isSupportEnabled={isSupportEnabled}
          hasTeamsEnabled={hasTeamsEnabled}
        />
      );
    } else if (isModernStack) {
      adminSpaceHomePage = (
        <ModernStackAdminSpaceHome
          spaceId={spaceHomeProps.spaceId}
          orgId={spaceHomeProps.orgId}
          managementToken={managementToken}
          entry={personEntry}
          isSupportEnabled={isSupportEnabled}
          hasTeamsEnabled={hasTeamsEnabled}
        />
      );
    } else {
      adminSpaceHomePage = (
        <AdminSpaceHome
          spaceName={spaceHomeProps.spaceName}
          spaceId={spaceHomeProps.spaceId}
          orgId={spaceHomeProps.orgId}
          isSupportEnabled={isSupportEnabled}
          hasTeamsEnabled={hasTeamsEnabled}
        />
      );
    }
  }

  return (
    <div className="home home-section" data-test-id="space-home-page-container">
      <DocumentTitle title="Space home" />
      {!isLoading && !spaceContext.space && (
        <EmptySpaceHome orgId={orgId} orgOwnerOrAdmin={orgOwnerOrAdmin} />
      )}
      {isLoading && (
        <EmptyStateContainer>
          <Spinner size="large" />
        </EmptyStateContainer>
      )}
      {!isLoading && isAuthorOrEditor && !readOnlySpace && (
        <AuthorEditorSpaceHome
          spaceName={spaceHomeProps.spaceName}
          orgName={spaceHomeProps.orgName}
        />
      )}
      {!isLoading && isSpaceAdmin && !readOnlySpace && adminSpaceHomePage}
      {!isLoading && readOnlySpace && <ReadOnlySpaceHome isAdmin={isSpaceAdmin} />}
    </div>
  );
};

SpaceHomePage.propTypes = {
  spaceTemplateCreated: PropTypes.bool,
  orgOwnerOrAdmin: PropTypes.bool,
  orgId: PropTypes.string,
};

export default SpaceHomePage;
