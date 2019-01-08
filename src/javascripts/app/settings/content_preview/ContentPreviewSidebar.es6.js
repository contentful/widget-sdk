import React from 'react';
import StateLink from 'app/common/StateLink.es6';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase.es6';

export const WhatIsContentPreview = () => (
  <React.Fragment>
    <h2 className="entity-sidebar__heading">What‘s content preview?</h2>
    <p>
      Adding a content preview generates a link in the entry editor, referring to your custom
      preview environment.
    </p>
    <p>
      <KnowledgeBase target="content_preview" text="Read the guide" inlineText /> before setting up
      a custom content preview.
    </p>
  </React.Fragment>
);

export const TokensForContentPreview = () => (
  <React.Fragment>
    <h2 className="entity-sidebar__heading">Tokens for content preview URLs</h2>
    <p>
      Use these representative tokens in your URLs. They will be replaced with the corresponding
      values when the preview is opened in the entry editor.
    </p>
    <p>
      <code className="content-preview-sidebar__token">{'{entry}'}</code>
      <span> : an object containing all the properties and their values for the entry</span>
    </p>
    <p>You can get the value of any property, for example:</p>
    <p>
      <code className="content-preview-sidebar__token">{'{entry.sys.id}'}</code>
      <span>
        {' '}
        : <code>id</code> of the current entry
      </span>
    </p>
    <p>
      <code className="content-preview-sidebar__token">{'{entry.fields.slug}'}</code>
      <span>
        {' '}
        : the default locale value of the <code>slug</code> field for the current entry
      </span>
    </p>
  </React.Fragment>
);

export const LinkedEntries = () => (
  <React.Fragment>
    <h2 className="entity-sidebar__heading">Linked entries</h2>
    <p>
      Additionally, you can query{' '}
      <a
        href="https://www.contentful.com/developers/docs/references/content-delivery-api/#/reference/search-parameters/links-to-entry"
        target="_blank"
        rel="noopener noreferrer">
        incoming links to entry
      </a>{' '}
      by using the <em>{'{entry.linkedBy}'}</em> property (the first entry in response will be
      used):
    </p>
    <p>
      <code className="content-preview-sidebar__token">{'{entry.linkedBy.sys.id}'}</code>
      <span>
        {' '}
        : <code>id</code> of the entry, which references current entry (which is open in the editor)
      </span>
    </p>
    <p> It also supports walking up in the incoming links graph as shown below:</p>
    <p>
      <code className="content-preview-sidebar__token">
        {'{entry.linkedBy.linkedBy.fields.slug}'}
      </code>
      <span>
        {' '}
        : value of the <code>slug</code> field for the entry, which references entry from the
        previous example
      </span>
    </p>
  </React.Fragment>
);

export const LegacyTokens = () => (
  <React.Fragment>
    <h2 className="entity-sidebar__heading">Legacy tokens</h2>
    <p>
      These tokens are deprecated, since their functionality is covered by{' '}
      <em>{'{entry.sys.id}'}</em> and <em>{'{entry.fields.slug}'}</em>.
    </p>
    <p>
      <code className="content-preview-sidebar__token">{'{entry_id}'}</code>
      <span> : Entry ID</span>
    </p>
    <p>
      <code className="content-preview-sidebar__token">{'{entry_field.id}'}</code> : Entry fields -
      the value of any given field can be used by passing the ID of the respective field. For
      example, to use the field with the ID slug, the token would be <em>{'{entry_field.slug}'}</em>
      .
    </p>
    <p>
      Use the <StateLink to="spaces.detail.content_types.list">content model explorer</StateLink> to
      retreive the ID of the field(s) you want to use.
    </p>
  </React.Fragment>
);
