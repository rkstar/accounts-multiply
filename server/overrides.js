import {Meteor} from 'meteor/meteor'
import {Accounts} from 'meteor/accounts-base'
import _ from 'underscore'

import './methods'

///
/// OAuth Encryption Support
///
var OAuthEncryption =
  Package["oauth-encryption"] &&
  Package["oauth-encryption"].OAuthEncryption


const __updateOrCreateUserFromExternalService = Accounts.updateOrCreateUserFromExternalService,
  createServiceQuery = (serviceName, serviceData)=>{
    // search for the serviceData.id in an array of services with the serviceName
    const query = {$or: [{}, {}]}
    query.$or[0][`services.${serviceName}.id`] = serviceData.id
    query.$or[1][`services.${serviceName}`] = {$elemMatch: {id: serviceData.id}}
    return query
  },
  userHasService = (loggedIn, serviceName)=>{
    return loggedIn.services && loggedIn.services[serviceName]
  }
  userHasServiceAccount = (loggedIn, serviceName, serviceData)=>{
    const {services} = loggedIn,
      service = services[serviceName]
    if( !services || !service ){
      return false
    }
    const accountIds = _.isArray(service) ? service.map(account => account.id) : [service.id]
    return (accountIds.indexOf(serviceData.id) > -1)
  },
  serviceAccountBelongsToAnotherUser = (serviceName, serviceData)=>{
    const query = createServiceQuery(serviceName, serviceData),
      userCheck = Meteor.users.findOne(query)
    return userCheck
  },
  updateServiceAccountForUser = (user, serviceName, serviceData)=>{
    let query = {_id: user._id},
      setAttrs = {$set: {}}
    query[`services.${serviceName}.id`] = serviceData.id
    if( _.isArray(user.services[serviceName]) ){
      setAttrs.$set[`services.${serviceName}.$`] = serviceData
    } else {
      setAttrs.$set[`services.${serviceName}`] = [serviceData]
    }
    Meteor.users.update(query, setAttrs)
  },
  addServiceAccountToUser = (user, serviceName, serviceData)=>{
    const query = {_id: user._id}
    let setAttrs = {}
    if( !userHasService(user, serviceName) ){
      setAttrs = {$set: {}}
      setAttrs.$set[`services.${serviceName}`] = [serviceData]
    } else {
      setAttrs = {$push: {}}
      setAttrs.$push[`services.${serviceName}`] = serviceData
    }
    Meteor.users.update(query, setAttrs)
  },
  pinEncryptedFieldsToUser = (serviceData, userId)=>{
  // OAuth service data is temporarily stored in the pending credentials
  // collection during the oauth authentication process.  Sensitive data
  // such as access tokens are encrypted without the user id because
  // we don't know the user id yet.  We re-encrypt these fields with the
  // user id included when storing the service data permanently in
  // the users collection.
  //
    _.keys(serviceData).map((key)=>{
      let value = serviceData[key]
      if( OAuthEncryption && OAuthEncryption.isSealed(value) ){
        value = OAuthEncryption.seal(OAuthEncryption.open(value), userId)
      }
      serviceData[key] = value
    })
  }


// here we need to override the default behaviour of the accounts
// package in order to abide by the rules we're using to allow us
// to use multiple accounts from the same service
Accounts.updateOrCreateUserFromExternalService = function(serviceName, serviceData, options){
  const loggedIn = Meteor.user()
  let selector, setAttr, serviceIdKey, user

  if( loggedIn ){
    // this user is already logged in with another service, let's
    // see if this service is already enabled on their account
    if( !userHasServiceAccount(loggedIn, serviceName, serviceData) ){
      // check to see if someone else is already using it
      if( serviceAccountBelongsToAnotherUser(serviceName, serviceData) ){
        // oopsie!  we can't steal someone else's oauth creds... abort!
      } else {
        // we're good! add this service account
        addServiceAccountToUser(loggedIn, serviceName, serviceData)
      }
    } else {
      // this service account already belongs to the currently logged in user
      // let's update the data
      updateServiceAccountForUser(loggedIn, serviceName, serviceData)
    }
  } else {
    const serviceQuery = createServiceQuery(serviceName, serviceData)
    user = Meteor.users.findOne(serviceQuery)
    if( user ){
      pinEncryptedFieldsToUser(serviceData, user._id)

      // make sure that our data for this service is an array in the user object...
      // this will allow us to integrate the accounts-multiply package with existing
      // systems without having to do a mass migration to array-based services
      let setAttrs
      if( !_.isArray(user.services[serviceName]) ){
        setAttrs = {$set: {}}
        setAttrs.$set[`services.${serviceName}`] = [user.services[serviceName]]
        Meteor.users.update({_id: user._id}, setAttrs)
      }

      // We *don't* process options (eg, profile) for update, but we do replace
      // the serviceData (eg, so that we keep an unexpired access token and
      // don't cache old email addresses in serviceData.email).
      // XXX provide an onUpdateUser hook which would let apps update
      //     the profile too
      updateServiceAccountForUser(user, serviceName, serviceData)

      return {
        type: serviceName,
        userId: user._id
      }
    } else {
      // Create a new user with the service data. Pass other options through to
      // insertUserDoc.
      user = {services: {}}
      user.services[serviceName] = [serviceData]
      return {
        type: serviceName,
        userId: this.insertUserDoc(options, user)
      }
    }
  }
}