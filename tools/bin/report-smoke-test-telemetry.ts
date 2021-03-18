import * as path from 'path';
import * as fs from 'fs';
import * as cheerio from 'cheerio';
import * as telemetry from '../../test/smoke/telemetry';

const rootDir = path.resolve(__dirname, '..', '..');
const reportFile = path.join(rootDir, 'cypress/reports/smoke-test-results.xml');
const reportXMLString = fs.readFileSync(reportFile).toString();

const libratoAuthToken = process.env.LIBRATO_AUTH_TOKEN;

// Get all <testcase ...> nodes, and transform the resulting Cheerio instance into
// an array of nodes
const caseNodes = cheerio.load(reportXMLString, { xmlMode: true })('testcase').toArray();

const measurements = caseNodes.map((caseNode) => {
  const children = caseNode.children;

  const metricName = `testcase.${caseNode.attribs.name}.success`;

  // If there is a `<failure ...>` child node, then this test case failed
  if (children.find((ele) => ele.tagName === 'failure')) {
    return {
      name: metricName,
      value: 0,
    };
  }

  return {
    name: metricName,
    value: 1,
  };
});

telemetry
  .measure(libratoAuthToken, measurements)
  .then(() => {
    console.log('Report measurements successfully sent to Librato');
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
