# accounts-multply
----

This package allows you to support having multiple OAuth accounts from a single service under one user account in your Meteor application.
With the ability to have multiple accounts from a single service, you can now build a Meteor app that can manage teams of social media accounts
and connect infinite services and accounts to those services.

A bonus is you can allow login from **any** of the connected accounts and they will all authenticate to the same Meteor user account.

## Installation
`meteor add rkstar:accounts-multiply`

## Usage
This package was built to be a drop-in replacement for [mikael:accounts-merge](https://github.com/lirbank/meteor-accounts-merge).
The [mikael:accounts-merge](https://github.com/lirbank/meteor-accounts-merge) package is great and serves most use cases very well,
so this one was modeled after it.

To use accounts-multiply, simply use `Meteor.signInWithTwitter()` instead of `Meteor.loginWithTwitter()`.
Unlike [mikael:accounts-merge](https://github.com/lirbank/meteor-accounts-merge), there is no callback option for `signInWithTwitter()`.
Instead, there is a server hook exposed that allows you to run arbitrary code after an account has been merged.

#### client
```javascript
Meteor.signInWithTwitter()
Meteor.signInWithFacebook()
Meteor.signInWithGoogle()
... etc
```

#### server
By default, all multiplied/merged accounts are left in the `Meteor.users` collection.  If they are of no use to you, they can be automatically cleaned up by using the `cleanup` option:
```javascript
AccountsMultiply.cleanup = true
```

In order to run code after an account has been multiplied/merged you can add to the `onMultiply` routines:
```javascript
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
Thanks to [mikael:accounts-merge](https://github.com/lirbank/meteor-accounts-merge) for a fantastic template for merging OAuth accounts.