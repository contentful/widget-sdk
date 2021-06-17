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
import { useSpaceEnvContext, useSpaceEnvContentTypes } from 'core/services/SpaceEnvContext';
import {
  isAdmin,
  getSpaceRoles,
  isSpaceReadyOnly,
  getOrganizationName,
  isOrganizationBillable,
} from 'core/services/SpaceEnvContext/utils';
import { getModule } from 'core/NgRegistry';
import { ExpiredTrialSpaceHome } from './ExpiredTrialSpaceHome';
import { getVariation, FLAGS } from 'core/feature-flags';
import { tracking, defaultEventProps } from 'analytics/Analytics';
import { useTrialSpace } from 'features/trials';

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

const fetchData =
  (
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
  ) =>
  async () => {
    setLoading(true);

    // this is a test A/A experiment which will be removed shortly
    const testExperimentVariation = await getVariation(FLAGS.EXPERIMENT_A_A, {
      organizationId: currentOrganizationId,
    });
    if (testExperimentVariation !== null) {
      tracking.experimentStarted({
        ...defaultEventProps(),
        experiment_id: FLAGS.EXPERIMENT_A_A,
        experiment_variation: testExperimentVariation ? 'treatment' : 'control',
      });
    }

    const inviteCardExperimentEnabled = await getVariation(
      FLAGS.EXPERIMENT_NEW_COWORKER_INVITE_CARD,
      {
        organizationId: currentOrganizationId,
      }
    );

    if (inviteCardExperimentEnabled !== null) {
      tracking.experimentStarted({
        ...defaultEventProps(),
        experiment_id: FLAGS.EXPERIMENT_NEW_COWORKER_INVITE_CARD,
        experiment_variation: inviteCardExperimentEnabled ? 'treatment' : 'control',
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
          inviteCardExperimentEnabled,
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
          inviteCardExperimentEnabled,
        });
      } else {
        setState({
          hasTeamsEnabled,
          inviteCardExperimentEnabled,
        });
      }
      setLoading(false);
    }
  };

export const SpaceHome = () => {
  const { currentSpaceContentTypes } = useSpaceEnvContentTypes();
  const { currentSpaceId, currentSpace, currentSpaceName, currentOrganizationId } =
    useSpaceEnvContext();
  const [
    {
      managementToken,
      personEntry,
      cdaToken,
      cpaToken,
      hasTeamsEnabled,
      inviteCardExperimentEnabled,
    },
    setState,
  ] = useState({});
  const [isLoading, setLoading] = useState(true);
  const [spaceTemplateCreated, setSpaceTemplateCreated] = useState(false);
  const [isSpaceEmpty, setIsSpaceEmpty] = useState(false);
  const {
    isActiveTrialSpace,
    hasTrialSpaceExpired,
    hasTrialSpaceConverted,
    matchesAppsTrialSpaceKey,
  } = useTrialSpace(currentOrganizationId, currentSpaceId);
  const spaceRoles = getSpaceRoles(currentSpace);
  const organizationName = getOrganizationName(currentSpace);
  const isSpaceAdmin = isAdmin(currentSpace);
  const readOnlySpace = isSpaceReadyOnly(currentSpace);
  const expiredTrialSpace = hasTrialSpaceExpired && !hasTrialSpaceConverted;
  const isAuthorOrEditor = accessChecker.isAuthorOrEditor(spaceRoles ?? false);
  const isSupportEnabled = isOrganizationBillable(currentSpace);
  const isModernStack = isDevOnboardingSpace(currentSpaceName, currentSpaceId);
  const isTEA = isTEASpace(currentSpaceContentTypes, currentSpace);
  const isEnterpriseTrialSpace = isActiveTrialSpace && !matchesAppsTrialSpaceKey;

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
          inviteCardExperimentEnabled={inviteCardExperimentEnabled}
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
          inviteCardExperimentEnabled={inviteCardExperimentEnabled}
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
          isEmptySpace={isSpaceEmpty}
          inviteCardExperimentEnabled={inviteCardExperimentEnabled}
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
        />
      )}
      {!isLoading && isSpaceAdmin && !readOnlySpace && !expiredTrialSpace && adminSpaceHomePage}
      {!isLoading && readOnlySpace && <ReadOnlySpaceHome isAdmin={isSpaceAdmin} />}
      {!isLoading && <ExpiredTrialSpaceHome />}
    </div>
  );
};
