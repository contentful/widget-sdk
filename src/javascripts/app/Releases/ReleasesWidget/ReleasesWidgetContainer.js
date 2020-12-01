import React, { Component, useContext, useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { TextLink, Icon, Notification, Card } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { getEntityTitle } from 'app/entry_editor/EntryReferences/referencesService';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes';
import SidebarWidgetTypes from 'app/EntrySidebar/SidebarWidgetTypes';
import EntrySidebarWidget from 'app/EntrySidebar/EntrySidebarWidget';
import ReleasesTimeline from './ReleasesTimeline';
import ReleasesWidgetDialog from './ReleasesWidgetDialog';
import {
  getReleasesFeatureVariation,
  useFeatureFlagAccessToLaunchApp,
} from '../ReleasesFeatureFlag';
import { replaceReleaseById } from '../releasesService';
import { ReleasesProvider, ReleasesContext } from './ReleasesContext';
import { releaseDetailNavigation } from '../ReleaseDetail/utils';
import { excludeEntityFromRelease, fetchReleases } from '../common/utils';
import * as Entries from 'data/entries';
import { SpaceEnvContext } from 'core/services/SpaceEnvContext/SpaceEnvContext';
import { track } from 'analytics/Analytics';
import { LaunchAppDeepLink } from './LaunchAppDeepLink';

const styles = {
  textLink: css({
    display: 'flex',
    marginTop: tokens.spacingXs,
  }),
  launchAppNote: css({
    backgroundColor: tokens.colorElementLightest,
    marginTop: tokens.spacingM,
  }),
  linkCard: css({
    flexDirection: 'column',
  }),
};

const ReleasesWidget = ({ entityInfo, entity, entityTitle }) => {
  const { state, dispatch } = useContext(ReleasesContext);
  const [isRelaseDialogShown, setIsRelaseDialogShown] = useState(false);

  useEffect(() => {
    fetchReleases(entityInfo, dispatch);
  }, [entityInfo, dispatch]);

  const onReleaseSelect = (release) => {
    releaseDetailNavigation(release);
  };

  const handleReleaseRefresh = async () => {
    fetchReleases(entityInfo, dispatch);
  };

  const deleteEntityFromRelease = (release) => {
    const releaseWithoutEntity = excludeEntityFromRelease(release, entityInfo.id);
    track('release:entity_removed', {
      releaseId: release.sys.id,
      entityId: entityInfo.id,
      entityType: entityInfo.type,
    });

    replaceReleaseById(release.sys.id, release.title, releaseWithoutEntity)
      .then(() => {
        handleReleaseRefresh();
        Notification.success(`${entityTitle || 'Untitled'} was removed from ${release.title}`);
      })
      .catch(() => {
        Notification.error(`Failed deleting entity`);
      });
  };

  const selectedEntities = useMemo(() => [entity], [entity]);
  const { launchAppAccessEnabled, islaunchAppAccessLoading } = useFeatureFlagAccessToLaunchApp();

  return (
    <EntrySidebarWidget title="Releases" testId="sidebar-releases-section">
      {state.releasesIncludingEntity.length ? (
        <ReleasesTimeline
          releases={state.releasesIncludingEntity}
          onReleaseSelect={onReleaseSelect}
          deleteEntityFromRelease={deleteEntityFromRelease}
        />
      ) : null}
      <div className={styles.textLink}>
        <Icon icon="Plus" color="primary" />
        <TextLink onClick={() => setIsRelaseDialogShown(true)}>Add to Release</TextLink>
      </div>
      {!islaunchAppAccessLoading && launchAppAccessEnabled ? (
        <Card className={styles.launchAppNote}>
          <LaunchAppDeepLink className={styles.linkCard} eventOrigin="releases-widget" />
        </Card>
      ) : null}
      {isRelaseDialogShown && (
        <ReleasesWidgetDialog
          selectedEntities={selectedEntities}
          releaseContentTitle={entityTitle}
          excludeEntityReleases={true}
          rootEntity={entity}
          handleReleaseRefresh={handleReleaseRefresh}
          onCancel={() => setIsRelaseDialogShown(false)}
        />
      )}
    </EntrySidebarWidget>
  );
};

ReleasesWidget.propTypes = {
  entityInfo: PropTypes.object.isRequired,
  entity: PropTypes.object.isRequired,
  entityTitle: PropTypes.string.isRequired,
};

export default class ReleasesWidgetContainer extends Component {
  constructor(props) {
    super(props);
    this.onUpdateReleasesWidget = this.onUpdateReleasesWidget.bind(this);
  }

  static contextType = SpaceEnvContext;

  static propTypes = {
    emitter: PropTypes.object.isRequired,
  };

  state = {
    featureEnabled: false,
    entityInfo: undefined,
    entity: undefined,
    entityTitle: undefined,
  };

  async componentDidMount() {
    const { currentSpaceId: spaceId } = this.context;
    this.props.emitter.on(SidebarEventTypes.UPDATED_RELEASES_WIDGET, this.onUpdateReleasesWidget);
    this.props.emitter.emit(SidebarEventTypes.WIDGET_REGISTERED, SidebarWidgetTypes.RELEASES);

    const featureEnabled = await getReleasesFeatureVariation(spaceId);
    this.setState({ featureEnabled });
  }

  componentWillUnmount() {
    this.props.emitter.off(SidebarEventTypes.UPDATED_RELEASES_WIDGET, this.onUpdateReleasesWidget);
  }

  async onUpdateReleasesWidget({ entityInfo, entity, contentType }) {
    const externalEntity = Entries.internalToExternal(entity, contentType);
    const entityTitle = await getEntityTitle(externalEntity);
    this.setState({ entityInfo, entity: externalEntity, entityTitle });
  }

  render() {
    const { featureEnabled, entityInfo, entity, entityTitle } = this.state;

    if (!featureEnabled || !entityInfo) {
      return null;
    }

    return (
      <ReleasesProvider>
        <ReleasesWidget entityInfo={entityInfo} entity={entity} entityTitle={entityTitle} />
      </ReleasesProvider>
    );
  }
}
