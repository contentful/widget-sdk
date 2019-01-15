import React from 'react';
import { getModule } from 'NgRegistry.es6';
import PropTypes from 'prop-types';

import RequestStatus from '../RequestStatus.es6';

// TODO: Move this to `widgetAPI`.
const EntityHelpers = getModule('EntityHelpers');
const EntityState = getModule('data/CMA/EntityState.es6');

export default class FetchEntity extends React.PureComponent {
  static propTypes = {
    widgetAPI: PropTypes.object.isRequired,
    entityId: PropTypes.string.isRequired,
    entityType: PropTypes.oneOf(['Entry', 'Asset']).isRequired,
    localeCode: PropTypes.string.isRequired,
    render: PropTypes.func.isRequired
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
    const { widgetAPI, entityId, entityType, localeCode } = this.props;

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
    const entityFilePromise = entityHelpers.entityFile(entity);

    const [entityTitle, entityDescription] = await Promise.all([
      entityHelpers.entityTitle(entity),
      entityHelpers.entityDescription(entity)
    ]);

    const entityStatus = EntityState.stateName(EntityState.getState(entity.sys));

    this.setStateSafe({
      entity,
      entityTitle,
      entityDescription,
      entityFile: undefined,
      entityStatus,
      contentTypeName: contentType && contentType.name,
      requestStatus: RequestStatus.Pending // Wait for `entityFile`.
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
