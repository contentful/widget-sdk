import React from 'react';
import PropTypes from 'prop-types';
import WebhookSidebarDocumentation from './WebhookSidebarDocumentation';
import WebhookSidebarTemplatesList from './WebhookSidebarTemplatesList';

function WebhookListSidebar({ openTemplateDialog }) {
  return (
    <>
      <WebhookSidebarDocumentation />
      <WebhookSidebarTemplatesList openTemplateDialog={openTemplateDialog} />
    </>
  );
}

WebhookListSidebar.propTypes = {
  openTemplateDialog: PropTypes.func.isRequired
};

export default WebhookListSidebar;
