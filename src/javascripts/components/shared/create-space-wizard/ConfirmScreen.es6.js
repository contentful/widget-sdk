import React from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';

const ConfirmScreen = createReactClass({
  propTypes: {
    isFormSubmitted: PropTypes.bool,
    onSubmit: PropTypes.func.isRequired,
    onDimensionsChange: PropTypes.func.isRequired
  },
  render () {
    const {
      isFormSubmitted,
      onSubmit
    } = this.props;

    return (
      <div>
        <h2 className="create-space-wizard__heading">
          Confirm your selection
        </h2>
        <p className="create-space-wizard__subheading">
          Make sure everything is in order before creating the space.
        </p>
        <div style={{textAlign: 'center', margin: '1.2em 0'}}>
          <button
            className={`button btn-action ${isFormSubmitted ? 'is-loading' : ''}`}
            disabled={isFormSubmitted}
            onClick={onSubmit}>
            Confirm and create space
          </button>
        </div>
      </div>
    );
  },
  componentDidMount () {
    this.props.onDimensionsChange();
  }
});

export default ConfirmScreen;
