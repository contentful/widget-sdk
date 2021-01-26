import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';

import FormSection from 'components/forms/FormSection';
import { WebhookSegmentation } from './WebhookSegmentation';
import { transformTopicsToMap, transformMapToTopics } from './WebhookSegmentationState';
import { WebhookHeaders } from './WebhookHeaders';
import { WebhookBasicAuth } from './WebhookBasicAuth';
import { WebhookBodyTransformation } from './WebhookBodyTransformation';
import {
  FormLabel,
  Heading,
  Checkbox,
  Paragraph,
  Select,
  Option,
  TextInput,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { WebhookFilters } from './WebhookFilters';
import { transformFiltersToList, transformListToFilters } from './WebhookFiltersState';
import { WILDCARD } from './WebhookSegmentationState';
import { WebhookOtherEventsSection } from './WebhookOtherEventsSection';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { hasOptedIntoAliases } from 'core/services/SpaceEnvContext/utils';

const METHODS = ['POST', 'GET', 'PUT', 'PATCH', 'DELETE'];

const FORM_URLENCODED_CONTENT_TYPE = 'application/x-www-form-urlencoded';
const CONTENT_TYPES = [
  'application/vnd.contentful.management.v1+json',
  'application/vnd.contentful.management.v1+json; charset=utf-8',
  'application/json',
  'application/json; charset=utf-8',
  FORM_URLENCODED_CONTENT_TYPE,
  `${FORM_URLENCODED_CONTENT_TYPE}; charset=utf-8`,
];

const styles = {
  contentLengthHeader: css({
    fontSize: tokens.fontSizeM,
  }),
  contentLengthLabel: css({
    marginTop: tokens.spacingS,
    fontWeight: tokens.fontWeightNormal,
  }),
  webhookFormSection: css({
    marginTop: tokens.spacingM,
  }),
  webhookLabel: css({
    display: 'block',
  }),
  webhookMethodSettings: css({
    display: 'flex',
  }),
  webhookMethod: css({
    marginRight: tokens.spacingXs,
  }),
  webhookURL: css({
    flexGrow: 1,
  }),
};

export const WebhookForm = ({ webhook, onChange }) => {
  const { currentSpaceEnvironments } = useSpaceEnvContext();
  const contentType = get(webhook, ['transformation', 'contentType'], CONTENT_TYPES[0]);
  const includeContentLength = get(webhook, ['transformation', 'includeContentLength'], false);
  const values = transformTopicsToMap(webhook.topics);
  const isWildcarded = values === WILDCARD;
  const hasEnvironmentAliases = hasOptedIntoAliases(currentSpaceEnvironments);

  const updatedTransformation = (change) => {
    const { transformation } = webhook;
    const cur = transformation || {};
    return { transformation: { ...cur, ...change } };
  };

  return (
    <div className="webhook-editor__settings f36-padding-top--s">
      <FormSection title="Details">
        <div className={styles.webhookFormSection}>
          <FormLabel className={styles.webhookLabel} required={true} htmlFor="webhook-name">
            Name
          </FormLabel>
          <TextInput
            width={'full'}
            id="webhook-name"
            value={webhook.name || ''}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </div>
        <div className={styles.webhookFormSection}>
          <FormLabel className={styles.webhookLabel} required={true}>
            URL
          </FormLabel>
          <div className={styles.webhookMethodSettings}>
            <Select
              width={'auto'}
              className={styles.webhookMethod}
              testId="webhook-method-select"
              value={get(webhook, ['transformation', 'method'], METHODS[0])}
              onChange={(e) => onChange(updatedTransformation({ method: e.target.value }))}>
              {METHODS.map((m) => (
                <Option key={m} value={m}>
                  {m}
                </Option>
              ))}
            </Select>
            <TextInput
              className={styles.webhookURL}
              value={webhook.url || ''}
              onChange={(e) => onChange({ url: e.target.value })}
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="Triggers" collapsible={true}>
        <WebhookSegmentation
          webhook={webhook}
          values={values}
          onChange={(map) => onChange({ topics: transformMapToTopics(map) })}
        />
        <WebhookFilters
          filters={transformFiltersToList(webhook.filters)}
          onChange={(list) => onChange({ filters: transformListToFilters(list) })}
        />
        {hasEnvironmentAliases && !isWildcarded && (
          <WebhookOtherEventsSection
            values={values}
            onChange={(map) => onChange({ topics: transformMapToTopics(map) })}
          />
        )}
      </FormSection>

      <FormSection title="Headers" collapsible={true}>
        <WebhookHeaders headers={webhook.headers} onChange={(headers) => onChange({ headers })} />
        <WebhookBasicAuth
          httpBasicUsername={webhook.httpBasicUsername}
          onChange={(credentials) => onChange(credentials)}
        />
        <div className="cfnext-form__field">
          <FormLabel className={styles.webhookLabel} htmlFor="webhook-content-type">
            Content type
          </FormLabel>
          <Select
            className={styles.webhookSelectCT}
            id="webhook-content-type"
            testId="content-type-select"
            value={contentType}
            onChange={(e) => onChange(updatedTransformation({ contentType: e.target.value }))}>
            {CONTENT_TYPES.map((ct) => (
              <Option key={ct} value={ct}>
                {ct}
              </Option>
            ))}
          </Select>
          <Paragraph className="entity-editor__field-hint">
            Select one of allowed MIME types to be used as the value of the{' '}
            <code>Content-Type</code> header. Any custom <code>Content-Type</code> header will be
            ignored.
          </Paragraph>
          {contentType.startsWith(FORM_URLENCODED_CONTENT_TYPE) && (
            <Paragraph className="entity-editor__field-hint">
              For your current selection JSON payload will be automatically converted to URL encoded
              form data.
            </Paragraph>
          )}
        </div>
        <div className="cfnext-form__field">
          <Heading element="h3" className={styles.contentLengthHeader}>
            Content length
          </Heading>
          <FormLabel className={styles.contentLengthLabel}>
            <Checkbox
              checked={includeContentLength}
              onChange={(e) =>
                onChange(updatedTransformation({ includeContentLength: e.target.checked }))
              }
            />{' '}
            Automatically compute the value of the <code>Content-Length</code> header
          </FormLabel>
          <Paragraph className="entity-editor__field-hint">
            If this option is selected, the byte size of the final request body will be computed and
            used as the value of the <code>Content-Length</code> header.
          </Paragraph>
        </div>
      </FormSection>

      <FormSection title="Payload" collapsible={true}>
        <WebhookBodyTransformation
          body={get(webhook, ['transformation', 'body'])}
          onChange={(body) => onChange(updatedTransformation({ body }))}
        />
      </FormSection>
    </div>
  );
};

WebhookForm.propTypes = {
  webhook: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
