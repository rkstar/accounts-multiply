// here we need to override the default behaviour of the accounts
// package in order to abide by the rules we're using to allow us
// to use multiple accounts from the same service
Accounts.updateOrCreateUserFromExternalService = function(serviceName, serviceData, options){
  options = _.clone(options || {})

  if (serviceName === "password" || serviceName === "resume")
    throw new Error(
      "Can't use updateOrCreateUserFromExternalService with internal service "
      + serviceName);
  if (!_.has(serviceData, 'id'))
    throw new Error(
      "Service data for service " + serviceName + " must include id");

  // search for the serviceData.id in an array of services with the serviceName
  let query = {"$or": [{}, {}]}
  query.$or[0][`services.${serviceName}.id`] = serviceData.id
  query.$or[1][`services.${serviceName}`] = {$elemMatch: {id: serviceData.id}}
  let user = this.users.findOne(query)
  if( user ){
    pinEncryptedFieldsToUser(serviceData, user._id);

    // make sure that our data for this service is an array in the user object...
    // this will allow us to integrate the accounts-multiply package with existing
    // systems without having to do a mass migration to array-based services
    if( !_.isArray(user.services[serviceName]) ){
      let setAttrs = {}
      setAttrs[`services.${serviceName}`] = [user.services[serviceName]]
      this.users.update({_id: user._id}, {$set: setAttrs})
    }

    // We *don't* process options (eg, profile) for update, but we do replace
    // the serviceData (eg, so that we keep an unexpired access token and
    // don't cache old email addresses in serviceData.email).
    // XXX provide an onUpdateUser hook which would let apps update
    //     the profile too
    let setAttrs = {}
    _.each(serviceData, (value, key)=>{
      setAttrs[`services.${serviceName}.$.${key}`] = value
    })

    let query = {_id: user._id}
    query[`services.${serviceName}.id`] = serviceData.id
    this.users.update(query, {$set: setAttrs})

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

///
/// OAuth Encryption Support
///

let OAuthEncryption =
  Package["oauth-encryption"] &&
  Package["oauth-encryption"].OAuthEncryption

function usingOAuthEncryption() {
  return OAuthEncryption && OAuthEncryption.keyIsLoaded()
}

// OAuth service data is temporarily stored in the pending credentials
// collection during the oauth authentication process.  Sensitive data
// such as access tokens are encrypted without the user id because
// we don't know the user id yet.  We re-encrypt these fields with the
// user id included when storing the service data permanently in
// the users collection.
//
function pinEncryptedFieldsToUser(serviceData, userId){
  _.each(_.keys(serviceData), function(key){
    var value = serviceData[key]
    if (OAuthEncryption && OAuthEncryption.isSealed(value))
      value = OAuthEncryption.seal(OAuthEncryption.open(value), userId)
    serviceData[key] = value
  })
}