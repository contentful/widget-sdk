import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import StateLink from 'app/common/StateLink';
import { WebhookListShell } from './skeletons/WebhookListRouteSkeleton';
import {
  Table,
  TableHead,
  TableCell,
  TableRow,
  TableBody,
  Button,
  TextLink
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';

import WebhookHealth from './WebhookHealth';
import WebhookListSidebar from './WebhookListSidebar';

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
      <WebhookListShell
        title={`Webhooks (${webhooks.length})`}
        actions={
          <StateLink path="^.new">
            {({ onClick }) => (
              <Button testId="add-webhook-button" icon="PlusCircle" onClick={onClick}>
                Add Webhook
              </Button>
            )}
          </StateLink>
        }
        sidebar={<WebhookListSidebar openTemplateDialog={openTemplateDialog} />}>
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
                    path="^.detail"
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
                          <TextLink>View details</TextLink>
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
      </WebhookListShell>
    );
  }
}

export default WebhookList;
