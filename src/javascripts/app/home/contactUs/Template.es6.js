import React from 'react';
import PropTypes from 'prop-types';

const prefix = 'space-home-page-contact-us';

export default class ContactUs extends React.Component {
  static propTypes = {
    isVisible: PropTypes.bool,
    onClick: PropTypes.func.isRequired
  };

  static defaultProps = {
    isVisible: false
  };

  render() {
    const { isVisible, onClick } = this.props;

    if (!isVisible) {
      return null;
    }

    return (
      <div className={`home-section ${prefix}__container`}>
        <div>
          <h3 className="home-section__heading">A fast setup for your project</h3>
          <div className="home-section__description">
            Most projects launch faster when they receive advice from our experts.
          </div>
          <div>
            <span className="button btn-action" onClick={onClick}>
              Contact an expert
            </span>
          </div>
        </div>
        <div className={`${prefix}__img`} />
      </div>
    );
  }
}
