
var players = {};
//var game_config = require("../public/game_config.json");
var games = {};

var sockets = function(socket, io) {
  // sockets(socket);
  console.log('a user connected\n');
  // create a new player and add it to our players object
  players[socket.id] = {
    x: 800 / 2,
    y: 600 - 64,
    playerId: socket.id,
    isHost: false,
  };

  if(Object.keys(players).length === 1) {
    players[socket.id].isHost = true;
    //scores.host = socket.id;
  }

  // createGame event received from frontend.
  socket.on('createGame', function() {
      // randomly generated gameId - to do a socket.join to that room and leave the lobby.
      var gameId = (Math.random()+1).toString(36).slice(2, 18);
      // join client to newly generated game
      socket.join(gameId);
      // update player roomId to gameId
      players[socket.id].roomId = gameId;
      // drop player from lobby
      socket.leave('lobby');
      // bring in the sockets file for phaser socket stuff.
      // add game to games object
      games[gameId] = {
        players: {}
      };
      // add player to the players list/object contained in the games object
      games[gameId].players[socket.id] = {
        player: players[socket.id]
      };
      console.log("Current Players object contents:");
      console.log(players);
      console.log("contents of player object who created game:");
      console.log(players[socket.id]);
      // emit a 'gameCreated' event to connected frontend clients in order to display the game lobby to all connected users
      io.to('lobby').emit('gameCreated', {
        gameId: gameId
      });
      // emit a 'thisGameCreated' event to the frontend that created the game so they can be added to that game instances' player list.
      io.in(gameId).emit('thisGameCreated', {
        player: players[socket.id],
        gameId: gameId
      });
    });

    // joinGame event received from frontend.  'data' variable will contain the gameId, which is stored as a data attribute in the link used to join the active game session.
    socket.on('joinGame', function(data) {
      // join client to existing game session - room name is the gameId value, pulled from the data attribute in the link used to join the game.
      socket.join(data.gameId);
      // set the roomId key:value pair of the player object to the gameId value for later socket use/reference.
      players[socket.id].roomId = data.gameId;
      // drop player from lobby
      socket.leave('lobby');
      // bring in the separate sockets file for phaser socket stuff
      require('./routes/sockets')(socket, io);
      // emit 'gameJoined' event to frontend clients still in the lobby.
      io.to('lobby').emit('gameJoined');
      // emit 'currentGameJoin' event to other players in an existing game session so they can add that player to their game instances' list of connected players on the client.
      io.in(data.gameId).emit('currentGameJoin', {
        player: players[socket.id],
        gameId: gameId
      });
    });

  // send the players object to the new player
  io.in(players[socket.id].roomId).emit('currentPlayers', players);
  // send the current scores
  io.in(players[socket.id].roomId).emit('scoreUpdate');
  // update all other players of the new player
  io.to(players[socket.id].roomId).emit('newPlayer', players[socket.id]);

  socket.on('disconnect', function () {
    console.log('user disconnected\n');
    //If the disconnecting player was the host, find a new one
    if(players[socket.id].isHost ) {
      // remove this player from our players object
      delete players[socket.id];
      //Only chooses a new host if there's a connected player
      if(Object.keys(players).length > 0) {
        //Randomly choose a new host and change the isHost value to 'true'
        var playerKeys = Object.keys(players);
        var newHostIndex = Math.floor(Math.random() * playerKeys.length);
        players[playerKeys[newHostIndex]].isHost = true;
        //scores.host = playerKeys[newHostIndex];
        //Emit the new host data to the remaining players
        io.to(players[socket.id].roomId).emit('scoreUpdate');
        io.to(players[socket.id].roomId).emit('hostAssigned', players[playerKeys[newHostIndex]]);
        console.log("\nNew Host is being Selected\n");
      }
    }
    else {
      // remove this player from our players object
      delete players[socket.id];
    }
    if(Object.keys(players).length <= 0) {
      enemyStates = {};
    }
    // emit a message to all players to remove this player
    io.emit('disconnect', socket.id);
  });

  // when a player moves, update the player data
  socket.on('playerMovement', function (movementData) {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    // emit a message to all players about the player that moved
    io.to(players[socket.id].roomId).emit('playerMoved', players[socket.id]);
  });

  //When a player fires, emit the fire location to the other players
  socket.on('playerFire', function(data) {
    io.to(players[socket.id].roomId).emit('playerFired', data)
  });

  //When an enemy fires, emit the fire location to the other players
  socket.on('enemyShoot', function(data) {
    io.to(players[socket.id].roomId).emit('enemyFired', data)
  });

  //When a player hits an enemy, emit this to the other players
  socket.on('enemyHit', function(data){
    //console.log(data);
    //delete enemyStates[data.enemyId];
    io.to(players[socket.id].roomId).emit('hitEnemy', data);
  });

  //When the client loads the required fonts, send the client the required score data
  socket.on('fontsLoaded', function() {
    io.to(`${socket.id}`).emit('scoreUpdate');
  });

  socket.on('enemyState', function(enemyData) {
    //enemyStates[enemyData.id] = enemyData;
    io.to(players[socket.id].roomId).emit('updateEnemyState', enemyData);
  });

  socket.on('changeGameManager', function(data) {
    console.log("Sending GameManager");
    io.to(players[socket.id].roomId).emit('updateGameManager', data);
  })
  }

module.exports = sockets;