import {Meteor} from 'meteor/meteor'
import {_} from 'meteor/underscore'

class AccountsMultiply {
  constructor(){}

  onMultiply(fn, priority=false){
    if( Meteor.isServer ){
      if( !_.isFunction(fn) ){
        return
      }

      priority
        ? this.routines.unshift(fn)
        : this.routines.push(fn)
    }
  }

  setDefaultServiceAccount(serviceName, serviceData){
    return new Promise((resolve, reject)=>{
      Meteor.call('rkstar:accounts-multiply/setDefaultServiceAccount', {serviceName, serviceData}, (err, response)=>{
        _.isNull(err) || _.isUndefined(err) ? resolve(response) : reject(err)
      })
    })
  }

  getDefaultServiceAccount(serviceName){
    const user = Meteor.user()
    if( !user || !user.services || !user.services[serviceName] ){
      return null
    }
    return _.filter(user.services[serviceName], account => account.__default)[0]
  }

  get routines(){
    return this._routines
  }
  set routines(value){
    this._routines = _.isArray(value) ? value : [value]
  }
}

exports.AccountsMultiply = new AccountsMultiply()