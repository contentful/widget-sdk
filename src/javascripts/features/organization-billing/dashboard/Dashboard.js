import React from 'react';
import PropTypes from 'prop-types';
import {
  Workbench,
  Heading,
  Card,
  Subheading,
  Paragraph,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
  TextLink,
} from '@contentful/forma-36-react-components';
import { NavigationIcon, Grid, GridItem } from '@contentful/forma-36-react-components/dist/alpha';
import moment from 'moment';

import DocumentTitle from 'components/shared/DocumentTitle';
import { getInvoice } from '../services/BillingDetailsService';
import { pieces } from 'utils/StringUtils';
import { toLocaleString } from 'utils/NumberUtils';

const downloadInvoice = async (organizationId, invoiceId) => {
  const invoiceData = await getInvoice(organizationId, invoiceId);

  const invoicePDF = new window.Blob([invoiceData], { type: 'application/pdf' });

  downloadBlob(invoicePDF, `invoice-${invoiceId}.pdf`);
};

function downloadBlob(blob, filename) {
  // https://blog.logrocket.com/programmatic-file-downloads-in-the-browser-9a5186298d5c/
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = filename || 'download';

  // Without the setTimeout, the URL is revoked before the browser can download it
  const clickHandler = () => {
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.removeEventListener('click', clickHandler);
    });
  };

  a.addEventListener('click', clickHandler, false);
  a.click();
}

export function Dashboard({
  loading,
  organizationId,
  orgIsEnterprise,
  billingDetails,
  paymentDetails,
  invoices = [],
}) {
  return (
    <>
      <DocumentTitle title="Billing" />
      <Workbench>
        <Workbench.Header title="Billing" icon={<NavigationIcon icon="Billing" size="large" />} />
        <Workbench.Content>
          <Grid columns={2} rows={1}>
            {!orgIsEnterprise && (
              <GridItem>
                <Card>
                  <Heading>Billing details</Heading>
                  <Grid columns={2} rows={1}>
                    <GridItem>
                      <Subheading>Credit card</Subheading>
                      <Paragraph>
                        {!loading && (
                          <>
                            {pieces(paymentDetails.number, 4).join(' ')}
                            <br />
                            {moment().month(paymentDetails.expirationDate.month).format('MMM')}
                            {paymentDetails.expirationDate.year}
                          </>
                        )}
                      </Paragraph>
                    </GridItem>
                    <GridItem>
                      <Subheading>Billing address</Subheading>
                      <Paragraph>
                        {!loading && <BillingDetails billingDetails={billingDetails} />}
                      </Paragraph>
                    </GridItem>
                  </Grid>
                </Card>
              </GridItem>
            )}
            <GridItem>
              <Card>
                <Heading>Invoices</Heading>
                <Table>
                  <TableHead>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell></TableCell>
                  </TableHead>
                  <TableBody>
                    {!loading &&
                      invoices.map((invoice) => (
                        <TableRow key={invoice.sys.id}>
                          <TableCell>
                            {moment(invoice.sys.invoiceDate, 'YYYY-MM-DD').format('MMM DD, YYYY')}
                          </TableCell>
                          <TableCell>${toLocaleString(invoice.amount)}</TableCell>
                          <TableCell>
                            <TextLink
                              onClick={() => downloadInvoice(organizationId, invoice.sys.id)}>
                              Download
                            </TextLink>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </Card>
            </GridItem>
          </Grid>
        </Workbench.Content>
      </Workbench>
    </>
  );
}

Dashboard.propTypes = {
  loading: PropTypes.bool.isRequired,
  organizationId: PropTypes.string.isRequired,
  billingDetails: PropTypes.object,
  paymentDetails: PropTypes.object,
  invoices: PropTypes.array,
  orgIsEnterprise: PropTypes.bool,
};

function BillingDetails({ billingDetails }) {
  return (
    <>
      {billingDetails.first_name} {billingDetails.last_name}
      <br />
      {billingDetails.address.work_email}
      <br />
      {billingDetails.address.address1}
      <br />
      {billingDetails.address.address2 && (
        <>
          {billingDetails.address.address2}
          <br />
        </>
      )}
      {billingDetails.address.zip_code} {billingDetails.address.city}
      {billingDetails.vat && (
        <>
          <br />
          {billingDetails.vat}
        </>
      )}
    </>
  );
}

BillingDetails.propTypes = {
  billingDetails: PropTypes.object.isRequired,
};
