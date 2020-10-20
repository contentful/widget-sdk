/* eslint "rulesdir/restrict-inline-styles": "warn" */
import React from 'react';
import PropTypes from 'prop-types';
import { range } from 'lodash';
import {
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@contentful/forma-36-react-components';
import StateLink from 'app/common/StateLink';
import { WebhookCallStatus } from './WebhookCallStatus';
import { getWebhookRepo } from './services/WebhookRepoInstance';
import { SpaceEnvContext } from 'core/services/SpaceEnvContext/SpaceEnvContext';

const PER_PAGE = 30;

export class WebhookActivityLog extends React.Component {
  static propTypes = {
    webhookId: PropTypes.string,
    registerLogRefreshAction: PropTypes.func.isRequired,
  };

  static contextType = SpaceEnvContext;

  constructor(props) {
    super(props);
    this.state = { page: 0, loading: false, calls: [] };
  }

  componentDidMount() {
    const { currentSpaceId: spaceId, currentSpace: space } = this.context;
    this.fetch({ spaceId, space });
    this.props.registerLogRefreshAction(this.fetch.bind(this));
  }

  fetch({ spaceId, space }) {
    const { webhookId } = this.props;
    const webhookRepo = getWebhookRepo({ spaceId, space });

    if (typeof webhookId !== 'string' || this.state.loading) {
      return Promise.resolve();
    }

    this.setState({ loading: true });

    return new Promise((resolve) => {
      webhookRepo.logs.getCalls(webhookId).then(
        (calls) => this.setState({ page: 0, loading: false, calls }, () => resolve()),
        () => this.setState({ page: 0, loading: false, calls: [] }, () => resolve())
      );
    });
  }

  render() {
    const { page, loading, calls } = this.state;

    const pageCalls = calls.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
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
                <TableCell colSpan="3">Loading logs…</TableCell>
              </TableRow>
            )}
            {!loading && pageCalls.length < 1 && (
              <TableRow>
                <TableCell colSpan="3">No webhook calls yet!</TableCell>
              </TableRow>
            )}
            {!loading &&
              pageCalls.length > 0 &&
              pageCalls.map((call) => {
                return (
                  <StateLink
                    path="^.detail.call"
                    params={{
                      callId: call.sys.id,
                    }}
                    key={call.sys.id}>
                    {({ onClick }) => (
                      <TableRow style={{ cursor: 'pointer' }} onClick={onClick}>
                        <TableCell>{call.requestAt}</TableCell>
                        <TableCell>
                          <WebhookCallStatus call={call} />
                        </TableCell>
                        <TableCell>
                          <button className="text-link">View details</button>
                        </TableCell>
                      </TableRow>
                    )}
                  </StateLink>
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
