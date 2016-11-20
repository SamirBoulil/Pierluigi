const axios = require('axios')

axios.defaults.baseURL = "https://pierluigi-collina.firebaseio.com";

var ApiHelper = (function() {
  var self = {};

  self.isPlayerRegistered = function(playerId){
    return axios.get('rankings/' + playerId + '.json')
      .then(function(response) {
        return response.data !== null;
      })
      .catch(function(error) {
      console.log("An error occured while checking if a user id was registered.");
      console.log(error);
      return false;
    });
  };

  self.register = function(playerId) {
    return axios.get('rankings.json')
      .then((response) => {
        // Determine last ranking
        var users = response.data;

        // Lol simply count the number of users
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
        return axios.put('rankings/' + playerId + '.json',
            {
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
