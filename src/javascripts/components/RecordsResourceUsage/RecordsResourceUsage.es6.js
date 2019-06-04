import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { get } from 'lodash';

import { showDialog as showUpgradeSpaceDialog } from 'services/ChangeSpaceService.es6';
import { getStoreResource } from 'utils/ResourceUtils.es6';
import { isMaster } from 'utils/EnvironmentUtils.es6';
import { TextLink } from '@contentful/forma-36-react-components';

import * as actionCreators from 'redux/actions/recordsResourceUsage/actionCreators.es6';

export class RecordsResourceUsage extends React.Component {
  static propTypes = {
    space: PropTypes.object.isRequired,
    environmentId: PropTypes.string.isRequired,
    currentTotal: PropTypes.number.isRequired,
    getResource: PropTypes.func.isRequired,
    resources: PropTypes.object.isRequired
  };

  componentDidUpdate(prevProps) {
    const { currentTotal: previousTotal } = prevProps;
    const { getResource, space, environmentId, currentTotal } = this.props;

    if (previousTotal !== currentTotal) {
      getResource({
        spaceId: space.sys.id,
        environmentId,
        resourceName: 'record'
      });
    }
  }

  componentDidMount() {
    const { getResource, space, environmentId } = this.props;

    getResource({
      spaceId: space.sys.id,
      environmentId,
      resourceName: 'record'
    });
  }

  resource() {
    const { resources, space } = this.props;
    const spaceId = space.sys.id;

    const resourceMeta = getStoreResource(resources, spaceId, 'record');

    if (!resourceMeta || resourceMeta.isPending) {
      return null;
    }

    return resourceMeta.value;
  }

  upgradeSpace() {
    const { space } = this.props;

    showUpgradeSpaceDialog({
      organizationId: space.organization.sys.id,
      space,
      action: 'change',
      scope: 'space',
      onSubmit: this.updateUsage
    });
  }

  render() {
    const resource = this.resource();
    const { environmentId } = this.props;

    if (!resource) {
      return null;
    }

    const usage = get(resource, 'usage');
    const limit = get(resource, 'limits.maximum');

    const warnThreshold = 0.9;
    const errorThreshold = 0.95;

    const usagePercentage = usage / limit;
    const atLimit = usagePercentage >= 1;

    return (
      <div
        className={classnames('resource-usage', {
          'resource-usage--warn': usage / limit >= warnThreshold && usage / limit < errorThreshold,
          'resource-usage--danger': usage / limit >= errorThreshold
        })}>
        {atLimit && <span>You&apos;ve reached the limit of {limit} entries and assets. </span>}
        {!atLimit && (
          <span>
            Usage: {usage} / {limit} entries and assets{' '}
          </span>
        )}
        {usagePercentage >= warnThreshold && isMaster(environmentId) && (
          <TextLink onClick={this.upgradeSpace.bind(this)}>Upgrade space</TextLink>
        )}
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    resources: state.recordsResourceUsage.resources
  };
};

const mapDispatchToProps = {
  getResource: actionCreators.getResource
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RecordsResourceUsage);
