# accounts-multiply
----

This package allows you to support having multiple OAuth accounts from a single service under one user account in your Meteor application.
With the ability to have multiple accounts from a single service, you can now build a Meteor app that can manage teams of social media accounts
and connect infinite services and accounts to those services.

A bonus is you can allow login from **any** of the connected accounts and they will all authenticate to the same Meteor user account.

## Installation
`meteor add rkstar:accounts-multiply`

## Usage
This package is based on work done in [splendid:accounts-meld](https://github.com/splendido/meteor-accounts-meld/) and has improved upon many
features of the previous version of this package.

To use accounts-multiply, simply install it from Atmosphere and continue to use `Meteor.loginWith<ExternalService>()`.
Unlike [mikael:accounts-merge](https://github.com/lirbank/meteor-accounts-merge), there is no callback option for the login functions.
Instead, there is a server hook exposed that allows you to run arbitrary code after an account has been merged.

#### client
```javascript
Meteor.loginWithTwitter()
Meteor.loginWithFacebook()
Meteor.loginWithGoogle()
...etc
```

#### server
In order to run code after an account has been multiplied/merged you can add to the `onMultiply` routines:
```javascript
import {AccountsMultiply} from 'meteor/rkstar:accounts-multiply'

AccountsMultiply.onMultiply((owner, merged)=>{
  // owner
  // -> the originally logged in Meteor.users account
  
  // merged
  // -> the account that was merged into the 'owner' account
})
```

You can also set `priority` on the `onMultiply` hooks.  If you set `priority=true` the hook will be placed at the front of the line when the hooks are run.
```javascript
AccountsMultiply.onMultiply((owner, merged)=>{
  // i want this one to run before my other hooks!
}, true)
```
NOTE: setting "priority" will make your function run first if there are multiple routines.
Multiple "priority" merge routines will be run **LIFO**


## Notes
Thanks to [splendido:accounts-meld](https://github.com/splendido/meteor-accounts-meld/) and [mikael:accounts-merge](https://github.com/lirbank/meteor-accounts-merge) for fantastic templates for merging OAuth accounts.