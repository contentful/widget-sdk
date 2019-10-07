import React from 'react';
import PropTypes from 'prop-types';
import {
  canPerformActionOnEntryOfType,
  canCreateAsset,
  Action
} from 'access_control/AccessChecker/index.es6';
import { noop, find, get } from 'lodash';
import { newConfigFromField } from 'search/EntitySelector/Config.es6';
import * as slideInNavigator from 'navigation/SlideInNavigator/index.es6';
import { getModule } from 'NgRegistry.es6';
import connectToWidgetApi from 'app/widgets/WidgetApi/connectToWidgetApi.es6';
import * as entityCreator from 'components/app_container/entityCreator.es6';
import { track } from 'analytics/Analytics.es6';
import BaseLinkEditor from './LinkEditor.es6';
import { canLinkToContentType } from './Util.es6';

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
      }).isRequired,
      onChange: PropTypes.func
    };

    static defaultProps = {
      onChange: noop
    };

    state = { contentTypes: [] };

    componentDidMount() {
      const spaceContext = getModule('spaceContext');
      const fetchContentTypes = allContentTypes => {
        const contentTypes = getAccessibleCts(allContentTypes, this.props.widgetAPI.field);
        this.setState({ contentTypes });
      };
      const ct$ = spaceContext.publishedCTs.items$;
      ct$.onValue(fetchContentTypes);
      this.offContentTypes = () => ct$.offValue(fetchContentTypes);
    }

    componentWillUnmount() {
      this.offContentTypes();
    }

    handleOpenLink(entity, index, action) {
      const { widgetAPI } = this.props;
      const useBulkEditor = widgetAPI.settings.bulkEditing;
      const { type, id } = entity.sys;
      let slide = { type, id };
      if (useBulkEditor) {
        const entryId = widgetAPI.entry.getSys().id;
        if (!isAnotherBulkEditorOpen()) {
          const field = widgetAPI.field;
          const path = [entryId, field.id, field.internalLocale, index];
          slide = { type: 'BulkEditor', path };
        } else {
          let refCount = 0;
          try {
            refCount = widgetAPI.field.getValue().length;
          } catch (_e) {
            // widgetAPI.field.getValue() may return undefined
          }

          trackOpenSlideInInsteadOfBulk({
            parentEntryId: entryId,
            refCount
          });
        }
      }
      slideInLinkedEntityAndTrack(slide, action, useBulkEditor);
    }

    handleChange = links => {
      const value = links && links.length === 0 ? undefined : links;
      this.props.onChange(value);
    };

    render() {
      const { type, widgetAPI } = this.props;
      const { contentTypes } = this.state;
      const actions = {
        selectEntities: () => selectEntities(widgetAPI),
        createEntity: async ctId => {
          const contentType = contentTypes.find(ct => ct.sys.id === ctId);
          const entity = await createEntityOfType(type, contentType);
          if (entity) {
            this.handleOpenLink(entity, -1, SLIDE_IN_ACTIONS.OPEN_CREATE);
            return entity;
          }
        },
        editLinkedEntity: (entity, index) => {
          this.handleOpenLink(entity, index, SLIDE_IN_ACTIONS.OPEN);
          if (entity.sys.type === 'Entry') {
            track('reference_editor_action:edit', { ctId: getCtId(entity) });
          }
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
        onLinkFetchComplete: this.handleLinkRendered,
        onChange: this.handleChange
      };
      return <LinkEditor {...props} />;
    }

    handleLinkRendered = () => {
      const { loadEvents, widgetAPI } = this.props;
      const { field } = widgetAPI;
      loadEvents.emit({ actionName: 'linkRendered', field });
    };
  }
  return connectToWidgetApi(HOC);
}

function selectEntities(widgetAPI) {
  const value = widgetAPI.field.getValue();
  const linkCount = Array.isArray(value) ? value.length : value ? 1 : 0;
  return newConfigFromField(widgetAPI.field, linkCount).then(widgetAPI.dialogs.selectEntities);
}

async function createEntityOfType(type, contentType = null) {
  const entityCreatorsByType = {
    Entry: entityCreator.newEntry,
    Asset: entityCreator.newAsset
  };

  const ctId = contentType && contentType.sys.id;
  const entityCreatorFn = entityCreatorsByType[type];
  let legacyClientEntity;
  try {
    legacyClientEntity = await entityCreatorFn(ctId);
  } catch (e) {
    return; // `entityCreator` shows a notification already.
  }
  if (type === 'Entry') {
    track('entry:create', {
      eventOrigin: 'reference-editor',
      contentType: contentType,
      response: get(legacyClientEntity, 'data')
    });
    track('reference_editor_action:create', { ctId });
  }
  return legacyClientEntity.data;
}

function slideInLinkedEntityAndTrack(slide, action) {
  const slideEventData = slideInNavigator.goToSlideInEntity(slide);
  // Tracks: slide_in_editor:open, slide_in_editor:open_create
  track(`slide_in_editor:${action}`, slideEventData);
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

function isAnotherBulkEditorOpen() {
  return !!find(slideInNavigator.getSlideInEntities(), { type: 'BulkEditor' });
}

function trackOpenSlideInInsteadOfBulk(data) {
  // Limiting the user to only one bulk editor was decided for the sake of
  // UX and performance. Since the bulk editor as a slide refactoring we allow
  // the bulk editor to be opened from any slide level, not just the first one.
  track('bulk_editor:open_slide_in', data);
}
