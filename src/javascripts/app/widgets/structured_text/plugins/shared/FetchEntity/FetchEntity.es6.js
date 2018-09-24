import React from 'react';
import PropTypes from 'prop-types';

import * as EntityState from '../../../../../../data/CMA/EntityState.es6';
import RequestStatus from '../RequestStatus.es6';

const DEFAULT_ENTRY = {
  sys: {
    contentType: {
      sys: {}
    }
  },
  fields: {}
};

export default class FetchEntity extends React.Component {
  static propTypes = {
    // TODO: Add `locale` prop.
    entityId: PropTypes.string.isRequired,
    entityType: PropTypes.oneOf(['Entry', 'Asset']).isRequired,
    currentUrl: PropTypes.string, // TODO: Replace with sth. more generic.
    render: PropTypes.func.isRequired,
    $services: PropTypes.shape({
      // TODO: Use `widgetApi` and `EntityHelpers` instead.
      spaceContext: PropTypes.object
    }).isRequired
  };
  state = {
    entry: DEFAULT_ENTRY,
    requestStatus: RequestStatus.Pending
  };
  componentDidMount() {
    this.fetchEntity();
  }
  componentWillUnmount() {
    this._unmounting = true;
  }
  componentDidUpdate(prevProps) {
    if (
      this.props.entityId !== prevProps.entityId ||
      this.props.entityType !== prevProps.entityType ||
      this.props.currentUrl !== prevProps.currentUrl
    ) {
      this.fetchEntity();
    }
  }
  fetchEntity = async () => {
    const { entityId, entityType } = this.props;
    const spaceContext = this.props.$services.spaceContext;
    const getEntity = id => spaceContext.space[`get${entityType}`](id);

    this.setState({
      requestStatus: RequestStatus.Pending
    });
    let entity, contentType;
    try {
      entity = await getEntity(entityId);
      const contentTypeId = entity.data.sys.contentType.sys.id;
      contentType = await spaceContext.space.getContentType(contentTypeId);
    } catch (error) {
      if (!this._unmounting) {
        this.setState({
          requestStatus: RequestStatus.Error
        });
      }
      return;
    }
    if (!this._unmounting) {
      this.setState({
        entry: entity.data,
        entryWrapper: entity, // TODO: Do not rely on wrapper, only use actual entity.
        contentTypeName: contentType.data.name,
        entryTitle: spaceContext.entryTitle(entity),
        entryDescription: spaceContext.entityDescription(entity),
        entryStatus: EntityState.stateName(EntityState.getState(entity.data.sys)),
        requestStatus: RequestStatus.Success
      });
    }
  };
  render() {
    return this.props.render(this.state);
  }
}
