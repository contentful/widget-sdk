import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { Spinner } from '@contentful/forma-36-react-components';
import AuthorEditorSpaceHome from './AuthorEditorSpaceHome.es6';
import AdminSpaceHome from './AdminSpaceHome.es6';
import TEAAdminSpaceHome from './TEAAdminSpaceHome.es6';
import ModernStackAdminSpaceHome from './ModernStackAdminSpaceHome.es6';
import ReadOnlySpaceHome from './ReadOnlySpaceHome.es6';
import EmptySpaceHome from './EmptySpaceHome.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';
import {
  getPerson,
  getCredentials,
  isDevOnboardingSpace,
  isContentOnboardingSpace
} from 'components/shared/auto_create_new_space/CreateModernOnboarding.es6';
import { getModule } from 'NgRegistry.es6';
import { runTask } from 'utils/Concurrent.es6';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer.es6';
import * as K from 'utils/kefir.es6';
import * as accessChecker from 'access_control/AccessChecker';
import useAsync from 'app/common/hooks/useAsync.es6';
import { getOrgFeature } from 'data/CMA/ProductCatalog.es6';
import * as logger from 'services/logger.es6';
import { getApiKeyRepo } from 'app/settings/api/services/ApiKeyRepoInstance';

const isTEASpace = () => {
  const spaceContext = getModule('spaceContext');
  const publishedCTs = K.getValue(spaceContext.publishedCTs.items$) || [];
  return (
    publishedCTs.find(ct => {
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
    runTask(function*() {
      let key;
      try {
        [key] = yield getApiKeyRepo().getAll();
      } catch (e) {
        logger.logError('Space Home', e);
      }
      // there might be no keys - it was not created yet, or user explicitly removed them
      if (key) {
        const keyWithPreview = yield getApiKeyRepo().get(key.sys.id);
        setState({
          hasTeamsEnabled,
          cdaToken: key.accessToken,
          cpaToken: keyWithPreview.preview_api_key.accessToken
        });
      }
      setLoading(false);
    });
    return;
  } else {
    if (isDevOnboardingSpace(get(spaceContext, 'space'))) {
      const [credentials, personEntry] = await Promise.all([getCredentials(), getPerson()]);
      setState({
        hasTeamsEnabled,
        managementToken: credentials && credentials.managementToken,
        personEntry
      });
    } else {
      setState({
        hasTeamsEnabled
      });
    }
    setLoading(false);
    return;
  }
};

const SpaceHomePage = ({ spaceTemplateCreated, lastUsedOrg, orgOwnerOrAdmin }) => {
  const spaceContext = getModule('spaceContext');
  const [isLoading, setLoading] = useState(true);
  const [
    { managementToken, personEntry, cdaToken, cpaToken, hasTeamsEnabled },
    setState
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
    spaceId: spaceContext.getData('sys.id')
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
      {isLoading && (
        <EmptyStateContainer>
          <Spinner size="large" />
        </EmptyStateContainer>
      )}
      {!isLoading && !spaceContext.space && (
        <EmptySpaceHome lastUsedOrg={lastUsedOrg} orgOwnerOrAdmin={orgOwnerOrAdmin} />
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
  lastUsedOrg: PropTypes.string,
  orgOwnerOrAdmin: PropTypes.bool
};

export default SpaceHomePage;
