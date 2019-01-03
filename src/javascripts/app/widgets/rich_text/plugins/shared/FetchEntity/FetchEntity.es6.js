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
    if (
      this.props.entityId !== prevProps.entityId ||
      this.props.entityType !== prevProps.entityType ||
      this.props.widgetAPI.currentUrl !== prevProps.widgetAPI.currentUrl
    ) {
      this.fetchEntity();
    }
  }
  fetchEntity = async () => {
    const { widgetAPI, entityId, entityType, localeCode } = this.props;
    const entityHelpers = EntityHelpers.newForLocale(localeCode);
    const getEntity = id => widgetAPI.space[`get${entityType}`](id);

    this.setState({
      requestStatus: RequestStatus.Pending
    });
    let entity, contentType;
    try {
      entity = await getEntity(entityId);
      if (entity.sys.contentType) {
        const contentTypeId = entity.sys.contentType.sys.id;
        contentType = await widgetAPI.space.getContentType(contentTypeId);
      }
    } catch (error) {
      if (!this.unmounting) {
        this.setState({ requestStatus: RequestStatus.Error });
      }
      return;
    }
    const entityFilePromise = entityHelpers.entityFile(entity);
    const [entityTitle, entityDescription] = await Promise.all([
      entityHelpers.entityTitle(entity),
      entityHelpers.entityDescription(entity)
    ]);
    if (!this.unmounting) {
      this.setState({
        entity,
        entityTitle,
        entityDescription,
        entityFile: undefined,
        entityStatus: EntityState.stateName(EntityState.getState(entity.sys)),
        contentTypeName: contentType && contentType.name,
        requestStatus: RequestStatus.Pending // Wait for `entityFile`.
      });
      const entityFile = await entityFilePromise;
      if (!this.unmounting) {
        this.setState({
          entityFile,
          requestStatus: RequestStatus.Success
        });
      }
    }
  };
  render() {
    return this.props.render(this.state);
  }
}
