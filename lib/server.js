AccountsMultiply = {
  cleanup: false,
  onMultiplyRoutines: [],
  onMultiply(fn, priority=false){
    if( _.isFunction(fn) ){
      if( priority ){
        AccountsMultiply.onMultiplyRoutines.unshift(fn)
      } else {
        AccountsMultiply.onMultiplyRoutines.push(fn)
      }
    }
  }
}

Meteor.methods({
  'accounts/multiply/login': function(opts){
    check(opts, Object)

    _.defaults(opts, {
      userId: null,
      loginToken: null,
      cleanup: AccountsMultiply.cleanup
      // this is the default behavior for mikael:accounts-merge
      // by NOT cleaning up the merged account, this package can be
      // used as a drop-in replacement for that one.
    })

    // ...taken from mikael:accounts-merge THANK YOU!
    //
    // This method (mergeAccounts) is sometimes called an extra time (twice) if
    // the losing user is deleted from the DB using the AccountsMerge.onMerge
    // hook. The hook is executed before the loosing user has been logged
    // out and thus this.userId is null the second time this method is called.
    if( !this.userId ){
      throw new Meteor.Error(404, 'No login data.')
    }

    if( !opts.userId ){
      throw new Meteor.Error(500, 'No user account to merge into.')
    }

    if( this.userId === opts.userId ){
      throw new Meteor.Error(500, 'Cannot multiply duplicate account data.')
    }

    // okay! we're ready to merge and multiply...
    let owner = Meteor.users.findOne({_id: opts.userId}),
      merging = Meteor.users.findOne({_id: this.userId})
    // sanity
    if( !owner || !merging ){
      throw new Meteor.Error(500, 'One of both of the user accounts are missing and presumed dead.')
    }

    // look for login services from the merging account and add them
    // to the owner account
    Accounts.oauth.serviceNames().map((name)=>{
      if( !merging.services[name] ){
        return
      }

      console.log('multiplying', name)
      console.log(merging.services[name])

      let serviceData = _.isArray(merging.services[name])
        ? _.clone(merging.services[name].shift())
        : _.clone(merging.services[name]),
        query = {_id: owner._id},
        setAttrs = {}


      if( serviceData ){
        // unset the service data in the merging account
        let setAttrs = {}
        setAttrs[`services.${name}`] = ""
        Meteor.users.update({_id: merging._id}, {$unset: setAttrs})
      }

      // see if the owner account already has this service...
      if( owner.services ){
        let accountsArray = (!owner.services[name]) ? []
          : _.isArray(owner.services[name])
            ? owner.services[name]
            : [owner.services[name]]
        accountsArray.map((account)=>{
          if( account.id === serviceData.id ){
            // here to have to modify our update query to
            // include a match clause for the service data
            // we're updating
            query["$elemMatch"] = {}
            query["$elemMatch"][`services.${name}.id`] = serviceData
          }
        })

        // if the service already exists, we have to set attributes
        // for each key in the serviceData because we want to update/modify
        // what is there and not obliterate it
        if( owner.services[name] ){
          _.each(serviceData, (value, key)=>{
            setAttrs[`services.${name}.$.${key}`] = value
          })
        } else {
          setAttrs[`services.${name}`] = [serviceData]
        }
      } else {
        setAttrs[`services.${name}`] = [serviceData]
      }

      Meteor.users.update(query, {$set: setAttrs})
    })

    // run my onMultiply functions
    AccountsMultiply.onMultiplyRoutines.map((fn)=>{
      fn(owner, merging)
    })

    // send the opts back to the client so that they
    // can decide whether or not to clean up the offending account
    return _.extend(opts, {
      success: true,
      merged: {userId: merging._id}
    })
  },

  'accounts/multiply/cleanup': function(opts){
    check(opts, Object)

    if( !this.userId ){
      throw new Meteor.Error(404, 'Not logged in.')
    }
    if( !opts.userId ){
      throw new Meteor.Error(500, 'No userId to dispose of.')
    }
    if( this.userId === opts.userId ){
      throw new Meteor.Error(500, 'Cannot dispose of the currently logged in user.')
    }

    // we're passed all of the checks... execute with extreme prejudice.
    Meteor.users.remove({_id: opts.userId})
    return true
  }
})