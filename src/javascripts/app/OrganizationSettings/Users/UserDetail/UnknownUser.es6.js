import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip, Tag, Icon } from '@contentful/ui-component-library';

export default class UnknownUser extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired
  };
  render() {
    return (
      <Tooltip content={`This user is no longer a member of your organization`}>
        <React.Fragment>
          <Icon icon="ErrorCircle" color="muted" style={{ verticalAlign: 'bottom' }} />{' '}
          <Tag tagType="muted">{this.props.id}</Tag>
        </React.Fragment>
      </Tooltip>
    );
  }
}
