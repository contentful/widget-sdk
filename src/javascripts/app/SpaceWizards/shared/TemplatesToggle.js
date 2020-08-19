import React from 'react';
import PropTypes from 'prop-types';

import { FieldGroup, RadioButtonField, FormLabel } from '@contentful/forma-36-react-components';

import classnames from 'classnames';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  toggleWrapperNewFlow: css({
    width: 'auto',
  }),
  newSpacePurchaseFlow: css({
    '> div': {
      display: 'flex',
    },
    label: {
      display: 'inline-block',
      padding: '8px 30px',
      boxShadow: tokens.boxShadowDefault,
      border: `1px solid ${tokens.colorElementDark}`,
      borderRadius: '2px',
      color: tokens.colorTextMid,
      marginRight: tokens.spacingM,
      fontWeight: tokens.fontWeightNormal,
      '&:hover': css({
        border: `1px solid ${tokens.colorBlueDark}`,
        cursor: 'pointer',
      }),
    },
    input: {
      opacity: 0,
      position: 'fixed',
      width: 0,
      '&:checked + div': css({
        label: {
          color: tokens.colorTextDark,
          border: `1px solid ${tokens.colorBlueDark}`,
        },
      }),
    },
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

      <div
        className={classnames({
          [styles.newSpacePurchaseFlow]: isNewSpacePurchaseFlow,
        })}>
        <FieldGroup className={styles.test}>
          <RadioButtonField
            name="isShowingTemplates"
            id="isShowingTemplates-false"
            labelText={isNewSpacePurchaseFlow ? 'Empty Space' : 'Create an empty space.'}
            helpText={isNewSpacePurchaseFlow ? '' : 'I’ll fill it with my own content.'}
            onChange={() => onChange(false)}
            checked={!isShowingTemplates}
            value="false"
            testId="template-toggle-false"
          />
          <RadioButtonField
            name="isShowingTemplates"
            id="isShowingTemplates-true"
            labelText={isNewSpacePurchaseFlow ? 'Example Space' : 'Create an example space.'}
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
