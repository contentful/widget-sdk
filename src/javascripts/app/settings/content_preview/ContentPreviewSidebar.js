import React from 'react';
import StateLink from 'app/common/StateLink';
import { Typography, Paragraph, TextLink } from '@contentful/forma-36-react-components';
import WorkbenchSidebarItem from 'app/common/WorkbenchSidebarItem';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase';

export const WhatIsContentPreview = () => (
  <WorkbenchSidebarItem title="What‘s content preview?">
    <Typography>
      <Paragraph>
        Adding a content preview generates a link in the entry editor, referring to your custom
        preview environment.
      </Paragraph>
      <Paragraph>
        <KnowledgeBase target="content_preview" text="Read the guide" inlineText /> before setting
        up a custom content preview.
      </Paragraph>
    </Typography>
  </WorkbenchSidebarItem>
);

export const TokensForContentPreview = () => (
  <WorkbenchSidebarItem title="Tokens for content preview URLs">
    <Typography>
      <Paragraph>
        Use these representative tokens in your URLs. They will be replaced with the corresponding
        values when the preview is opened in the entry editor.
      </Paragraph>
      <Paragraph>
        <code className="content-preview-sidebar__token">{'{entry}'}</code>
        <span> : an object containing all the properties and their values for the entry</span>
      </Paragraph>
      <Paragraph>You can get the value of any property, for example:</Paragraph>
      <Paragraph>
        <code className="content-preview-sidebar__token">{'{entry.sys.id}'}</code>
        <span>
          {' '}
          : <code>id</code> of the current entry
        </span>
      </Paragraph>
      <Paragraph>
        <code className="content-preview-sidebar__token">{'{entry.fields.slug}'}</code>
        <span>
          {' '}
          : the default locale value of the <code>slug</code> field for the current entry
        </span>
      </Paragraph>
    </Typography>
  </WorkbenchSidebarItem>
);

export const LinkedEntries = () => (
  <WorkbenchSidebarItem title="Linked entries">
    <Typography>
      <Paragraph>
        Additionally, you can query{' '}
        <TextLink
          href="https://www.contentful.com/developers/docs/references/content-delivery-api/#/reference/search-parameters/links-to-entry"
          target="_blank"
          rel="noopener noreferrer">
          incoming links to entry
        </TextLink>{' '}
        by using the <em>{'{entry.linkedBy}'}</em> property (the first entry in response will be
        used):
      </Paragraph>
      <Paragraph>
        <code className="content-preview-sidebar__token">{'{entry.linkedBy.sys.id}'}</code>
        <span>
          {' '}
          : <code>id</code> of the entry, which references current entry (which is open in the
          editor)
        </span>
      </Paragraph>
      <Paragraph>It also supports walking up in the incoming links graph as shown below:</Paragraph>
      <Paragraph>
        <code className="content-preview-sidebar__token">
          {'{entry.linkedBy.linkedBy.fields.slug}'}
        </code>
        <span>
          {' '}
          : value of the <code>slug</code> field for the entry, which references entry from the
          previous example
        </span>
      </Paragraph>
    </Typography>
  </WorkbenchSidebarItem>
);

export const LegacyTokens = () => (
  <WorkbenchSidebarItem title="Legacy tokens">
    <Typography>
      <Paragraph>
        These tokens are deprecated, since their functionality is covered by{' '}
        <em>{'{entry.sys.id}'}</em> and <em>{'{entry.fields.slug}'}</em>.
      </Paragraph>
      <Paragraph>
        <code className="content-preview-sidebar__token">{'{entry_id}'}</code>
        <span> : Entry ID</span>
      </Paragraph>
      <Paragraph>
        <code className="content-preview-sidebar__token">{'{entry_field.id}'}</code> : Entry fields
        - the value of any given field can be used by passing the ID of the respective field. For
        example, to use the field with the ID slug, the token would be{' '}
        <em>{'{entry_field.slug}'}</em>.
      </Paragraph>
      <Paragraph>
        Use the <StateLink to="spaces.detail.content_types.list">content model explorer</StateLink>{' '}
        to retreive the ID of the field(s) you want to use.
      </Paragraph>
    </Typography>
  </WorkbenchSidebarItem>
);
