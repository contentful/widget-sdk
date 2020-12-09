import React from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import {
  Workbench,
  Heading,
  Card,
  Typography,
  Paragraph,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
  TextLink,
  SkeletonContainer,
  SkeletonBodyText,
} from '@contentful/forma-36-react-components';
import {
  ProductIcon,
  Grid,
  GridItem,
  ModalLauncher,
} from '@contentful/forma-36-react-components/dist/alpha';
import * as tokens from '@contentful/forma-36-tokens';
import moment from 'moment';
import { times } from 'lodash';
import { BillingDetailsLoading } from '../components/BillingDetailsLoading';
import { CreditCardDetailsLoading } from '../components/CreditCardDetailsLoading';
import { BillingDetailsPropType } from '../propTypes';

import DocumentTitle from 'components/shared/DocumentTitle';
import { getInvoice } from '../services/BillingDetailsService';
import { pieces } from 'utils/StringUtils';
import { toLocaleString } from 'utils/NumberUtils';
import { go } from 'states/Navigator';

import { EditBillingDetailsModal } from '../components/EditBillingDetailsModal';
import { downloadBlob } from 'core/utils/downloadBlob';

const styles = {
  editLink: css({
    marginLeft: tokens.spacingM,
  }),
  billingDetailsHeading: css({
    marginBottom: tokens.spacingS,
  }),
  billingDetailsLoadingState: css({
    width: '200px',
  }),
  enterpriseOrgInvoiceCard: css({
    gridColumnStart: 1,
    gridColumnEnd: 3,
  }),
  noInvoices: css({
    columnSpan: 'all',
  }),
};

const downloadInvoice = async (organizationId, invoiceId) => {
  const invoiceData = await getInvoice(organizationId, invoiceId);
  const invoicePDF = new window.Blob([invoiceData], { type: 'application/pdf' });

  downloadBlob(invoicePDF, `invoice-${invoiceId}.pdf`);
};

async function openEditBillingDetailsModal(organizationId, billingDetails, onEditBillingDetails) {
  const result = await ModalLauncher.open(({ isShown, onClose }) => {
    return (
      <EditBillingDetailsModal
        organizationId={organizationId}
        billingDetails={billingDetails}
        onConfirm={onClose}
        onCancel={() => onClose(false)}
        isShown={isShown}
      />
    );
  });

  if (!result) {
    return;
  }

  return onEditBillingDetails(result);
}

export function Dashboard({
  loading,
  organizationId,
  orgIsEnterprise,
  orgIsSelfService,
  billingDetails,
  paymentDetails,
  onEditBillingDetails,
  invoices = [],
}) {
  const shouldShowBillingDetails = orgIsSelfService != null && orgIsSelfService;

  return (
    <>
      <DocumentTitle title="Billing" />
      <Workbench>
        <Workbench.Header title="Billing" icon={<ProductIcon icon="Billing" size="large" />} />
        <Workbench.Content>
          <Grid columns={2} rows={1}>
            {shouldShowBillingDetails && (
              <GridItem>
                <Card testId="billing-details-card">
                  <Typography>
                    <Heading>Billing details</Heading>
                    <Grid columns={2} rows={1}>
                      <GridItem>
                        <div className={styles.billingDetailsHeading}>
                          <strong>Credit card</strong>
                          <TextLink
                            testId="edit-payment-method-link"
                            onClick={() =>
                              go({
                                path: [
                                  'account',
                                  'organizations',
                                  'billing',
                                  'edit-payment-method',
                                ],
                              })
                            }
                            className={styles.editLink}
                            disabled={loading}>
                            Edit
                          </TextLink>
                        </div>
                        {loading && <CreditCardDetailsLoading />}
                        {!loading && (
                          <Paragraph testId="card-details">
                            {pieces(paymentDetails.number, 4).join(' ')} <br />
                            {moment()
                              .month(paymentDetails.expirationDate.month - 1)
                              .format('MM')}
                            /{paymentDetails.expirationDate.year}
                          </Paragraph>
                        )}
                      </GridItem>
                      <GridItem>
                        <div className={styles.billingDetailsHeading}>
                          <strong>Billing address</strong>
                          <TextLink
                            testId="edit-billing-details-link"
                            onClick={() =>
                              openEditBillingDetailsModal(
                                organizationId,
                                billingDetails,
                                onEditBillingDetails
                              )
                            }
                            className={styles.editLink}
                            disabled={loading}>
                            Edit
                          </TextLink>
                        </div>
                        {loading && <BillingDetailsLoading />}
                        {!loading && <BillingDetails billingDetails={billingDetails} />}
                      </GridItem>
                    </Grid>
                  </Typography>
                </Card>
              </GridItem>
            )}
            <div
              className={cx({
                [styles.enterpriseOrgInvoiceCard]: !shouldShowBillingDetails,
              })}>
              <Card>
                <Typography>
                  <Heading>Invoices</Heading>
                  {!loading && orgIsEnterprise && (
                    <Paragraph testId="enterprise-ae">
                      To update your billing details contact your account executive.
                    </Paragraph>
                  )}
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell width="37%">Date</TableCell>
                        <TableCell width="38%">Amount</TableCell>
                        <TableCell width="25%" />
                      </TableRow>
                    </TableHead>
                    {loading && <InvoicesTableLoading />}
                    {!loading && invoices.length === 0 && (
                      <TableBody testId="no-invoices">
                        <TableRow>
                          <TableCell colSpan="3">No invoices</TableCell>
                        </TableRow>
                      </TableBody>
                    )}
                    {!loading && invoices.length > 0 && (
                      <TableBody>
                        {invoices.map((invoice) => (
                          <TableRow key={invoice.sys.id} testId="invoice-row">
                            <TableCell testId="invoice-date">
                              {moment(invoice.sys.invoiceDate, 'YYYY-MM-DD').format('MMM DD, YYYY')}
                            </TableCell>
                            <TableCell testId="invoice-amount">
                              ${toLocaleString(invoice.amount)}
                            </TableCell>
                            <TableCell>
                              <TextLink
                                testId="invoice-download-link"
                                icon="Download"
                                onClick={() => downloadInvoice(organizationId, invoice.sys.id)}>
                                Download
                              </TextLink>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    )}
                  </Table>
                </Typography>
              </Card>
            </div>
          </Grid>
        </Workbench.Content>
      </Workbench>
    </>
  );
}

Dashboard.propTypes = {
  loading: PropTypes.bool.isRequired,
  organizationId: PropTypes.string.isRequired,
  billingDetails: BillingDetailsPropType,
  paymentDetails: PropTypes.object,
  invoices: PropTypes.array,
  orgIsSelfService: PropTypes.bool,
  orgIsEnterprise: PropTypes.bool,
  onEditBillingDetails: PropTypes.func.isRequired,
};

function BillingDetails({ billingDetails }) {
  return (
    <>
      {billingDetails.firstName} {billingDetails.lastName}
      <br />
      {billingDetails.workEmail}
      <br />
      {billingDetails.address1}
      <br />
      {billingDetails.address2 && (
        <>
          <span data-test-id="address2">{billingDetails.address2}</span>
          <br />
        </>
      )}
      {billingDetails.zipCode} {billingDetails.city}
      {billingDetails.state && (
        <>
          <br />
          <span data-test-id="state">{billingDetails.state}</span>
        </>
      )}
      <br />
      {billingDetails.country}
      {billingDetails.vat && (
        <>
          <br />
          <span data-test-id="vat">{billingDetails.vat}</span>
        </>
      )}
    </>
  );
}

BillingDetails.propTypes = {
  billingDetails: BillingDetailsPropType.isRequired,
};

function InvoicesTableLoading() {
  return (
    <TableBody testId="invoices-loading">
      {times(3).map((i) => (
        <TableRow key={i}>
          <TableCell>
            <SkeletonContainer svgHeight={20} ariaLabel="Loading invoices...">
              <SkeletonBodyText numberOfLines={1} />
            </SkeletonContainer>
          </TableCell>
          <TableCell>
            <SkeletonContainer svgHeight={20} ariaLabel="Loading invoices...">
              <SkeletonBodyText />
            </SkeletonContainer>
          </TableCell>
          <TableCell>
            <TextLink disabled icon="Download">
              Download
            </TextLink>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}
