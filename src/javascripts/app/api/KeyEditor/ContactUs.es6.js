import React from 'react';
import PropTypes from 'prop-types';

export default class ContactUs extends React.Component {
  static propTypes = {
    track: PropTypes.func.isRequired,
    openIntercom: PropTypes.func.isRequired
  };

  render () {
    const {track, openIntercom} = this.props;
    return <div className="boilerplate-page-contact-us__container">
      <h3 className="boilerplate-page-contact-us__title">
        A fast setup for your project
      </h3>
      <div className="boilerplate-page-contact-us__description">
        Most projects launch faster when they receive advice from our experts.
      </div>
      <div>
        <span
          className="button btn-secondary-action"
          onClick={() => {
            track();
            openIntercom();
          }}
        >
          Contact an expert
        </span>
      </div>
      <div className="boilerplate-page-contact-us__img"/>
    </div>;
  }
}
