'use strict';

const axios = require('axios');
const Promise = require('promise');

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
      return axios.put('rankings/' + playerId + '.json', {
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
    return axios.post('matchResults.json', {
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

  self.getRankings = function() {
    return axios.get('rankings.json?orderBy="rank"&startAt=1')
    .then((response) => {
      var users = response.data;
      var parsedUsers = [];

      for (var user in users) {
        if (users.hasOwnProperty(user)) {
          parsedUsers.push({playerId: user, rank:users[user].rank});
        }
      }

      return Promise.resolve(parsedUsers);
    })
    .catch((error) => {
      console.log('An error occured while getting the player ranks')
      console.log(error);
    });
  }

  self.getChallengers = function(playerId) {
    return self.getPlayerRank(playerId).then((playerRank) => {
      var startAt = (playerRank-1 <= 0) ? 1 : playerRank-1;
      var endAt = playerRank + 1;

      return axios.get('rankings.json?orderBy="rank"&startAt='+startAt+'&endAt='+endAt)
      .then((response) => {
        var players = response.data;
        var parsedPlayers = {};

        for (var player in players) {
          if (players.hasOwnProperty(player)) {
            var playerToParse = {playerId: player, rank:players[player].rank};
            if (player === playerId) {
              parsedPlayers.currentPlayer = playerToParse;
            } else if (players[player].rank < playerRank) {
              parsedPlayers.toBeat = playerToParse;
            } else if (players[player].rank > playerRank) {
              parsedPlayers.notToLose = playerToParse;
            }
          }
        }

        return Promise.resolve(parsedPlayers);
      })
      .catch((error) => {
        console.log('An error occured while retrieving the player challengers');
        console.log(error);
      });
    })
  }

  self.getPlayerGames = function(playerId) {
    return axios.get('matchResults.json?orderBy="winnerId"&startAt="'+playerId+'"&endAt="'+playerId+'"')
    .then((response) => {
      var wonGames = response.data;

      return axios.get('matchResults.json?orderBy="loserId"&startAt="'+playerId+'"&endAt="'+playerId+'"')
      .then((response) => {
        var lostGames = response.data;
        var games = [];

        games.push(wonGames);
        games.push(lostGames);

        var realGames = [];
        for (var game in games) {
          if (games.hasOwnProperty(game)) {
            realGames.push(games[game]);
          }
        }

        realGames = realGames.sort((game1, game2) => {
          return game1.date - game2.date;
        });

        return Promise.resolve(realGames)
      })
    })
  }

  return self;
})();

module.exports = ApiHelper;
