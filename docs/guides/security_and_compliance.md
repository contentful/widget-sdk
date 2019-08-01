Security and Compliance
-----------------------
Every push to the repository will trigger a CI run, this includes Karma and Jest tests, a lint step and for compliance reasons with [Contentfuls Secure Software Development Policy](https://contentful.atlassian.net/wiki/spaces/SRT/pages/1305051346/Secure+Software+Development+Policy) a check of all packages which this repository depends on regarding licenses of those.

The aforementioned policy describes which licenses are allowed to use at Contentful and therefore a merge won't be approved if non-compliant licenses are detected.

In this case you would need to search for a different package or get in touch with your Team Lead and/or Team Security to resolve this. Please do not edit this test just so your build passes.