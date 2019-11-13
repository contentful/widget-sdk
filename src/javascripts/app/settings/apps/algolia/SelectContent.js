import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { RecordType } from './types';

import {
  Heading,
  Paragraph,
  Form,
  Select,
  Option,
  Icon,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Subheading,
  SectionHeading
} from '@contentful/forma-36-react-components';

export const SELECT_CONTENT_TYPE = '___select_content_type___';
export const MAX_RECORD_LIMIT = 3;

export default class SelectContent extends Component {
  static propTypes = {
    findContentTypeById: PropTypes.func.isRequired,
    editDraft: PropTypes.func.isRequired,
    editRecord: PropTypes.func.isRequired,
    onDraftContentTypeIdChange: PropTypes.func.isRequired,
    locales: PropTypes.arrayOf(PropTypes.object).isRequired,
    records: PropTypes.arrayOf(RecordType).isRequired,
    allContentTypes: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        sys: PropTypes.shape({
          id: PropTypes.string.isRequired
        }).isRequired
      })
    ).isRequired,
    draftRecord: RecordType
  };

  isEmpty() {
    return this.props.records.length === 0;
  }

  findRecordByContentTypeId(contentTypeId) {
    return this.props.records.find(ct => ct.contentTypeId === contentTypeId);
  }

  findLocaleNameByCode(localeCode) {
    return this.props.locales.find(l => l.code === localeCode).name;
  }

  canCreateRecords() {
    return (
      this.props.records.filter(e => e.created || e.publishWebhookId).length < MAX_RECORD_LIMIT
    );
  }

  render() {
    return (
      <Form className="algolia-app__config-section" spacing="condensed">
        <div>
          <Heading>Searchable content (max. {MAX_RECORD_LIMIT})</Heading>
          <Paragraph>Choose the content types that you{"'"}d like to enable for search.</Paragraph>
        </div>
        {this.renderContentTypeForm()}
        {this.renderSearchableContentTable()}
      </Form>
    );
  }

  renderContentTypeForm() {
    if (!this.canCreateRecords()) return null;

    return (
      <div className="algolia-app__config-content-type-form">
        <Select
          id="algolia-content-type"
          name="algolia-content-type"
          onChange={e => this.props.onDraftContentTypeIdChange(e.target.value)}
          value={
            this.props.draftRecord ? this.props.draftRecord.contentTypeId : SELECT_CONTENT_TYPE
          }>
          <Option key={SELECT_CONTENT_TYPE} value={SELECT_CONTENT_TYPE}>
            Select content type
          </Option>
          {this.props.allContentTypes.map(ct => (
            <Option key={ct.sys.id} value={ct.sys.id}>
              {ct.name}
            </Option>
          ))}
        </Select>
        <Button
          className="algolia-app__config-content-type-form-button"
          onClick={this.props.editDraft}>
          Add
        </Button>
      </div>
    );
  }

  renderNoSearchableContent() {
    return null;
  }

  renderSearchableContentTable() {
    if (this.isEmpty()) {
      return this.renderNoSearchableContent();
    }

    return (
      <Table className="algolia-app__config-searchable-content-table">
        <TableHead>
          <TableRow>
            <TableCell className="algolia-app__config-searchable-content-table-icon" />
            <TableCell className="algolia-app__config-searchable-content-table-heading">
              <SectionHeading>Content Type</SectionHeading>
            </TableCell>
            <TableCell className="algolia-app__config-searchable-content-table-heading">
              <SectionHeading>Algolia Index</SectionHeading>
            </TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {this.props.records.map((record, ind) => this.renderSearchableContentRow(record, ind))}
        </TableBody>
      </Table>
    );
  }

  renderSearchableContentRow(record, ind) {
    const contentType = this.props.findContentTypeById(record.contentTypeId);
    if (!contentType) {
      return;
    }

    return (
      <TableRow
        className={`algolia-app__config-searchable-content-table-row ${
          record.deleted ? 'deleted' : ''
        } `}
        onClick={() => this.props.editRecord(ind)}>
        <TableCell className="algolia-app__config-searchable-content-table-icon" align="center">
          <Icon color="muted" icon="Entry" />
        </TableCell>
        <TableCell>
          <Subheading>{contentType.name}</Subheading>
          {this.findLocaleNameByCode(record.localeCode)}
        </TableCell>
        <TableCell>
          <Subheading>{record.index}</Subheading>
          {record.fields.default ? 'Default Fields' : 'Custom Fields'}
        </TableCell>
        <TableCell>{this.renderRecordLabels(record)}</TableCell>
      </TableRow>
    );
  }

  renderRecordLabels(record) {
    if (record.deleted) {
      return <label className="algolia-app__config-tag negative">Deleted</label>;
    }

    if (record.created || record.updated) {
      return <Icon icon="Edit" color="secondary" />;
    }

    return <Icon icon="Edit" color="muted" />;
  }
}
