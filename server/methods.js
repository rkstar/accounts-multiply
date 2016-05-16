import {Meteor} from 'meteor/meteor'

Meteor.methods({
  'rkstar:accounts-multiply/setDefaultServiceAccount': function(opts){
    check(opts, Object)
    
    const {serviceName, serviceData} = opts,
      user = Meteor.user()
    if( !user || !user.services && !user.services[serviceName] ){
      return null
    }

    let query = {_id: user._id}

    // we have to perform a loop here to make sure we get rid of any previous
    // default operations
    user.services[serviceName].map((account, idx)=>{
      if( account.hasOwnProperty('__default') ){
        let setAttrs = {$unset: {}}
        setAttrs.$unset[`services.${serviceName}.${idx}.__default`] = ""

        console.log('query:', query)
        console.log('setAttrs:', setAttrs)

        Meteor.users.update(query, setAttrs)
      }
    })

    // serviceData can be:
    // an object with an id,
    // an id string
    // an index number
    let setAttrs = {$set: {}}
    if( _.isNumber(serviceData) ){
      setAttrs.$set[`services.${serviceName}.${serviceData}.__default`] = true
    } else if( _.isString(serviceData) ){
      query[`services.${serviceName}.id`] = serviceData
      setAttrs.$set[`services.${serviceName}.$.__default`] = true
    } else if( _.isObject(serviceData) ){
      query[`services.${serviceName}.id`] = serviceData.id
      setAttrs.$set[`services.${serviceName}.$.__default`] = true
    } else {
      setAttrs.$set[`services.${serviceName}.0.__default`] = true
    }

    console.log('query:', query)
    console.log('setAttrs:', setAttrs)

    return Meteor.users.update(query, setAttrs)

  }
})