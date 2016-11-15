const axios = require('axios')

axios.defaults.baseURL = "https://pierluigi-collina.firebaseio.com";

var ApiHelper = (function() {
  var self = {};

  self.isUserRegistered = function(user_id){
    return axios.get('rankings/' + user_id + '.json')
      .then(function(response) {
        return response.data !== null;
      })
    .catch(function(error) {
      console.log("An error occured while checking if a user was registered.");
      console.log(error);
      return false;
    });
  };

  self.register = function(user_id, username) {
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

        // Inset new user at the end of the rankings
        return axios.put('rankings/' + user_id + '.json',
            {
              username: username,
              rank: lastRanking
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
