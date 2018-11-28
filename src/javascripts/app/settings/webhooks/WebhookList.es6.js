import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import StateLink from 'app/common/StateLink.es6';
import Workbench from 'app/common/Workbench.es6';
import {
  Table,
  TableHead,
  TableCell,
  TableRow,
  TableBody
} from '@contentful/forma-36-react-components';

import WebhookHealth from './WebhookHealth.es6';
import WebhookListSidebar from './WebhookListSidebar.es6';

export class WebhookList extends React.Component {
  static propTypes = {
    webhooks: PropTypes.array.isRequired,
    openTemplateDialog: PropTypes.func.isRequired,
    templateId: PropTypes.string,
    templateIdReferrer: PropTypes.string
  };

  componentDidMount() {
    if (this.props.templateId) {
      this.props.openTemplateDialog(this.props.templateId, this.props.templateIdReferrer);
    }
  }

  render() {
    const { webhooks, openTemplateDialog } = this.props;

    return (
      <Workbench testId="webhooks.list" className="webhook-list">
        <Workbench.Header>
          <Workbench.Icon icon="page-settings" />
          <Workbench.Title>Webhooks ({webhooks.length})</Workbench.Title>
        </Workbench.Header>
        <Workbench.Content>
          <Table style={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow>
                <TableCell style={{ width: '25%' }}>Webhook name</TableCell>
                <TableCell style={{ width: '40%' }}>URL</TableCell>
                <TableCell style={{ width: '20%' }}>% of successful calls</TableCell>
                <TableCell style={{ width: '20%' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {webhooks.length > 0 &&
                webhooks.map(wh => {
                  return (
                    <StateLink
                      to="^.detail"
                      params={{
                        webhookId: wh.sys.id
                      }}
                      key={wh.sys.id}>
                      {({ onClick }) => (
                        <TableRow onClick={onClick} style={{ cursor: 'pointer' }}>
                          <TableCell>
                            <strong className="x--ellipsis">{wh.name}</strong>
                          </TableCell>
                          <TableCell>
                            <code className="x--ellipsis">
                              {get(wh, ['transformation', 'method'], 'POST')} {wh.url}
                            </code>
                          </TableCell>
                          <TableCell>
                            <WebhookHealth webhookId={wh.sys.id} />
                          </TableCell>
                          <TableCell>
                            <button className="text-link">View details</button>
                          </TableCell>
                        </TableRow>
                      )}
                    </StateLink>
                  );
                })}
              {webhooks.length < 1 && (
                <TableRow>
                  <TableCell colSpan="4">Add a webhook, then manage it in this space.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Workbench.Content>
        <Workbench.Sidebar>
          <WebhookListSidebar
            webhookCount={webhooks.length}
            openTemplateDialog={openTemplateDialog}
          />
        </Workbench.Sidebar>
      </Workbench>
    );
  }
}

export default WebhookList;
