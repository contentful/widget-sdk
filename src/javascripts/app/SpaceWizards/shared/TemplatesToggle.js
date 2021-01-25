import React from 'react';
import PropTypes from 'prop-types';

import { FieldGroup, RadioButtonField, FormLabel } from '@contentful/forma-36-react-components';

import classnames from 'classnames';
import { css } from 'emotion';

const styles = {
  toggleWrapperNewFlow: css({
    width: 'auto',
  }),
};

export default function TemplatesToggle(props) {
  const { isShowingTemplates, onChange, formAlign, isNewSpacePurchaseFlow } = props;

  return (
    <div
      data-test-id="templates-toggle-wrapper"
      className={classnames('cfnext-form__field create-new-space__form__radios', {
        'create-space-wizard__centered-block': !formAlign || formAlign === 'center',
        [styles.toggleWrapperNewFlow]: isNewSpacePurchaseFlow,
      })}>
      {isNewSpacePurchaseFlow && (
        <FormLabel htmlFor="template-selector">
          Start from scratch or with an example to see how things work?
        </FormLabel>
      )}

      <div>
        <FieldGroup>
          <RadioButtonField
            name="isShowingTemplates"
            id="isShowingTemplates-false"
            labelText={isNewSpacePurchaseFlow ? 'Empty space' : 'Create an empty space.'}
            helpText={isNewSpacePurchaseFlow ? '' : 'I’ll fill it with my own content.'}
            onChange={() => onChange(false)}
            checked={!isShowingTemplates}
            value="false"
            testId="template-toggle-false"
          />
          <RadioButtonField
            name="isShowingTemplates"
            id="isShowingTemplates-true"
            labelText={isNewSpacePurchaseFlow ? 'Example space' : 'Create an example space.'}
            helpText={isNewSpacePurchaseFlow ? '' : 'I’d like to see how things work first.'}
            onChange={() => onChange(true)}
            checked={isShowingTemplates}
            value="true"
            testId="template-toggle-true"
          />
        </FieldGroup>
      </div>
    </div>
  );
}

TemplatesToggle.propTypes = {
  isShowingTemplates: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  formAlign: PropTypes.oneOf(['left', 'center']),
  isNewSpacePurchaseFlow: PropTypes.bool,
};
