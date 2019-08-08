import React from 'react';
import { getModule } from 'NgRegistry.es6';
import PropTypes from 'prop-types';
import RequestStatus from './RequestStatus.es6';

import * as EntityState from 'data/CMA/EntityState.es6';

export { RequestStatus };

export default class FetchEntity extends React.PureComponent {
  static propTypes = {
    widgetAPI: PropTypes.object.isRequired,
    entityId: PropTypes.string.isRequired,
    entityType: PropTypes.oneOf(['Entry', 'Asset']).isRequired,
    localeCode: PropTypes.string,
    fetchFile: PropTypes.bool,
    render: PropTypes.func.isRequired
  };
  static defaultProps = {
    fetchFile: true
  };
  state = {
    requestStatus: RequestStatus.Pending
  };
  componentDidMount() {
    this.fetchEntity();
  }
  componentWillUnmount() {
    this.unmounting = true;
  }
  componentDidUpdate(prevProps) {
    const currentUrl = this.props.widgetAPI.currentUrl;
    const prevUrl = prevProps.widgetAPI.currentUrl;

    const prevEntryId = prevUrl.pathname.split('/').pop();

    // TODO: Find better way of detecting whether entity was edited than this path hack.
    // TODO: This does not work in case of bulk editor edit.
    const hasUserJustEditedEntity = () =>
      currentUrl.pathname !== prevUrl.pathname && prevEntryId === this.props.entityId;

    if (
      this.props.entityId !== prevProps.entityId ||
      this.props.entityType !== prevProps.entityType ||
      hasUserJustEditedEntity()
    ) {
      this.fetchEntity();
    }
  }
  fetchEntity = async () => {
    // TODO: Move this to an es6 module depending on parts of `widgetApi`
    const EntityHelpers = getModule('EntityHelpers');

    const { widgetAPI, entityId, entityType, localeCode, fetchFile } = this.props;

    this.setStateSafe({
      requestStatus: RequestStatus.Pending
    });

    let entity, contentType;
    try {
      let getEntity;
      if (entityType === 'Entry') {
        getEntity = id => widgetAPI.space.getEntry(id);
      } else {
        getEntity = id => widgetAPI.space.getAsset(id);
      }
      entity = await getEntity(entityId);
      if (entity.sys.contentType) {
        const contentTypeId = entity.sys.contentType.sys.id;
        contentType = await widgetAPI.space.getContentType(contentTypeId);
      }
    } catch (error) {
      this.setStateSafe({ requestStatus: RequestStatus.Error });
      return;
    }

    const entityHelpers = EntityHelpers.newForLocale(localeCode);
    const entityFilePromise = fetchFile
      ? entityHelpers.entityFile(entity)
      : Promise.resolve(undefined);

    const [entityTitle, entityDescription] = await Promise.all([
      entityHelpers.entityTitle(entity),
      entityHelpers.entityDescription(entity)
    ]);

    const entityStatus = EntityState.stateName(EntityState.getState(entity.sys));

    this.setStateSafe({
      entity,
      entityTitle,
      entityDescription,
      entityFile: this.state.entityFile || undefined,
      entityStatus,
      contentTypeName: contentType && contentType.name,
      requestStatus: fetchFile ? RequestStatus.Pending : RequestStatus.Success
    });

    const entityFile = await entityFilePromise;
    this.setStateSafe({
      entityFile,
      requestStatus: RequestStatus.Success
    });
  };
  setStateSafe(newState) {
    if (!this.unmounting) {
      this.setState(newState);
    }
  }
  render() {
    return this.props.render(this.state);
  }
}
