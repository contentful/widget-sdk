import React from 'react';
import PropTypes from 'prop-types';
import WebhookSidebarDocumentation from './WebhookSidebarDocumentation.es6';
import WebhookSidebarTemplatesList from './WebhookSidebarTemplatesList.es6';

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
