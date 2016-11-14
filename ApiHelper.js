const axios = require('axios')

var ApiHelper = (function(){
  var firebaseConfig = {
    apiKey: "AIzaSyAQ_aMFey6dHjc9F7e-ry4lUhxBwyFuHgI",
    authDomain: "pierluigi-collina.firebaseapp.com",
    databaseURL: "https://pierluigi-collina.firebaseio.com",
    storageBucket: "pierluigi-collina.appspot.com",
    messagingSenderId: "91946992555"
  };
  var self = {};
  var API_ENDPOINT = "https://pierluigi-collina.firebaseio.com/";

  self.isRegistered = function(user){
    return axios.get(API_ENDPOINT + 'rankings.json/' + user)
    .then(function(response) {
      console.log(response);
      return response.body.length === 0;
    })
    catch(function(error) {
      console.log(error);
      return false;
    });
  };

  self.register = function(user) {
    //return firebase.database().ref(rankings).push()
  }

  return self;
})();

module.exports = {ApiHelper: ApiHelper}


