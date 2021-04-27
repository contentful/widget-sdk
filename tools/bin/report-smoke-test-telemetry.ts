import * as path from 'path';
import * as fs from 'fs';
import * as cheerio from 'cheerio';
import * as telemetry from '../../test/smoke/telemetry';

const rootDir = path.resolve(__dirname, '..', '..');
const reportsDir = path.join(rootDir, 'cypress/reports');

const libratoAuthToken = process.env.LIBRATO_AUTH_TOKEN;
const environment = process.env.SMOKE_TEST_ENVIRONMENT as telemetry.SmokeTestEnvironment;

async function generateMeasurements() {
  const caseNodes: CheerioElement[] = [];

  for await (const file of walk(reportsDir)) {
    const reportXMLString = fs.readFileSync(file).toString();

    // Get all <testcase ...> nodes, and transform the resulting Cheerio instance into
    // an array of nodes
    caseNodes.push(...cheerio.load(reportXMLString, { xmlMode: true })('testcase').toArray());
  }

  return caseNodes.map((caseNode) => {
    const children = caseNode.children;

    let value = 1;

    // If there is a `<failure ...>` child node, then this test case failed
    if (children.find((ele) => ele.tagName === 'failure')) {
      value = 0;
    }

    return {
      name: 'testcase-success',
      value,
      tags: {
        testName: caseNode.attribs.name,
      },
    };
  });
}

generateMeasurements()
  .then((measurements) => {
    return telemetry.measure(libratoAuthToken, environment, measurements);
  })
  .then(() => {
    console.log('Report measurements successfully sent to Librato');
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });

// https://gist.github.com/lovasoa/8691344
async function* walk(dir: string) {
  for await (const d of await fs.promises.opendir(dir)) {
    const entry = path.join(dir, d.name);

    if (d.isFile()) {
      yield entry;
    }
  }
}
