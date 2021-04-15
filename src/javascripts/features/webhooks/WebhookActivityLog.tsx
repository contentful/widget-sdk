/* eslint "rulesdir/restrict-inline-styles": "warn" */
import React from 'react';
import { range } from 'lodash';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@contentful/forma-36-react-components';
import { WebhookCallStatus } from './WebhookCallStatus';
import { getWebhookRepo } from './services/WebhookRepoInstance';
import { SpaceEnvContext } from 'core/services/SpaceEnvContext/SpaceEnvContext';
import { RouteLink } from 'core/react-routing';

const PER_PAGE = 30;

interface WebhookLogCall {
  sys: {
    id: string;
  };
  statusCode: number;
  errors: string[];
  requestAt: string;
}

interface WebhookActivityLogProps {
  webhookId: string;
  registerLogRefreshAction: (fetch: ({ spaceId: string }) => Promise<void>) => void;
}

interface WebhookActivityLogState {
  page: number;
  loading: boolean;
  calls: WebhookLogCall[];
}

export class WebhookActivityLog extends React.Component<
  WebhookActivityLogProps,
  WebhookActivityLogState
> {
  static contextType = SpaceEnvContext;

  state = { page: 0, loading: false, calls: [] };

  componentDidMount() {
    const { currentSpaceId: spaceId } = this.context;
    this.fetch({ spaceId });
    this.props.registerLogRefreshAction(this.fetch);
  }

  fetch = async ({ spaceId }: { spaceId: string }) => {
    const { webhookId } = this.props;
    const webhookRepo = getWebhookRepo({ spaceId });

    if (typeof webhookId !== 'string' || this.state.loading) {
      return;
    }

    this.setState({ loading: true });

    try {
      const calls = (await webhookRepo.logs.getCalls(webhookId)) as WebhookLogCall[];
      this.setState({ page: 0, loading: false, calls });
    } catch (_) {
      this.setState({ page: 0, loading: false, calls: [] });
    }
  };

  render() {
    const { page, loading, calls } = this.state;

    // Assignment is done in `fetch`, therefore here calls can either be never[] or WebhookCall[]
    // Given that fetch is the only place with assignment, we can force the type.
    const pageCalls = (calls as WebhookLogCall[]).slice(page * PER_PAGE, (page + 1) * PER_PAGE);
    const pages = range(0, Math.ceil(calls.length / PER_PAGE));

    return (
      <React.Fragment>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell style={{ width: '35%' }}>Webhook called at</TableCell>
              <TableCell style={{ width: '20%' }}>Call result</TableCell>
              <TableCell style={{ width: '45%' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={3}>Loading logs…</TableCell>
              </TableRow>
            )}
            {!loading && pageCalls.length < 1 && (
              <TableRow>
                <TableCell colSpan={3}>No webhook calls yet!</TableCell>
              </TableRow>
            )}
            {!loading &&
              pageCalls.length > 0 &&
              pageCalls.map((call) => {
                return (
                  <RouteLink
                    as={TableRow}
                    route={{
                      path: 'webhooks.detail.call',
                      callId: call.sys.id,
                      webhookId: this.props.webhookId,
                    }}
                    key={call.sys.id}
                    style={{ cursor: 'pointer' }}>
                    <TableCell>{call.requestAt}</TableCell>
                    <TableCell>
                      <WebhookCallStatus call={call} />
                    </TableCell>
                    <TableCell>
                      <button className="text-link">View details</button>
                    </TableCell>
                  </RouteLink>
                );
              })}
          </TableBody>
        </Table>
        {!loading && pages.length > 1 && this.renderPaginator(page, pages)}
      </React.Fragment>
    );
  }

  renderPaginator(page, pages) {
    return (
      <div className="webhook-calls__paginator">
        {page > 0 && (
          <a
            href=""
            className="webhook-calls__paginator-item"
            onClick={(event) => {
              event.preventDefault();
              this.setState((s) => ({ page: s.page - 1 }));
            }}>
            «
          </a>
        )}

        {pages.map((cur) => (
          <a
            key={cur}
            href=""
            className={`webhook-calls__paginator-item${page === cur ? ' x--active' : ''}`}
            onClick={(event) => {
              event.preventDefault();
              this.setState({ page: cur });
            }}>
            {cur + 1}
          </a>
        ))}

        {page < pages.length - 1 && (
          <a
            href=""
            className="webhook-calls__paginator-item"
            onClick={(event) => {
              event.preventDefault();
              this.setState((s) => ({ page: s.page + 1 }));
            }}>
            »
          </a>
        )}
      </div>
    );
  }
}
