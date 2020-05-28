import React from 'react';
import PropTypes from 'prop-types';

import { FieldGroup, RadioButtonField } from '@contentful/forma-36-react-components';

import classnames from 'classnames';

export default function TemplatesToggle(props) {
  const { isShowingTemplates, onChange, formAlign } = props;
  return (
    <div
      data-test-id="templates-toggle-wrapper"
      className={classnames('cfnext-form__field create-new-space__form__radios', {
        'create-space-wizard__centered-block': !formAlign || formAlign === 'center',
      })}>
      <FieldGroup>
        <RadioButtonField
          name="isShowingTemplates"
          id="isShowingTemplates-false"
          labelText="Create an empty space."
          helpText="I’ll fill it with my own content."
          onChange={() => onChange(false)}
          checked={!isShowingTemplates}
          value="false"
          testId="template-toggle-false"
        />
        <RadioButtonField
          name="isShowingTemplates"
          id="isShowingTemplates-true"
          labelText="Create an example space."
          helpText="I’d like to see how things work first."
          onChange={() => onChange(true)}
          checked={isShowingTemplates}
          value="true"
          testId="template-toggle-true"
        />
      </FieldGroup>
    </div>
  );
}

TemplatesToggle.propTypes = {
  isShowingTemplates: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  formAlign: PropTypes.oneOf(['left', 'center']),
};
