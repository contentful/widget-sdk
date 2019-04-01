import React from 'react';
import PropTypes from 'prop-types';
import {
  canPerformActionOnEntryOfType,
  canCreateAsset,
  Action
} from 'access_control/AccessChecker/index.es6';
import { newConfigFromField } from 'search/EntitySelector/Config.es6';

import { getModule } from 'NgRegistry.es6';
const spaceContext = getModule('spaceContext');
const entityCreator = getModule('entityCreator');
const slideInNavigator = getModule('navigation/SlideInNavigator');
import withWidgetApi from 'app/widgets/WidgetApi/index.es6';
import { track } from 'analytics/Analytics.es6';
import BaseLinkEditor from './LinkEditor.es6';
import { canLinkToContentType } from './Util.es6';

const entityCreatorsByType = {
  Entry: entityCreator.newEntry,
  Asset: entityCreator.newAsset
};

const SLIDE_IN_ACTIONS = { OPEN: 'open', OPEN_CREATE: 'open_create' };

/**
 * Takes the `LinkEditor` component and returns a HOC providing all props from web
 * app specific dependencies.
 */
export default function withCfWebApp(LinkEditor) {
  class HOC extends React.Component {
    static propTypes = {
      type: BaseLinkEditor.propTypes.type,
      widgetAPI: PropTypes.object.isRequired,
      loadEvents: PropTypes.shape({
        emit: PropTypes.func.isRequired
      }).isRequired
    };

    state = { contentTypes: [] };

    componentDidMount() {
      this.offContentTypes = spaceContext.publishedCTs.items$.onValue(allContentTypes => {
        const contentTypes = getAccessibleCts(allContentTypes, this.props.widgetAPI.field);
        this.setState({ contentTypes });
      });
    }

    componentWillUnmount() {
      this.offContentTypes();
    }

    render() {
      const { type, widgetAPI } = this.props;
      const { contentTypes } = this.state;
      const actions = {
        selectEntities: () => selectEntities(widgetAPI),
        createEntity: ctId => {
          const contentType = contentTypes.find(ct => ct.sys.id === ctId);
          return createEntityOfType(type, contentType);
        },
        editLinkedEntity: entity => {
          slideInLinkedEntityAndTrack(entity, SLIDE_IN_ACTIONS.OPEN);
        }
      };
      const props = {
        ...this.props,
        contentTypes,
        actions,
        canCreateEntity: type === 'Asset' ? canCreateAsset() : !!contentTypes.length,
        onLinkEntities: (entities, isNewlyCreated) => {
          if (!isNewlyCreated) {
            // Never track ":link" event together with ":create" event.
            trackLinksChanged('reference_editor_action:link', entities);
          }
        },
        onUnlinkEntities: entities => trackLinksChanged('reference_editor_action:delete', entities),
        onLinkFetchComplete: this.handleLinkRendered
      };
      return <LinkEditor {...props} />;
    }

    handleLinkRendered = () => {
      const { loadEvents, widgetAPI } = this.props;
      const { field } = widgetAPI;
      loadEvents.emit({ actionName: 'linkRendered', field });
    };
  }
  return withWidgetApi(HOC);
}

function selectEntities(widgetAPI) {
  const value = widgetAPI.field.getValue();
  const linkCount = Array.isArray(value) ? value.length : value ? 1 : 0;
  return newConfigFromField(widgetAPI.field, linkCount).then(widgetAPI.dialogs.selectEntities);
}

async function createEntityOfType(type, contentType = null) {
  const ctId = contentType && contentType.sys.id;
  const entityCreator = entityCreatorsByType[type];
  let legacyClientEntity;
  try {
    legacyClientEntity = await entityCreator(ctId);
  } catch (e) {
    return; // `entityCreator` shows a notification already.
  }
  if (type === 'Entry') {
    track('entry:create', {
      eventOrigin: 'reference-editor',
      contentType: { data: contentType },
      response: legacyClientEntity
    });
    track('reference_editor_action:create', { ctId });
  }
  const entity = legacyClientEntity.data;
  slideInLinkedEntityAndTrack(entity, SLIDE_IN_ACTIONS.OPEN_CREATE);
  return entity;
}

function slideInLinkedEntityAndTrack(entity, action) {
  const { type, id } = entity.sys;
  const slideEventData = slideInNavigator.goToSlideInEntity({ type, id });
  // Tracks: slide_in_editor:open, slide_in_editor:open_create
  track(`slide_in_editor:${action}`, slideEventData);

  if (action === SLIDE_IN_ACTIONS.OPEN && type === 'Entry') {
    track('reference_editor_action:edit', { ctId: getCtId(entity) });
  }
}

function trackLinksChanged(event, entities) {
  entities.forEach(entity => {
    if (entity.sys.type === 'Entry') {
      // TODO: We should track a count instead of being so wasteful with events.
      track(event, { ctId: getCtId(entity) });
    }
  });
}

function getAccessibleCts(allContentTypes, field) {
  return allContentTypes.filter(
    ct => canPerformActionOnEntryOfType(Action.CREATE, ct.sys.id) && canLinkToContentType(field, ct)
  );
}

function getCtId(entry) {
  return entry.sys.contentType.sys.id;
}
