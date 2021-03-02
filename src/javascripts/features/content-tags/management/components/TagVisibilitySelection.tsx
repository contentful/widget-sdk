import React from 'react';
import { css } from 'emotion';
import { FormLabel, Paragraph, RadioButtonField } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { TagVisibilityType } from 'features/content-tags/types';

const styles = {
  label: css({ marginBottom: 0 }),
  visibilitySelection: css({
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingL,
    '& > p': css({
      marginBottom: tokens.spacingS,
    }),
  }),
  visibilityCheckBox: css({
    marginBottom: tokens.spacingXs,
  }),
};

export const VISIBILITY: Record<string, TagVisibilityType> = {
  PRIVATE: 'private',
  PUBLIC: 'public',
};

export const TagVisibilitySelection = ({ visibility, onChange }) => {
  return (
    <div className={styles.visibilitySelection}>
      <FormLabel className={styles.label} htmlFor={''}>
        Tag visibility
      </FormLabel>
      <Paragraph>{`This can't be changed later.`}</Paragraph>
      <RadioButtonField
        testId="private-visibility-checkbox"
        name="visibility"
        id="private"
        className={styles.visibilityCheckBox}
        value={VISIBILITY.PRIVATE}
        labelText="Private (default)"
        helpText="Only available on the Management API"
        checked={visibility === VISIBILITY.PRIVATE}
        onChange={onChange}
      />
      <RadioButtonField
        testId="public-visibility-checkbox"
        name="visibility"
        id="public"
        className={styles.visibilityCheckBox}
        value={VISIBILITY.PUBLIC}
        labelText="Public"
        helpText="Available on the Management, Preview and Delivery API"
        checked={visibility === VISIBILITY.PUBLIC}
        onChange={onChange}
      />
    </div>
  );
};
