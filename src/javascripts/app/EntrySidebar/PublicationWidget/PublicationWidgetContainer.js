import React, { Component } from 'react';
import { get, values, omitBy, isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import SidebarEventTypes from '../SidebarEventTypes';
import SidebarWidgetTypes from '../SidebarWidgetTypes';
import PublicationWidget from './PublicationWidget';
import { getEntityTitle } from 'app/entry_editor/EntryReferences/referencesService';
import { getModule } from 'core/NgRegistry';
import { getVariation, FLAGS } from 'LaunchDarkly';

export default class PublicationWidgetContainer extends Component {
  static propTypes = {
    emitter: PropTypes.object.isRequired,
  };

  state = {
    status: '',
    updatedAt: null,
    isSaving: false,
    entity: undefined,
    isStatusSwitch: false,
    entityTitle: null,
    commands: {},
    publicationBlockedReasons: [],
  };

  async componentDidMount() {
    const spaceContext = getModule('spaceContext');
    const statusSwitchEnabled = await getVariation(FLAGS.NEW_STATUS_SWITCH, {
      spaceId: spaceContext.getId(),
      organizationId: spaceContext.organization.sys.id,
    });
    this.setState({ isStatusSwitch: statusSwitchEnabled });

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
      entity,
      status,
      isStatusSwitch,
      isSaving,
      updatedAt,
      publicationBlockedReasons,
    } = this.state;

    const primary = get(commands, 'primary');
    const secondary = get(commands, 'secondary', []);
    const publicationBlockedReason = values(publicationBlockedReasons)[0];

    return (
      <PublicationWidget
        status={status}
        entityId={get(entity, 'sys.id')}
        primary={primary}
        secondary={secondary}
        isSaving={isSaving}
        updatedAt={updatedAt}
        publicationBlockedReason={publicationBlockedReason}
        isStatusSwitch={!!entity && isStatusSwitch}
      />
    );
  }
}
