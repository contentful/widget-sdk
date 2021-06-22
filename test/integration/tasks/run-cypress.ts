import runScript from '../run-script'
import { printStepTitle } from '../utils'

export default async (role: string, initializeTestOnly: boolean = false) => {
  printStepTitle(`${role}: Runnings tests...`)
  const args = ['run', '--browser', 'chrome']
  if (initializeTestOnly) {
    args.push('--spec', 'test/cypress/integration/initialize.spec.ts')
  } else if (process.env.TEST) {
    args.push('--spec', process.env.TEST.split(/\s/).join(','))
  }
  await runScript('./node_modules/.bin/cypress', args)
}
