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
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';
import * as K from 'core/utils/kefir';
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
  getOrganizationId,
  getOrganizationName,
  isOrganizationBillable,
} from 'core/services/SpaceEnvContext/utils';
import { getModule } from 'core/NgRegistry';
import { isSpaceOnTrial } from 'features/trials';
import { getVariation, FLAGS } from 'LaunchDarkly';
import { TrialSpaceHome } from './TrialSpaceHome';

const isTEASpace = (publishedItems, currentSpace) => {
  const publishedCTs = K.getValue(publishedItems) || [];
  return (
    publishedCTs.find((ct) => {
      return get(ct, ['sys', 'id']) === 'layoutHighlightedCourse';
    }) || isContentOnboardingSpace(currentSpace)
  );
};

const fetchData = (
  setLoading,
  setState,
  isSpaceAdmin,
  isTEA,
  currentSpace,
  currentSpaceId,
  setIsTrialCommEnabled
) => async () => {
  setLoading(true);

  const hasTeamsEnabled = await getOrgFeature(currentSpaceId, 'teams', false);
  getVariation(FLAGS.PLATFORM_TRIAL_COMM, { spaceId: currentSpaceId }).then((flag) =>
    setIsTrialCommEnabled(flag)
  );

  if (!currentSpaceId || !isSpaceAdmin) {
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
    if (isDevOnboardingSpace(currentSpace)) {
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
  const spaceContext = getModule('spaceContext'); // TODO: Edge case, should be moved to a different service/provider
  const { currentSpaceId, currentSpace, currentSpaceName } = useSpaceEnvContext();
  const [
    { managementToken, personEntry, cdaToken, cpaToken, hasTeamsEnabled },
    setState,
  ] = useState({});
  const [isLoading, setLoading] = useState(true);
  const [isTrialCommEnabled, setIsTrialCommEnabled] = useState(false);

  const spaceRoles = getSpaceRoles(currentSpace);
  const organizationId = getOrganizationId(currentSpace);
  const organizationName = getOrganizationName(currentSpace);
  const isSpaceAdmin = isAdmin(currentSpace);
  const readOnlySpace = isSpaceReadyOnly(currentSpace);
  const isAuthorOrEditor = accessChecker.isAuthorOrEditor(spaceRoles ?? false);
  const isSupportEnabled = isOrganizationBillable(currentSpace);
  const isModernStack = isDevOnboardingSpace(currentSpace);
  const isTEA = isTEASpace(spaceContext.publishedCTs.items$, currentSpace);
  const isTrialSpace = isTrialCommEnabled && isSpaceOnTrial(currentSpace.data);
  const spaceHomeProps = {
    orgId: organizationId,
    orgName: organizationName,
    spaceId: currentSpaceId,
    spaceName: currentSpaceName,
  };
  let adminSpaceHomePage;

  useAsync(
    useCallback(
      fetchData(
        setLoading,
        setState,
        isSpaceAdmin,
        isTEA,
        currentSpace,
        currentSpaceId,
        setIsTrialCommEnabled
      ),
      [spaceTemplateCreated]
    )
  );

  if (currentSpace && !isLoading && isSpaceAdmin) {
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
        />
      );
    }
  }

  return (
    <div className="home home-section" data-test-id="space-home-page-container">
      <DocumentTitle title="Space home" />
      {!isLoading && !currentSpace && (
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
          spaceId={spaceHomeProps.spaceId}
          isTrialSpace={isTrialSpace}
        />
      )}
      {!isLoading && isSpaceAdmin && !readOnlySpace && adminSpaceHomePage}
      {!isLoading && readOnlySpace && <ReadOnlySpaceHome isAdmin={isSpaceAdmin} />}
      {!isLoading && !isSpaceAdmin && !isAuthorOrEditor && isTrialSpace && (
        <TrialSpaceHome spaceName={spaceHomeProps.spaceName} spaceId={spaceHomeProps.spaceId} />
      )}
    </div>
  );
};

SpaceHomePage.propTypes = {
  spaceTemplateCreated: PropTypes.bool,
  orgOwnerOrAdmin: PropTypes.bool,
  orgId: PropTypes.string,
};

export default SpaceHomePage;
