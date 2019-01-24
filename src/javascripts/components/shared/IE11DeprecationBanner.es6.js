import React from 'react';
import PropTypes from 'prop-types';
import { Note, TextLink } from '@contentful/forma-36-react-components';
import { detect as detectBrowser } from 'detect-browser';

export default class IE11DeprecationBanner extends React.Component {
  static propTypes = {
    featureName: PropTypes.string.isRequired,
    noteType: PropTypes.string,
    extraClassNames: PropTypes.string,
    ie11Only: PropTypes.bool
  };

  static defaultProps = {
    noteType: undefined,
    extraClassNames: undefined,
    ie11Only: false
  };

  browserIsIE11() {
    return detectBrowser().name === 'ie';
  }

  render() {
    const { featureName, noteType, ie11Only, extraClassNames } = this.props;

    if (ie11Only && !this.browserIsIE11()) {
      return null;
    }

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
