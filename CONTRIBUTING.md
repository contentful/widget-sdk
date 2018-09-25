# Contributing to the User Interface

The user interface project is maintained by the frontend team but we welcome contributions from anyone.

Here are the guidelines we'd like you to follow:

- [Issue reporting](#issue)
- [Request a feature](#feature)
- [Version switcher](#switcher)
- [Submission guidelines](#guidelines)
- [More information](#info)

## <a name="issue"></a> Issue reporting
If you find a bug, you can help us by creating an issue under the "Bugs pool" in Target Process and assigning it to "Frontend". Please check for duplicates first though.

Better still, submit a pull request with a fix.

## <a name="feature"></a> Request a feature
If you have a small improvement suggestion, add it to the "Features Pool" in Target Process and talk to PM. Talk to PM for larger features.

## <a name="switcher"></a> Version switcher
You can run the code for a specific commit in the user interface by navigating to `https://app.quirely.com?ui_version={commithash}` in your browser.

## <a name="guidelines"></a> Code submission guidelines
- Make your changes in a new git branch based off `master` or one of the release branches. We generally use the prefixes `fix`,`feature`, `refactor` or `release` for our branches.
- More about our [git workflow](https://contentful.atlassian.net/wiki/display/ENG/Git+flow+and+release+flow+-+proposal) on the wiki.
- Please follow our [coding guidelines](https://contentful.atlassian.net/wiki/display/ENG/Frontend+JS+Coding+Style+Guideline)
- Include relevant test cases
- Use the GitHub label `Please review` when your code is ready for review
- You can assign the PR to a specific individual, multiple individuals or leave it unassigned for anyone to pick up

For an in-depth reference of the submission process see the [submission
guide](./docs/guides/code-submission.md) and [code review guide](./docs/guides/code-review.md)

## <a name="info"></a> More information
- See the [frontend space](https://contentful.atlassian.net/wiki/display/ENG/Frontend) on the wiki
- Ping the `#dev-frontend` channel on Slack
