const axios = require('axios')
axios.defaults.baseURL = "https://pierluigi-collina.firebaseio.com";

var ApiHelper = (function(){
  var self = {};

  self.isUserRegistered = function(user_id){
    console.log('rankings/' + user_id + '.json');
    return axios.get('rankings/' + user_id + '.json')
      .then(function(response) {
        console.log(response.data);
        return response.data !== null;
      })
    .catch(function(error) {
      console.log("An error occured while checking if a user was registered.");
      console.log(error);
      return false;
    });
  };

  self.register = function(user_id, username) {
    console.log("APIHELPER - register");
    return axios.get('rankings.json')
      .then((response) => {
        // Determine last ranking
        var users = response.data;
        var maxRank = 0;
        for (var user in users) {
          if (users.hasOwnProperty(user)) {
            if (maxRank < users[user].rank) {
              maxRank = users[user].rank;
            }
          }
        }
        var lastRanking = maxRank + 1;
        console.log("Last ranking is :" + lastRanking);

        // Inset new user at the end of the rankings
        console.log('rankings/' + user_id + '.json');

        return axios.put('rankings/' + user_id + '.json',
            {
              username: username,
              rank: lastRanking
            })
        .then(function (response) {
          console.log(response.data);
        })
        .catch(function (error) {
          console.log("An error occured while registering a new user");
          console.log(error);
        });
      })
    .catch(function(error) {
      console.log("An error occured while getting the list of users to determine max rank");
      console.log(error);
    });
  }

  return self;
})();

module.exports = ApiHelper;
