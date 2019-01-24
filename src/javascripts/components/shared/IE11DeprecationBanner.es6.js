import React from 'react';
import PropTypes from 'prop-types';
import { Note, TextLink } from '@contentful/forma-36-react-components';

export default class IE11DeprecationBanner extends React.Component {
  static propTypes = {
    featureName: PropTypes.string.isRequired,
    noteType: PropTypes.string,
    extraClassNames: PropTypes.string
  };

  static defaultProps = {
    noteType: undefined,
    extraClassNames: undefined
  };

  render() {
    const { featureName, noteType, extraClassNames } = this.props;

    return (
      <Note noteType={noteType} extraClassNames={extraClassNames}>
        The {featureName} is not supported in Internet Explorer 11. For more information{' '}
        <TextLink
          href="//www.contentful.com/faq/about-contentful/#which-browsers-does-contentful-support"
          target="_blank">
          see the FAQ
        </TextLink>
      </Note>
    );
  }
}
