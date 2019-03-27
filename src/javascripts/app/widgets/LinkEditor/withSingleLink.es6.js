import { noop } from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import CfPropTypes from 'utils/CfPropTypes.es6';

export default function withSingleLink(LinkEditor) {
  return class extends React.Component {
    static propTypes = {
      value: CfPropTypes.Link,
      onChange: PropTypes.func
    };

    static defaultProps = {
      onChange: noop,
      single: false
    };

    handleChange = links => {
      this.props.onChange(links[0] || undefined);
    };

    render() {
      const { value } = this.props;
      const links = value ? [value] : [];
      return (
        <LinkEditor {...this.props} isSingle={true} value={links} onChange={this.handleChange} />
      );
    }
  };
}
