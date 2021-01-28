import React from 'react';
import PropTypes from 'prop-types';
import { FormLabel, Paragraph, RadioButton } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { WebhookSegmentationTable } from './WebhookSegmentationTable';
import { WILDCARD, createMap } from './WebhookSegmentationState';

const styles = {
  checkboxWrapper: css({
    marginBottom: tokens.spacingM,
  }),
  note: css({
    marginBottom: tokens.spacingS,
  }),
  formLabel: css({
    fontWeight: tokens.fontWeightNormal,
    color: tokens.colorTextMid,
    display: 'block',
  }),
};

export class WebhookSegmentation extends React.Component {
  static propTypes = {
    values: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
  };

  renderOption(caption, checked, onChange) {
    return (
      <FormLabel className={styles.formLabel}>
        <RadioButton
          testId={'webhook-editor-setting-option'}
          checked={checked}
          onChange={onChange}
        />
        {` ${caption}`}
      </FormLabel>
    );
  }

  render() {
    const { values, onChange } = this.props;
    const isWildcarded = values === WILDCARD;

    return (
      <div className={styles.checkboxWrapper} id="webhook-segmentation">
        <Paragraph className={styles.note}>
          Specify for what kind of events this webhook should be triggered.
        </Paragraph>
        {this.renderOption('Trigger for all events', isWildcarded, () => onChange(WILDCARD))}
        {this.renderOption('Select specific triggering events', !isWildcarded, () =>
          onChange(createMap(false))
        )}
        {!isWildcarded && <WebhookSegmentationTable values={values} onChange={onChange} />}
      </div>
    );
  }
}
