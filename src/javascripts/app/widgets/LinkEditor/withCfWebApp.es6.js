import { noop } from 'lodash';
import { canLinkToContentType } from './Util.es6';
import React from 'react';
import {
  canPerformActionOnEntryOfType,
  canCreateAsset,
  Action
} from 'access_control/AccessChecker/index.es6';
import { newConfigFromField } from 'search/EntitySelector/Config.es6';

import { getModule } from 'NgRegistry.es6';
const spaceContext = getModule('spaceContext');
const entityCreator = getModule('entityCreator');
const entityCreatorsByType = {
  Entry: entityCreator.newEntry,
  Asset: entityCreator.newAsset
};
import withWidgetApi from 'app/widgets/WidgetApi/index.es6';

/**
 * Takes the `LinkEditor` component and returns a HOC providing all props from web
 * app specific dependencies.
 */
export default function withCfWebApp(LinkEditor) {
  class HOC extends React.Component {
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
        createEntity: ctId => createEntityOfType(type, ctId),
        editLinkTarget: link => slideInLinkedEntity(widgetAPI, link)
      };
      const props = {
        ...this.props,
        contentTypes,
        actions
      };
      return <LinkEditor {...props} />;
    }
  }
  return withWidgetApi(HOC);
}

function selectEntities(widgetAPI) {
  const value = widgetAPI.field.getValue();
  const linkCount = Array.isArray(value) ? value.length : value ? 1 : 0;
  return newConfigFromField(widgetAPI.field, linkCount).then(widgetAPI.dialogs.selectEntities);
}

async function createEntityOfType(type, contentTypeId) {
  const legacyClientEntity = await entityCreatorsByType[type](contentTypeId);
  return legacyClientEntity.data;
}

function slideInLinkedEntity(widgetAPI, link) {
  const { linkType, id } = link.sys;
  return widgetAPI.navigator.openEntity(linkType, id, { slideIn: true });
}

function getAccessibleCts(allContentTypes, field) {
  return allContentTypes.filter(
    ct => canPerformActionOnEntryOfType(Action.CREATE, ct.sys.id) && canLinkToContentType(field, ct)
  );
}
