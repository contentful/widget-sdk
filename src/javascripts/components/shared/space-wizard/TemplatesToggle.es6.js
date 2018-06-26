import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';

const TemplatesToggle = createReactClass({
  propTypes: {
    isShowingTemplates: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired
  },
  render () {
    const {isShowingTemplates, onChange} = this.props;
    return (
      <div className="cfnext-form__field create-new-space__form__radios create-space-wizard__centered-block">
        <div className="cfnext-form-option create-new-space__form__option">
          <input
            id="newspace-template-none"
            type="radio"
            name="isShowingTemplates"
            value="false"
            checked={!isShowingTemplates}
            onChange={() => onChange(false)} />
          <label htmlFor="newspace-template-none">
            <strong>Create an empty space. </strong>
            <span className="create-new-space__form__label-description">
              I’ll fill it with my own content.
            </span>
          </label>
        </div>
        <div className="cfnext-form-option create-new-space__form__option">
          <input
            id="newspace-template-usetemplate"
            type="radio"
            name="isShowingTemplates"
            value="true"
            checked={isShowingTemplates}
            onChange={() => onChange(true)} />
          <label htmlFor="newspace-template-usetemplate">
            <strong>Create an example space. </strong>
            <span className="create-new-space__form__label-description">
              I’d like to see how things work first.
            </span>
          </label>
        </div>
      </div>
    );
  }
});

export default TemplatesToggle;
