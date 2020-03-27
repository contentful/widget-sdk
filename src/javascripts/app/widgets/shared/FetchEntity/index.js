import React from 'react';
import PropTypes from 'prop-types';
import RequestStatus from './RequestStatus';
import * as EntityHelpers from 'app/entity_editor/entityHelpers';

import * as EntityState from 'data/CMA/EntityState';

export { RequestStatus };

export default class FetchEntity extends React.PureComponent {
  static propTypes = {
    widgetAPI: PropTypes.object.isRequired,
    entityId: PropTypes.string.isRequired,
    entityType: PropTypes.oneOf(['Entry', 'Asset']).isRequired,
    localeCode: PropTypes.string,
    fetchFile: PropTypes.bool,
    render: PropTypes.func.isRequired,
  };
  static defaultProps = {
    fetchFile: true,
  };

  constructor(props) {
    super(props);

    const { entityId, entityType } = props;
    this.state = {
      entityId,
      entityType,
      requestStatus: RequestStatus.Pending,
    };
  }

  componentDidMount() {
    this.fetchEntity();

    // TODO: Ideally we would only re-fetch entity that was edited (could be multiple in case of bulk-editor)
    this.unsubscribeSlideInNavigation = this.props.widgetAPI.navigator.onSlideInNavigation(
      ({ oldSlideLevel, newSlideLevel }) => {
        if (oldSlideLevel > newSlideLevel) {
          this.fetchEntity();
        }
      }
    );
  }

  componentWillUnmount() {
    this.unmounting = true;
    this.unsubscribeSlideInNavigation();
  }

  fetchEntity = async () => {
    const { widgetAPI, entityId, entityType, localeCode, fetchFile } = this.props;

    this.setStateSafe({
      requestStatus: RequestStatus.Pending,
    });

    let entity, contentType;
    try {
      const getEntity =
        entityType === 'Entry' ? widgetAPI.space.getEntry : widgetAPI.space.getAsset;
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
      entityHelpers.entityDescription(entity),
    ]);

    const entityStatus = EntityState.stateName(EntityState.getState(entity.sys));

    this.setStateSafe({
      entity,
      entityTitle,
      entityDescription,
      entityFile: this.state.entityFile || undefined,
      entityStatus,
      contentTypeName: contentType && contentType.name,
      requestStatus: fetchFile ? RequestStatus.Pending : RequestStatus.Success,
    });

    const entityFile = await entityFilePromise;
    this.setStateSafe({
      entityFile,
      requestStatus: RequestStatus.Success,
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
