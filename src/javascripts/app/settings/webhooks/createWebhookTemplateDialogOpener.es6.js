import Templates from './templates/index.es6';
import React from 'react';
import { get } from 'lodash';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import * as WebhookEditorActions from './WebhookEditorActions.es6';
import WebhookTemplateDialog from './WebhookTemplateDialog.es6';
import { getModule } from 'NgRegistry.es6';

const $state = getModule('$state');

const isNonEmptyString = s => typeof s === 'string' && s.length > 0;

export default function createWebhookTemplateDialogOpener(config) {
  const { contentTypes, defaultLocaleCode, domain, hasAwsProxy, webhookRepo } = config;

  const validTemplateIds = Templates.map(template => template.id);
  const templateContentTypes = prepareContentTypesForTemplates(
    contentTypes,
    defaultLocaleCode,
    domain
  );

  return function openTemplateDialog(templateId, templateIdReferrer) {
    templateId = validTemplateIds.includes(templateId) ? templateId : Templates[0].id;

    ModalLauncher.open(({ onClose, isShown }) => (
      <WebhookTemplateDialog
        isShown={isShown}
        onClose={onClose}
        templateId={templateId}
        templateContentTypes={templateContentTypes}
        hasAwsProxy={hasAwsProxy}
        onCreate={(webhooks, templateId) =>
          Promise.all(
            webhooks.map(webhook => {
              return WebhookEditorActions.save(
                webhookRepo,
                webhook,
                templateId,
                templateIdReferrer
              );
            })
          ).then(webhooks => {
            onClose();
            $state.go('^.detail', { webhookId: get(webhooks, '[0].sys.id') });
            return webhooks;
          })
        }
      />
    ));
  };
}

function prepareContentTypesForTemplates(contentTypes, defaultLocaleCode, domain) {
  return contentTypes
    .filter(ct => isNonEmptyString(ct.displayField))
    .map(ct => {
      const displayField = ct.fields.find(f => f.id === ct.displayField);
      return {
        id: ct.sys.id,
        name: ct.name,
        displayFieldId: displayField && displayField.apiName
      };
    })
    .filter(ct => isNonEmptyString(ct.displayFieldId))
    .map(ct => ({
      ...ct,
      titlePointer: `/payload/fields/${ct.displayFieldId}/${defaultLocaleCode}`,
      appUrlPointers: `https://app.${domain}/spaces/{ /payload/sys/space/sys/id }/entries/{ /payload/sys/id }`
    }));
}
