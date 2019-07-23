import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import StateLink from 'app/common/StateLink.es6';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import Icon from 'ui/Components/Icon.es6';
import {
  Table,
  TableHead,
  TableCell,
  TableRow,
  TableBody,
  Button
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
      <Workbench testId="webhooks.list">
        <Workbench.Header
          icon={<Icon name="page-settings" scale="0.8" />}
          title={`Webhooks (${webhooks.length})`}
          actions={
            <StateLink to="^.new">
              {({ onClick }) => (
                <Button testId="add-webhook-button" icon="PlusCircle" onClick={onClick}>
                  Add Webhook
                </Button>
              )}
            </StateLink>
          }
        />
        <Workbench.Content type="full">
          <Table>
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
                        <TableRow
                          testId="webhook-row"
                          onClick={onClick}
                          style={{ cursor: 'pointer' }}>
                          <TableCell>
                            <strong data-test-id="webhook-name" className="x--ellipsis">
                              {wh.name}
                            </strong>
                          </TableCell>
                          <TableCell>
                            <code data-test-id="webhook-code" className="x--ellipsis">
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
                <TableRow testId="empty-webhook-row">
                  <TableCell colSpan="4">Add a webhook, then manage it in this space.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Workbench.Content>
        <Workbench.Sidebar position="right">
          <WebhookListSidebar openTemplateDialog={openTemplateDialog} />
        </Workbench.Sidebar>
      </Workbench>
    );
  }
}

export default WebhookList;
