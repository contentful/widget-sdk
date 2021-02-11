import React, { useState, useCallback, useEffect } from 'react';
import { LoadingState } from 'features/loading-state';
import { AuthorEditorSpaceHome } from './AuthorEditorSpaceHome';
import { AdminSpaceHome } from './AdminSpaceHome';
import { TEAAdminSpaceHome } from './TEAAdminSpaceHome';
import { ModernStackAdminSpaceHome } from './ModernStackAdminSpaceHome';
import { ReadOnlySpaceHome } from './ReadOnlySpaceHome';
import DocumentTitle from 'components/shared/DocumentTitle';
import {
  getPerson,
  getCredentials,
  isDevOnboardingSpace,
  isContentOnboardingSpace,
} from 'components/shared/auto_create_new_space/CreateModernOnboardingUtils';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';
import * as accessChecker from 'access_control/AccessChecker';
import { useAsync } from 'core/hooks';
import { getOrgFeature } from 'data/CMA/ProductCatalog';
import * as logger from 'services/logger';
import { getApiKeyRepo } from 'features/api-keys-management';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import {
  isAdmin,
  getSpaceRoles,
  isSpaceReadyOnly,
  getOrganizationName,
  isOrganizationBillable,
} from 'core/services/SpaceEnvContext/utils';
import { isSpaceOnTrial, isExpiredTrialSpace } from 'features/trials';
import { TrialSpaceHome } from './TrialSpaceHome';
import { getModule } from 'core/NgRegistry';
import { ExpiredTrialSpaceHome } from './ExpiredTrialSpaceHome';
import { FLAGS, getVariation } from 'LaunchDarkly';
import { createAppTrialRepo, isActiveAppTrial } from 'features/trials';
import { createOrganizationEndpoint } from 'data/EndpointFactory';

const isTEASpace = (contentTypes, currentSpace) => {
  return (
    !!contentTypes.find((ct) => ct.sys.id === 'layoutHighlightedCourse') ||
    isContentOnboardingSpace(currentSpace)
  );
};

const fetchData = (
  setLoading,
  setState,
  isSpaceAdmin,
  isTEA,
  isModernStack,
  currentSpaceId,
  currentSpace,
  currentOrganizationId
) => async () => {
  setLoading(true);

  const hasTeamsEnabled = await getOrgFeature(currentSpaceId, 'teams', false);
  const hasActiveAppTrial = await getVariation(FLAGS.APP_TRIAL, {
    organizationId: currentOrganizationId,
  }).then(async (enabled) => {
    if (enabled) {
      const orgEndpoint = createOrganizationEndpoint(currentOrganizationId);
      const appTrialFeature = await createAppTrialRepo(orgEndpoint).getTrial('compose_app');
      return isActiveAppTrial(appTrialFeature);
    }
  });

  if (!currentSpaceId || !isSpaceAdmin) {
    setState({
      hasActiveAppTrial,
    });
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
        hasActiveAppTrial,
      });
    }

    setLoading(false);

    return;
  } else {
    if (isModernStack) {
      const [credentials, personEntry] = await Promise.all([
        getCredentials(),
        getPerson(currentSpace),
      ]);
      setState({
        hasTeamsEnabled,
        managementToken: credentials && credentials.managementToken,
        personEntry,
        hasActiveAppTrial,
      });
    } else {
      setState({
        hasTeamsEnabled,
        hasActiveAppTrial,
      });
    }
    setLoading(false);
    return;
  }
};

export const SpaceHome = () => {
  const {
    currentSpaceId,
    currentSpace,
    currentSpaceData,
    currentSpaceName,
    currentSpaceContentTypes,
    currentOrganizationId,
  } = useSpaceEnvContext();
  const [
    { managementToken, personEntry, cdaToken, cpaToken, hasTeamsEnabled, hasActiveAppTrial },
    setState,
  ] = useState({});
  const [isLoading, setLoading] = useState(true);
  const [spaceTemplateCreated, setSpaceTemplateCreated] = useState(false);
  const spaceRoles = getSpaceRoles(currentSpace);
  const organizationName = getOrganizationName(currentSpace);
  const isSpaceAdmin = isAdmin(currentSpace);
  const readOnlySpace = isSpaceReadyOnly(currentSpace);
  const expiredTrialSpace = isExpiredTrialSpace(currentSpaceData);
  const isAuthorOrEditor = accessChecker.isAuthorOrEditor(spaceRoles ?? false);
  const isSupportEnabled = isOrganizationBillable(currentSpace);
  const isModernStack = isDevOnboardingSpace(currentSpaceName, currentSpaceId);
  const isTEA = isTEASpace(currentSpaceContentTypes, currentSpace);
  const isTrialSpace = isSpaceOnTrial(currentSpaceData) && !hasActiveAppTrial;

  const spaceHomeProps = {
    orgId: currentOrganizationId,
    orgName: organizationName,
    spaceId: currentSpaceId,
    spaceName: currentSpaceName,
  };
  let adminSpaceHomePage;

  useEffect(() => {
    const $rootScope = getModule('$rootScope');

    return $rootScope.$on('spaceTemplateCreated', () => {
      setSpaceTemplateCreated(true);
    });
  }, []);

  useAsync(
    useCallback(
      fetchData(
        setLoading,
        setState,
        isSpaceAdmin,
        isTEA,
        isModernStack,
        currentSpaceId,
        currentSpace,
        currentOrganizationId
      ),
      [
        spaceTemplateCreated,
        isSpaceAdmin,
        isTEA,
        isModernStack,
        currentSpaceId,
        currentSpace,
        currentOrganizationId,
      ]
    )
  );

  if (!isLoading && isSpaceAdmin) {
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
          isTrialSpace={isTrialSpace}
          hasActiveAppTrial={hasActiveAppTrial}
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
          isTrialSpace={isTrialSpace}
          hasActiveAppTrial={hasActiveAppTrial}
        />
      );
    }
  }

  return (
    <div className="home home-section" data-test-id="space-home-page-container">
      <DocumentTitle title="Space home" />
      {isLoading && (
        <EmptyStateContainer>
          <LoadingState />
        </EmptyStateContainer>
      )}
      {!isLoading && isAuthorOrEditor && !readOnlySpace && !expiredTrialSpace && (
        <AuthorEditorSpaceHome
          spaceName={spaceHomeProps.spaceName}
          orgName={spaceHomeProps.orgName}
          spaceId={spaceHomeProps.spaceId}
          isTrialSpace={isTrialSpace}
          hasActiveAppTrial={hasActiveAppTrial}
        />
      )}
      {!isLoading && isSpaceAdmin && !readOnlySpace && !expiredTrialSpace && adminSpaceHomePage}
      {!isLoading && readOnlySpace && <ReadOnlySpaceHome isAdmin={isSpaceAdmin} />}
      {!isLoading && <ExpiredTrialSpaceHome />}
      {!isLoading && !isSpaceAdmin && !isAuthorOrEditor && isTrialSpace && !readOnlySpace && (
        <TrialSpaceHome spaceName={spaceHomeProps.spaceName} spaceId={spaceHomeProps.spaceId} />
      )}
    </div>
  );
};
