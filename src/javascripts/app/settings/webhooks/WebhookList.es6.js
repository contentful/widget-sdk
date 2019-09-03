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
import { css } from 'emotion';

import WebhookHealth from './WebhookHealth.es6';
import WebhookListSidebar from './WebhookListSidebar.es6';

const styles = {
  nameCell: css({
    width: '25%'
  }),
  urlCell: css({
    width: '40%'
  }),
  callsCell: css({
    width: '20%'
  }),
  actionsCell: css({
    width: '20%'
  }),
  row: css({
    cursor: 'pointer'
  })
};

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
                <TableCell className={styles.nameCell}>Webhook name</TableCell>
                <TableCell className={styles.urlCell}>URL</TableCell>
                <TableCell className={styles.callsCell}>% of successful calls</TableCell>
                <TableCell className={styles.actionsCell}>Actions</TableCell>
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
                        <TableRow testId="webhook-row" onClick={onClick} className={styles.row}>
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
