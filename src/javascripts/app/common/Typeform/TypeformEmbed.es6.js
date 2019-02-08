import React from 'react';
import PropTypes from 'prop-types';
import { getTypeformEmbedLib } from './utils.es6';

/**
 * @description
 *
 * A component that lets you embed a Typeform either as a popup
 * or as a widget.
 * More info: https://developer.typeform.com/embed/modes/
 *
 * @styling
 *
 * To style the container, you can style this component itself.
 * The styles will only be visible if you render your Typeform as
 * a widget.
 * This is due to the fact that, when you render your Typeform as a
 * popup, the Typeform scripts embed a div & iframe outside of this
 * hierarchy and give us no way of styling it.
 *
 */
export class TypeformEmbed extends React.Component {
  typeformContainerElement;
  typeformPopup; // can be accessed on the ref for TypeformEmbed

  static propTypes = {
    // required props
    url: PropTypes.string.isRequired,
    renderAs: PropTypes.oneOf(['popup', 'widget']).isRequired,

    // common options
    hideHeaders: PropTypes.bool,
    hideFooter: PropTypes.bool,
    onSubmit: PropTypes.func,

    // styling
    className: PropTypes.string,

    // widget mode options
    widgetOpacity: PropTypes.number,
    widgetStartButtonText: PropTypes.string,

    // popup mode options
    popupMode: PropTypes.oneOf(['popup', 'drawer_left', 'drawer_right']),
    popupAutoOpen: PropTypes.bool,
    // Auto close popup after submission
    // if not on Pro+ plan, anywhere between 1s - 5s otherwise whatever you configure in your Typeform form settings
    popupAutoCloseDuration: PropTypes.number
  };

  static defaultProps = {
    hideHeaders: true,
    hideFooter: true,
    onSubmit: () => {},

    // widget defaults
    widgetOpacity: 100,
    widgetStartButtonText: 'Start',

    // styling
    className: '',

    // popup defaults
    popupMode: 'popup',
    popupAutoOpen: false,
    popupAutoCloseDuration: 5000 // this is the default for non-PRO+ accounts
  };

  componentDidMount = async () => {
    const {
      url,
      renderAs,
      hideHeaders,
      hideFooter,
      onSubmit,
      widgetOpacity: opacity,
      widgetStartButtonText: buttonText,
      popupMode: mode,
      popupAutoOpen: autoOpen,
      popupAutoCloseDuration: autoClose
    } = this.props;

    const typeformEmbedLib = await getTypeformEmbedLib();

    if (renderAs === 'widget') {
      typeformEmbedLib.makeWidget(this.typeformContainerElement, url, {
        hideHeaders,
        hideFooter,
        opacity,
        buttonText,
        onSubmit
      });
    } else if (renderAs === 'popup') {
      this.typeformPopup = typeformEmbedLib.makePopup(url, {
        mode,
        autoOpen,
        autoClose,
        hideHeaders,
        hideFooter,
        onSubmit
      });
    } else {
      throw new Error('Incorrect render mode used for TypeformEmbed component');
    }
  };

  render() {
    return (
      <div
        className={this.props.className}
        ref={tf => {
          this.typeformContainerElement = tf;
        }}
      />
    );
  }
}
