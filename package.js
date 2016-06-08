Package.describe({
  name: 'rkstar:accounts-multiply',
  version: '1.1.3',
  summary: 'Support merging multiple login services to a single account in a Meteor app.',
  git: 'https://github.com/rkstar/accounts-multiply.git',
  documentation: 'README.md'
});

Package.onUse(function (api){
  api.versionsFrom('1.3.2.4')
  api.use('accounts-base')
  api.use('accounts-password')
  api.use('accounts-oauth')
  api.use('underscore')
  api.use('ecmascript')
  api.use('check')

  api.export('AccountsMultiply')

  // these modules will import the rest of the modules we need
  // for our package to work properly
  api.mainModule('server/overrides.js', 'server')
  api.mainModule('accounts-multiply.js')
})
