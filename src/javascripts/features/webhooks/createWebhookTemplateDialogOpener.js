import React from 'react';
import { get } from 'lodash';
import * as Navigator from 'states/Navigator';
import { ModalLauncher } from '@contentful/forma-36-react-components/dist/alpha';
import * as WebhookEditorActions from './WebhookEditorActions';
import { WebhookTemplateDialog } from './WebhookTemplateDialog';
import { WebhookTemplates } from './templates';

const isNonEmptyString = (s) => typeof s === 'string' && s.length > 0;

export function createWebhookTemplateDialogOpener(config, spaceId) {
  const { contentTypes, defaultLocaleCode, domain, hasAwsProxy } = config;

  const validTemplateIds = WebhookTemplates.map((template) => template.id);
  const templateContentTypes = prepareContentTypesForTemplates(
    contentTypes,
    defaultLocaleCode,
    domain
  );

  return function openTemplateDialog(templateId, templateIdReferrer) {
    templateId = validTemplateIds.includes(templateId) ? templateId : WebhookTemplates[0].id;

    ModalLauncher.open(({ onClose, isShown }) => (
      <WebhookTemplateDialog
        isShown={isShown}
        onClose={onClose}
        templateId={templateId}
        templateContentTypes={templateContentTypes}
        hasAwsProxy={hasAwsProxy}
        onCreate={(webhooks, templateId) =>
          Promise.all(
            webhooks.map((webhook) => {
              return WebhookEditorActions.save(webhook, spaceId, templateId, templateIdReferrer);
            })
          ).then((webhooks) => {
            onClose();
            Navigator.go({
              path: ['^.detail'],
              params: {
                webhookId: get(webhooks, '[0].sys.id'),
              },
            });
            return webhooks;
          })
        }
      />
    ));
  };
}

function prepareContentTypesForTemplates(contentTypes, defaultLocaleCode, domain) {
  return contentTypes
    .filter((ct) => isNonEmptyString(ct.displayField))
    .map((ct) => {
      const displayField = ct.fields.find((f) => f.id === ct.displayField);
      return {
        id: ct.sys.id,
        name: ct.name,
        displayFieldId: displayField && displayField.apiName,
      };
    })
    .filter((ct) => isNonEmptyString(ct.displayFieldId))
    .map((ct) => ({
      ...ct,
      titlePointer: `/payload/fields/${ct.displayFieldId}/${defaultLocaleCode}`,
      appUrlPointers: `https://app.${domain}/spaces/{ /payload/sys/space/sys/id }/entries/{ /payload/sys/id }`,
    }));
}
