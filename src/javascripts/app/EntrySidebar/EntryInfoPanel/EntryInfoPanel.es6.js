import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import RelativeDateTime from 'components/shared/RelativeDateTime/index.es6';
import FetchAndFormatUserName from 'components/shared/UserNameFormatter/FetchAndFormatUserName.es6';

export default class EntryInfoPanel extends Component {
  static propTypes = {
    contentTypeName: PropTypes.string,
    contentTypeDescription: PropTypes.string,
    contentTypeId: PropTypes.string,
    sys: PropTypes.object,
    isVisible: PropTypes.bool.isRequired
  };

  static defaultProps = {
    isVisible: false
  };

  render() {
    const { sys, contentTypeName, contentTypeDescription, contentTypeId, isVisible } = this.props;
    return (
      <div
        className={classNames('entity-sidebar__info-panel entity-info-panel', {
          'x--show': isVisible
        })}>
        {sys && (
          <table>
            <tbody>
              {contentTypeName && (
                <tr>
                  <th>Content type</th>
                  <td>{contentTypeName}</td>
                </tr>
              )}
              {contentTypeDescription && (
                <tr>
                  <th>Description</th>
                  <td>{contentTypeDescription}</td>
                </tr>
              )}
              <tr>
                {contentTypeId && <th>Entry ID</th>}
                {!contentTypeId && <th>ID</th>}
                <td>{sys.id}</td>
              </tr>
              {contentTypeId && (
                <tr>
                  <th>Content type ID</th>
                  <td>{contentTypeId}</td>
                </tr>
              )}
              <tr>
                <th>Current version</th>
                <td>{sys.version}</td>
              </tr>
            </tbody>
            <tbody>
              <tr>
                <th>Created</th>
                <td>{sys.createdAt && <RelativeDateTime value={sys.createdAt} />}</td>
              </tr>
              <tr>
                <th>Created by</th>
                <td>
                  {sys.createdBy && (
                    <span>
                      <FetchAndFormatUserName userId={sys.createdBy.sys.id} />
                    </span>
                  )}
                </td>
              </tr>
            </tbody>
            {sys.updatedAt && (
              <tbody>
                <tr>
                  <th>Updated</th>
                  <td>{sys.updatedAt && <RelativeDateTime value={sys.updatedAt} />}</td>
                </tr>
                {sys.updatedBy && (
                  <tr>
                    <th>Updated by</th>
                    <td>
                      <span>
                        <FetchAndFormatUserName userId={sys.updatedBy.sys.id} />
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            )}
            {sys.archivedVersion && (
              <tbody>
                <tr>
                  <th>Archived</th>
                  <td>{sys.archivedAt && <RelativeDateTime value={sys.archivedAt} />}</td>
                </tr>
                <tr>
                  <th>Archived by</th>
                  <td>{sys.archivedBy.sys.id}</td>
                </tr>
                <tr>
                  <th>Archived version</th>
                  <td>{sys.archivedVersion}</td>
                </tr>
              </tbody>
            )}
            {sys.publishedVersion && (
              <tbody>
                <tr>
                  <th>Published</th>
                  <td>{sys.publishedAt && <RelativeDateTime value={sys.publishedAt} />}</td>
                </tr>
                <tr>
                  <th>Published by</th>
                  <td>
                    <span>
                      <FetchAndFormatUserName userId={sys.publishedBy.sys.id} />
                    </span>
                  </td>
                </tr>
                <tr>
                  <th>Published version</th>
                  <td>{sys.publishedVersion}</td>
                </tr>
              </tbody>
            )}
          </table>
        )}
      </div>
    );
  }
}
