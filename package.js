Package.describe({
  name: 'rkstar:accounts-multiply',
  version: '0.1.2',
  summary: 'Support merging multiple login services to a single account in a Meteor app.',
  git: 'https://github.com/rkstar/accounts-multiply.git',
  documentation: 'README.md'
});

Package.onUse(function (api){
  api.versionsFrom('1.2.0.2')
  api.use('accounts-base')
  api.use('accounts-oauth')
  api.use('underscore')
  api.use('ecmascript')
  api.use('check')
  api.use('u2622:persistent-session@0.4.4')

  api.addFiles('lib/external-service-override.js', 'server')
  api.addFiles('lib/server.js', 'server')
  api.addFiles('lib/client.js', 'client')
  api.export('AccountsMultiply')
})
