Meteor.loginAndMultiply = function(service, options, callback){
  // keep the old data around so that we can log back in as the owner
  // after we merge the accounts...
  Session.setAuth({
    "__rkstar:acounts-multiply__userId": Meteor.userId(),
    "__rkstar:acounts-multiply__loginToken": Accounts._storedLoginToken()
  })
  Meteor[`loginWith${service}`](options, callback)
}

// login hook will work with either redirect or popup style auth
Accounts.onLogin(()=>{
  let owner = {
    userId: Session.get('__rkstar:acounts-multiply__userId'),
    loginToken: Session.get('__rkstar:acounts-multiply__loginToken')
  }
  // make sure we don't fall into an infinite login loop
  if( Meteor.userId() === owner.userId ){
    return
  }

  Meteor.call('accounts/multiply/login', owner, (err, result)=>{
    if( !err ){
      Meteor.loginWithToken(owner.loginToken, (err)=>{
        if( !err && result.success && result.cleanup ){
          Meteor.call('accounts/multiply/cleanup', result.merged)
        }
      })
    }
  })
})

// simple capitalize method to get proper function names later for logging in
let capitalizeServiceName = function(string){
  let caps = string.charAt(0).toUpperCase() + string.slice(1)
  // we need a special case for LinkedIn... others?
  switch( caps ){
    case 'Linkedin':
      caps = 'LinkedIn'
      break

    default:
      caps = caps
      break
  }

  return caps
},
  createSignInMethod = function(name){
    let service = capitalizeServiceName(name)
    Meteor[`signInWith${service}`] = function(options, callback){
      Meteor.loginAndMultiply(service, options, callback)
    }
  }

Meteor.startup(()=>{
  // map all the available oauth packages and create "signInWith" methods
  if( Accounts && Accounts.oauth ){
    Accounts.oauth.serviceNames().map((name)=>{
      createSignInMethod(name)
    })
  }
})