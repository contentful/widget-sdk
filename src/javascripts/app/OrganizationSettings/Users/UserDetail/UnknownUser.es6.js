import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip, Tag, Icon } from '@contentful/forma-36-react-components';

export default class UnknownUser extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired
  };
  render() {
    return (
      <Tooltip content={`This user is no longer a member of your organization`}>
        <span style={{ whiteSpace: 'nowrap' }}>
          <Icon icon="ErrorCircle" color="muted" style={{ verticalAlign: 'bottom' }} />{' '}
          <Tag tagType="muted">{this.props.id}</Tag>
        </span>
      </Tooltip>
    );
  }
}
