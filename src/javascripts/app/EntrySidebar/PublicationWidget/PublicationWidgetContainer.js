import React, { Component } from 'react';
import { get, values, omitBy, isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import SidebarEventTypes from '../SidebarEventTypes';
import SidebarWidgetTypes from '../SidebarWidgetTypes';
import PublicationWidget from './PublicationWidget';
import { ScheduledActionsWidget } from 'app/ScheduledActions';
import ScheduledActionsFeatureFlag from 'app/ScheduledActions/ScheduledActionsFeatureFlag';
import { getEntityTitle } from 'app/entry_editor/EntryReferences/referencesService';
import { SpaceEnvContext } from 'core/services/SpaceEnvContext/SpaceEnvContext';

export default class PublicationWidgetContainer extends Component {
  static propTypes = {
    emitter: PropTypes.object.isRequired,
  };

  static contextType = SpaceEnvContext;

  state = {
    status: '',
    updatedAt: null,
    isSaving: false,
    showDiscardButton: false,
    spaceId: undefined,
    environmentId: undefined,
    userId: undefined,
    entity: undefined,
    validator: undefined,
    entityTitle: null,
  };

  async componentDidMount() {
    this.props.emitter.on(
      SidebarEventTypes.UPDATED_PUBLICATION_WIDGET,
      this.onUpdatePublicationWidget
    );
    this.props.emitter.on(
      SidebarEventTypes.SET_PUBLICATION_BLOCKING,
      this.onUpdatePublicationBlocking
    );
    this.props.emitter.emit(SidebarEventTypes.WIDGET_REGISTERED, SidebarWidgetTypes.PUBLICATION);
  }

  componentWillUnmount() {
    this.props.emitter.off(
      SidebarEventTypes.UPDATED_PUBLICATION_WIDGET,
      this.onUpdatePublicationWidget
    );
    this.props.emitter.off(
      SidebarEventTypes.SET_PUBLICATION_BLOCKING,
      this.onUpdatePublicationBlocking
    );
  }

  onUpdatePublicationWidget = async (update) => {
    const entityTitle = await getEntityTitle(update.entity);
    this.setState({ ...update, entityTitle });
  };

  onUpdatePublicationBlocking = (publicationBlockedReasons) => {
    this.setState((prevState) => ({
      publicationBlockedReasons: omitBy(
        {
          ...prevState.publicationBlockedReasons,
          ...publicationBlockedReasons,
        },
        isEmpty
      ),
    }));
  };

  render() {
    const {
      commands,
      spaceId,
      environmentId,
      isMasterEnvironment,
      entity,
      userId,
      status,
      isSaving,
      updatedAt,
      validator,
      publicationBlockedReasons,
    } = this.state;

    const revert = get(commands, 'revertToPrevious');
    const primary = get(commands, 'primary');
    const secondary = get(commands, 'secondary', []);
    const publicationBlockedReason = values(publicationBlockedReasons)[0];

    return (
      <ScheduledActionsFeatureFlag>
        {({ currentVariation }) => {
          const isJobsFeatureEnabled = currentVariation;
          const isDeletedEntity = !entity;
          return !isJobsFeatureEnabled || isDeletedEntity ? (
            <PublicationWidget
              status={status}
              primary={primary}
              secondary={secondary}
              revert={revert}
              isSaving={this.state.isSaving}
              updatedAt={this.state.updatedAt}
              publicationBlockedReason={publicationBlockedReason}
            />
          ) : (
            <ScheduledActionsWidget
              spaceId={spaceId}
              environmentId={environmentId}
              isMasterEnvironment={isMasterEnvironment}
              userId={userId}
              entity={entity}
              status={status}
              primary={primary}
              secondary={secondary}
              revert={revert}
              isSaving={isSaving}
              updatedAt={updatedAt}
              validator={validator}
              publicationBlockedReason={publicationBlockedReason}
              emitter={this.props.emitter}
            />
          );
        }}
      </ScheduledActionsFeatureFlag>
    );
  }
}
