#!/bin/bash -xe

# olp-sdk-authentication publish test dry-run
# cd @here/olp-sdk-authentication && npm install && npm publish --dry-run && cd -

# olp-sdk-dataservice-read publish test dry-run
# cd @here/olp-sdk-dataservice-read && npm install && npm publish --dry-run && cd -

# olp-sdk-dataservice-api publish test dry-run
# cd @here/olp-sdk-dataservice-api && npm install && npm publish --dry-run && cd -

# olp-sdk-fetch publish test dry-run
# cd @here/olp-sdk-fetch && npm install && npm publish --dry-run && cd -

# clean after publish tests
# rm -rf @here/*/node_modules
# rm -rf @here/*/package-lock.json
# rm -rf @here/*/dist


# tesing SDK building

# install main dependencies
yarn

# initialize lerna monorepo with yarn workspaces
yarn bootstrap

# build the project
npm run build

# generate bundles and typedocs
npm run bundle
npm run typedoc

# check the lints
npm run lint

# run tests
npm run test

# generate test coverage
npm run coverage

# Integration tests
npm run integration-test

# Test the generated bundles
npm run test-generated-bundles


