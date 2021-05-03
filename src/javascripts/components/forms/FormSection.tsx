import React from 'react';
import { Subheading, Flex } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  settingsFormSection: css({
    marginTop: tokens.spacingM,
    paddingTop: '0',
    paddingRight: tokens.spacing2Xl,
    paddingBottom: tokens.spacingM,
    borderTop: `1px solid ${tokens.colorElementLight}`,
  }),
  settingsFormHeaderSection: css({
    margin: `-13px 0 ${tokens.spacingS} ${tokens.spacingM}`,
  }),
  settingsFormHeader: css({
    background: tokens.colorWhite,
    padding: `0 ${tokens.spacingXs}`,
  }),
  settingsFormContent: css({
    marginLeft: tokens.spacingXl,
  }),
};

type FormSectionProps = {
  title: string;
  children: Array<React.ReactNode> | React.ReactNode;
  testId: string;
};

const FormSection = ({ title, children, testId }: FormSectionProps) => {
  return (
    <div className={styles.settingsFormSection} data-test-id={testId}>
      <Flex className={styles.settingsFormHeaderSection}>
        <Subheading element="h3" className={styles.settingsFormHeader}>
          {title}
        </Subheading>
      </Flex>
      <div className={styles.settingsFormContent}>{children}</div>
    </div>
  );
};

export default FormSection;
