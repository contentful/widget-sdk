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
import { captureError } from 'core/monitoring';
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
import { getVariation, FLAGS } from 'LaunchDarkly';
import * as Analytics from 'analytics/Analytics';
import { useAppsTrial } from 'features/trials';

const isTEASpace = (contentTypes, currentSpace) => {
  return (
    !!contentTypes.find((ct) => ct.sys.id === 'layoutHighlightedCourse') ||
    isContentOnboardingSpace(currentSpace)
  );
};

const isEmptySpace = async (contentTypes, currentSpace) => {
  const assets = await currentSpace.getAssets();
  return assets.length == 0 && contentTypes.length == 0;
};

const fetchData = (
  setLoading,
  setState,
  setIsSpaceEmpty,
  isSpaceAdmin,
  isTEA,
  isModernStack,
  currentSpaceId,
  currentSpace,
  currentOrganizationId,
  currentSpaceContentTypes
) => async () => {
  setLoading(true);

  // this is a test A/A experiment which will be removed shortly
  const testExperimentVariation = await getVariation(FLAGS.EXPERIMENT_A_A, {
    organizationId: currentOrganizationId,
  });
  if (testExperimentVariation !== null) {
    Analytics.tracking.experimentStart({
      experiment_id: FLAGS.EXPERIMENT_A_A,
      experiment_variation: testExperimentVariation,
      space_id: currentSpaceId,
      organization_id: currentOrganizationId,
    });
  }

  const hasTeamsEnabled = await getOrgFeature(currentOrganizationId, 'teams', false);

  const isSpaceEmpty = await isEmptySpace(currentSpaceContentTypes, currentSpace);
  setIsSpaceEmpty(isSpaceEmpty);

  if (!currentSpaceId || !isSpaceAdmin) {
    setLoading(false);
    return;
  }

  if (isTEA) {
    let key;
    try {
      [key] = await getApiKeyRepo().getAll();
    } catch (e) {
      captureError(e);
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
      });
    } else {
      setState({
        hasTeamsEnabled,
      });
    }
    setLoading(false);
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
    { managementToken, personEntry, cdaToken, cpaToken, hasTeamsEnabled },
    setState,
  ] = useState({});
  const [isLoading, setLoading] = useState(true);
  const [spaceTemplateCreated, setSpaceTemplateCreated] = useState(false);
  const [isSpaceEmpty, setIsSpaceEmpty] = useState(false);
  const { isAppsTrialActive } = useAppsTrial(currentOrganizationId);
  const spaceRoles = getSpaceRoles(currentSpace);
  const organizationName = getOrganizationName(currentSpace);
  const isSpaceAdmin = isAdmin(currentSpace);
  const readOnlySpace = isSpaceReadyOnly(currentSpace);
  const expiredTrialSpace = isExpiredTrialSpace(currentSpaceData);
  const isAuthorOrEditor = accessChecker.isAuthorOrEditor(spaceRoles ?? false);
  const isSupportEnabled = isOrganizationBillable(currentSpace);
  const isModernStack = isDevOnboardingSpace(currentSpaceName, currentSpaceId);
  const isTEA = isTEASpace(currentSpaceContentTypes, currentSpace);
  const isEnterpriseTrialSpace = isSpaceOnTrial(currentSpaceData) && !isAppsTrialActive;

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
        setIsSpaceEmpty,
        isSpaceAdmin,
        isTEA,
        isModernStack,
        currentSpaceId,
        currentSpace,
        currentOrganizationId,
        currentSpaceContentTypes
      ),
      [
        spaceTemplateCreated,
        isSpaceAdmin,
        isTEA,
        isModernStack,
        currentSpaceId,
        currentSpace,
        currentOrganizationId,
        currentSpaceContentTypes,
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
          isTrialSpace={isEnterpriseTrialSpace}
          hasActiveAppTrial={isAppsTrialActive}
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
          isTrialSpace={isEnterpriseTrialSpace}
          hasActiveAppTrial={isAppsTrialActive}
          isEmptySpace={isSpaceEmpty}
        />
      );
    }
  }

  return (
    <div className="home" data-test-id="space-home-page-container">
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
          isTrialSpace={isEnterpriseTrialSpace}
          hasActiveAppTrial={isAppsTrialActive}
        />
      )}
      {!isLoading && isSpaceAdmin && !readOnlySpace && !expiredTrialSpace && adminSpaceHomePage}
      {!isLoading && readOnlySpace && <ReadOnlySpaceHome isAdmin={isSpaceAdmin} />}
      {!isLoading && <ExpiredTrialSpaceHome />}
      {!isLoading &&
        !isSpaceAdmin &&
        !isAuthorOrEditor &&
        isEnterpriseTrialSpace &&
        !readOnlySpace && (
          <TrialSpaceHome spaceName={spaceHomeProps.spaceName} spaceId={spaceHomeProps.spaceId} />
        )}
    </div>
  );
};
