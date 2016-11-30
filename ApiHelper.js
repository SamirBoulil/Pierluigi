'use strict';

const axios = require('axios');

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

  self.registerPlayer = function(playerId) {
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

  self.addMatchResult = function(winnerId, loserId, winnerScore, loserScore) {
    return axios.post('matchResults.json',
                      {
                        winnerId: winnerId,
                        loserId: loserId,
                        winnerScore: winnerScore,
                        loserScore: loserScore,
                        date: new Date()
                      })
                      .catch(function (error) {
                        console.log("An error occured while adding a match result");
                        console.log(error);
                      });
  }

  self.refreshRank = function(winnerId, loserId) {
    // Find the rank below and in front of the current winner
    // If won against better player, swap the ranks
    return self.getPlayerRank(winnerId).then((winnerRank) => {
      return self.getPlayerRank(loserId).then((loserRank) => {
        if (winnerRank-1 === loserRank) {
          console.log("swapping the ranks of users " + winnerId + " and " + loserId);
          // winner won against better player challenger.
          // swap ranks
          axios.patch('rankings/'+winnerId+'.json', {
            rank: loserRank
          });
          axios.patch('rankings/'+loserId+'.json', {
            rank: winnerRank
          });
        }
      });
    });
  }

  self.getPlayerRank = function(playerId) {
    return axios.get('rankings/'+ playerId + '/rank.json')
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.log("An error occured while getting the rank of the player");
      console.log(error);
    });
  }

  return self;
})();

module.exports = ApiHelper;
