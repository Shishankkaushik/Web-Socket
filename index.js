// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server);

// app.use(express.static('public'));

// // In-memory store for players per room
// const roomPlayers = {}; // { roomName: [socket.id, ...] }

// io.on('connection', (socket) => {
//   console.log('A user connected:', socket.id);



//   socket.on('pay-game-fee', ({ roomName }) => {
//     const playerList = roomPlayers[roomName];
//     if (!playerList) return;

//     const player = playerList.find(p => p.id === socket.id);
//     if (player) {
//       player.hasPaid = true;
//       console.log(`${player.name} (${socket.id}) has paid for room ${roomName}`);

//       // Notify client
//       socket.emit('payment-success');

//       // ✅ Check if all players have paid and room has 4 players
//       const allPaid = playerList.length === 4 && playerList.every(p => p.hasPaid);
//       if (allPaid) {
//         io.to(roomName).emit('start-game', { message: 'All players paid! Game is starting!' });
//         console.log(`Game started in room ${roomName}`);
//       }
//     }
//   });

//   const roomPrices = {}; // { roomName: 100 }
//     const GAME_PRICE = 100; // tokens or coins

// app.post('/set-price', (req, res) => {
//   const { roomName, price } = req.body;
//   roomPrices[roomName] = price;
//   res.json({ message: 'Price set successfully' });
// });




//   // Join a room (with playerName as well as a limit of 4 players)
//   socket.on('join-room', ({ roomName, playerName }) => {
//     // Create room entry if needed
//     if (!roomPlayers[roomName]) {
//       roomPlayers[roomName] = [];
//     }

//     // Check player limit
//     if (roomPlayers[roomName].length >= 4) {
//       socket.emit('room-full', { roomName });
//       return;
//     }

//     // Store player info
//     socket.join(roomName);
//     socket.playerName = playerName;
//     socket.roomName = roomName;
//     roomPlayers[roomName].push({ id: socket.id, name: playerName, hasPaid: false });
//     console.log(`${playerName} (${socket.id}) joined room: ${roomName}`);

//     // Notify others in the room
//     socket.to(roomName).emit('user-joined', {
//       playerId: socket.id,
//       playerName: playerName
//     });

//     // Notify current player count
//     io.to(roomName).emit('player-count', {
//       count: roomPlayers[roomName].length,
//       roomName: roomName
//     });

//     // Start game if 4 players joined
//     if (roomPlayers[roomName].length === 4) {
//       io.to(roomName).emit('start-game', { message: 'Game is starting!' });
//       console.log(`Game started in room ${roomName}`);
//     }
//   });


//   // Leave a room (with playerName)
//   socket.on('leave-room', ({ roomName, playerName }) => {
//     socket.leave(roomName);

//     if (roomPlayers[roomName]) {
//       roomPlayers[roomName] = roomPlayers[roomName].filter(p => p.id !== socket.id);
//       console.log(`${playerName} (${socket.id}) left room: ${roomName}`);

//       // socket.playerName = playerName;
//       // socket.roomName = roomName;
//       // console.log(`${playerName} (${socket.id} leaved room: ${roomName}`);

//       // Notify others in the room
//       socket.to(roomName).emit('user-leaved', {
//         playerId: socket.id,
//         playerName: playerName
//       });
//     }
//     // Broadcast updated player count
//     io.to(roomName).emit('player-count', {
//       count: roomPlayers[roomName].length,
//       roomName
//     });
//     // Cleanup if empty
//     if (roomPlayers[roomName].length === 0) {
//       delete roomPlayers[roomName];
//     }
//   });


//   // Handle game events
//   socket.on('game-action', ({ roomName, action }) => {
//     // Broadcast to all in room except sender
//     socket.to(roomName).emit('game-action', { playerId: socket.id, action });
//   });

//   socket.on('disconnect', () => {
//     console.log('User disconnected:', socket.id);
//     const roomName = socket.roomName;
//     const playerName = socket.playerName;

//     if (socket.roomName && socket.playerName) {
//       socket.to(socket.roomName).emit('user-left', {
//         playerId: socket.id,
//         playerName: socket.playerName
//       });
//     }

//     // Notify others
//     socket.to(roomName).emit('user-left', {
//       playerId: socket.id,
//       playerName
//     });

//     // io.to(roomName).emit('player-count', {
//     //   count: roomPlayers[roomName].length,
//     //   roomName
//     // });

//     // if (roomPlayers[roomName].length === 0) {
//     //   delete roomPlayers[roomName];
//     // }
//   });
// });

// server.listen(3000, () => {
//   console.log('Server listening on http://localhost:3000');
// });


const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const socketIO = require('socket.io');
const cors = require('cors');
// const { Firestore } = require('@google-cloud/firestore');
const mysql = require('mysql2');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const saltRounds = 10;
const JWT_SECRET = 'your-secret-key'; // Change this to a strong secret in production
require("dotenv").config();
require('events').EventEmitter.defaultMaxListeners = 30;




const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);
// const bucket = storage.bucket('your-bucket-name');

const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Set base URL from environment variable or default to '/api/v1'
const BASE_URL = process.env.BASE_URL || '/api/v1';


// 🌐 Profile API: Create Profile
app.post(`${BASE_URL}/profile`, (req, res) => {
  const { username, email, age } = req.body;

  const query = "INSERT INTO profiles (username, email, age) VALUES (?, ?, ?)";
  connection.query(query, [username, email, age], (err, result) => {
    if (err) return res.status(500).json({ error: "Insert failed" });

    const newProfile = { id: result.insertId, username, email, age };
    io.emit("profile_created", newProfile); // 🔁 Send to all sockets
    res.status(201).json(newProfile);
  });
});

/// 🌐 Updated Profile API: Create Profile
app.post(`${BASE_URL}/profile`, (req, res) => {
  const authToken = req.headers.authtoken;

  const {
    username,
    email,
    age,
    user_id,
    user_token,
    device_token,
    my_token
  } = req.body;

  if (!username || !email || !age || !user_id || !user_token || !device_token || !my_token) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const query = `
    INSERT INTO profiles (username, email, age, user_id, user_token, device_token, my_token)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  connection.query(
    query,
    [username, email, age, user_id, user_token, device_token, my_token],
    (err, result) => {
      if (err) {
        console.error("❌ Insert error:", err);
        return res.status(500).json({ error: "Insert failed" });
      }

      const newProfile = {
        id: result.insertId,
        username,
        email,
        age,
        user_id,
        user_token,
        device_token,
        my_token
      };

      io.emit("profile_created", newProfile); // 🔁 Notify all sockets
      res.status(201).json(newProfile);
    }
  );
});


const storage = new Storage({
  // projectId: '766732692382',
  projectId: 'authentication-6845b',
  keyFilename: 'C:/Users/vivek tyagi/Downloads/Node JS Company Project/service-account.json', // ✅ Corrected slashes & add filename
});

const bucket = storage.bucket('ludo-game-bucket'); // ✅ Now it's safe to use


// // ✅ MySQL DB connection
// const db = mysql.createConnection({
//   host: '35.235.240.0',
//   user: 'root',
//   password: 'Shishank@123',
//   database: 'ludo_game_db',
//   port: 3306
// });

// db.connect((err) => {
//   if (err) {
//     console.error('❌ DB Connection Failed:', err);
//     return;
//   }
//   console.log('✅ Connected to MySQL DB');
// });


const connection = mysql.createConnection({
  host: '34.93.97.210',
  user: 'root',
  password: 'Admin@123', // or your password
  database: 'web_node_db',
  // socketPath: '/cloudsql/authentication-6845b:asia-south1:webnode',
  port: 3306,
  connectTimeout: 50000,
});

connection.connect(err => {
  if (err) {
    console.error("❌ DB Connection Failed:", err);
  } else {
    console.log("✅ Connected to MySQL!");
  }
});

// const pool = mysql.createPool({
//   host: '34.100.147.96', // Use Cloud SQL private IP (recommended)
//   user: 'root',
//   password: 'Shishank@123',
//   database: 'ludo_game_db',
//   waitForConnections: true,
//   connectionLimit: 10,
//   connectTimeout: 30000, // Increase timeout to 30 seconds
//   socketPath: '/cloudsql/authentication-6845b:asia-south1:ludo-sql-db' // For Cloud SQL Proxy
// });

// pool.query('SELECT 1 + 1 AS result', (err, results) => {
//   if (err) {
//     console.error('❌ DB Connection Failed:', err);
//   } else {
//     console.log('✅ DB Connected. Result:', results[0].result);
//   }
// });



app.use(express.static('public'));

const roomPlayers = {}; // { roomName: [ { id, name, hasPaid } ] }
const paidUsers = {};   // { socket.id: { roomName, playerName } }
const roomTurns = {}; // Keeps track of whose turn it is in each room
const GAME_PRICE = 100;
const roomplayers = {};
const roomName = {};
const BUCKET_NAME = 'ludo-game-bucket';

async function uploadFile() {
  // await bucket.upload('./localfile.txt', {
  //   destination: 'folder-on-cloud/file.txt',
  // });
  await bucket.upload('./localfile.txt', {
    destination: 'folder-on-cloud/file.txt',
  });

  console.log('✅ File uploaded to GCS');
}

// uploadFile();

// async function uploadToGCS(localFilePath, destinationFileName) {
//   console.log("Sp",'https://storage.googleapis.com/');
//   try {
//     await storage.bucket(ludo-game-bucket).upload(localFilePath, {
//       destination: destinationFileName,
//     });

//     await storage.bucket(ludo-game-bucket).file(destinationFileName).makePublic();


//     const url = `https://storage.googleapis.com/${ludo-game-bucket}/${destinationFileName}`;
//     console.log(`✅ File uploaded: ${url}`);

//     return url;
//   } catch (err) {
//     console.error('❌ Upload failed:', err.message);
//     throw err;
//   }
// }

async function uploadToGCS(localFilePath, destinationFileName) {
  console.log("🌐 Uploading to GCS at:", 'https://storage.googleapis.com/');
}

function getActiveRooms() {
  return Object.keys(roomPlayers);
  // return ['TestRoom1', 'TestRoom2']
};

function getActivePlayers() {
  return Object.values(roomPlayers).flat().map(player => player.name);
}


io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  //   socket.on('roll-dice', ({ roomName }) => {
  //     const players = roomPlayers[roomName];
  //     const currentIndex = roomTurns[roomName];

  //     if (!players || players.length < 2) return;

  //     // Only current turn player can roll
  //     if (players[currentIndex].id !== socket.id) {
  //       socket.emit('not-your-turn');
  //       return;
  //     }

  //     // 🎲 Generate dice roll from 1 to 6
  //     const roll = Math.floor(Math.random() * 6) + 1;
  //     console.log(`${players[currentIndex].name} rolled: ${roll}`);

  //     // Broadcast result
  //     io.to(roomName).emit('dice-rolled', {
  //       playerId: socket.id,
  //       playerName: players[currentIndex].name,
  //       dice: roll
  //     });

  //     // Switch to next player
  //     roomTurns[roomName] = (currentIndex + 1) % players.length;

  //     const nextPlayer = players[roomTurns[roomName]];
  //     io.to(nextPlayer.id).emit('your-turn', {
  //       message: `🎯 ${nextPlayer.name}, it's your turn!`
  //     });

  //     if (roomPlayers[roomName].length >= 2) {
  //       console.log(`❌ Not your turn: ${socket.id}. Expected: ${players[currentIndex].id}`);

  //   roomTurns[roomName] = 0;
  //   const firstPlayer = roomPlayers[roomName][0];
  //   io.to(firstPlayer.id).emit('your-turn', {
  //     message: `🎯 ${firstPlayer.name}, it's your turn!`
  //   });
  // }

  //   });

  socket.on('upload-to-cloud', async () => {
    const localFilePath = path.join(__dirname, 'localfile.txt'); // or dynamic path
    const destinationFileName = `uploads/ludo-${Date.now()}.txt`;

    try {
      const fileUrl = await uploadToGCS(localFilePath, destinationFileName);
      socket.emit('upload-success', { url: fileUrl });
    } catch (err) {
      socket.emit('upload-failed', { error: err.message });
    }
  });



  // ✅ Move this here (TOP level inside connection handler)
  socket.on('declare-winner', ({ roomName, winnerId }) => {
    const players = roomPlayers[roomName];
    if (!players || players.length < 2) return;

    const winner = players.find(p => p.id === winnerId);
    if (!winner) return;

    players.forEach(player => {
      if (player.id === winnerId) {
        io.to(player.id).emit('game-result', {
          result: 'win',
          message: `🎉 You won the game, ${player.name}!`
        });
      } else {
        io.to(player.id).emit('game-result', {
          result: 'lose',
          message: `😞 You lost the game. Winner is ${winner.name}`
        });
      }
    });

    console.log(`🎯 ${winner.name} won in room ${roomName}`);
  });
  // ... rest of your code like join-room, roll-dice etc.



  socket.on('roll-dice', ({ roomName }) => {
    const players = roomPlayers[roomName];
    const currentIndex = roomTurns[roomName];

    if (!players || players.length === 0) {
      console.log("⚠️ No players found in room:", roomName);
      return;
    }

    if (players[currentIndex].id !== socket.id) {
      console.log(`❌ Not your turn: ${socket.id}. Expected: ${players[currentIndex].id}`);
      socket.emit('not-your-turn');
      return;
    }


    const roll = Math.floor(Math.random() * 6) + 1;
    console.log(`${players[currentIndex].name} rolled: ${roll}`);

    io.to(roomName).emit('dice-rolled', {
      playerId: socket.id,
      playerName: players[currentIndex].name,
      dice: roll
    });

    // Switch to next player
    roomTurns[roomName] = (currentIndex + 1) % players.length;

    const nextPlayer = players[roomTurns[roomName]];
    io.to(nextPlayer.id).emit('your-turn', {
      message: `🎯 ${nextPlayer.name}, it's your turn!`
    });
  });


  socket.on('pay-game-fee', ({ roomName, playerName, amount }) => {
    if (!roomName || !playerName || !amount) {
      socket.emit('payment-failed', { reason: 'Missing info or amount' });
      return;
    }

    const allowedAmounts = [10, 50, 100];
    if (!allowedAmounts.includes(amount)) {
      socket.emit('payment-failed', { reason: 'Invalid amount selected' });
      return;
    }

    // ⛔ Check if room is full
    const playersInRoom = roomPlayers[roomName];
    if (playersInRoom && playersInRoom.length >= 4) {
      socket.emit('room-full', { roomName });
      return;
    }

    // ✅ Mark player as paid
    paidUsers[socket.id] = { roomName, playerName, amount };
    console.log(`${playerName} paid ₹${amount} for room ${roomName}`);

    socket.emit('payment-success');
  });

  // socket.on('chat message', async (msg) => {
  //   // Save message to Firestore Realtime DB
  //   await db.ref('messages').push({
  //     message: msg,
  //     timestamp: Date.now(),
  //     sender: socket.id
  //   });

    //     // Save chat message
    // socket.on('chat message', async (msg) => {
    // await firestore.collection('messages').add({
    // message: msg,
    // sender: socket.id,
    // timestamp: Date.now(),
    // });
    // io.emit('chat message', msg);
    // });

  //   io.emit('chat message', msg); // Broadcast message
  // });

  socket.on('get-room-list', () => {
    const rooms = getActiveRooms();
    console.log('roomPlayers object:', roomPlayers);
    console.log('Current Active Rooms:', rooms);
    socket.emit('room-list', rooms);
  });

  socket.on('get-player-list', () => {
    const players = getActivePlayers();
    console.log('roomPlayers object:', roomPlayers);
    console.log('Current Active Players:', players);
    socket.emit('player-list', players);
  });

  // socket.on('declare-winner', ({ roomName, winnerId }) => {
  //   const players = roomPlayers[roomName];
  //   if (!players || players.length < 2) return;

  //   const winner = players.find(p => p.id === winnerId);
  //   if (!winner) return;

  //   players.forEach(player => {
  //     if (player.id === winnerId) {
  //       io.to(player.id).emit('game-result', {
  //         result: 'win',
  //         message: `🎉 You won the game, ${player.name}!`
  //       });
  //     } else {
  //       io.to(player.id).emit('game-result', {
  //         result: 'lose',
  //         message: `😞 You lost the game. Winner is ${winner.name}`
  //       });
  //     }
  //   });

  //   console.log(`🎯 ${winner.name} won in room ${roomName}`);
  // });


  // ✅ Step 2: Join room after payment
  socket.on('join-room', ({ roomName, playerName }) => {
    const paymentInfo = paidUsers[socket.id];
    if (
      !paymentInfo ||
      paymentInfo.roomName !== roomName ||
      paymentInfo.playerName !== playerName
    ) {
      socket.emit('payment-failed', { reason: 'Payment required before joining' });
      return;
    }

    // ⛔ Check again if full (safety)
    if (roomPlayers[roomName] && roomPlayers[roomName].length >= 4) {
      socket.emit('room-full', { roomName });
      return;
    }

    // ✅ Proceed to join
    if (!roomPlayers[roomName]) {
      roomPlayers[roomName] = [];
    }

    socket.join(roomName);
    socket.roomName = roomName;
    socket.playerName = playerName;

    roomPlayers[roomName].push({
      id: socket.id,
      name: playerName,
      hasPaid: true
    });

    if (!(roomName in roomTurns)) {
      roomTurns[roomName] = 0; // Start turn from first player
    }


    console.log(`${playerName} joined room: ${roomName}`);

    socket.to(roomName).emit('user-joined', {
      playerId: socket.id,
      playerName
    });

    io.to(roomName).emit('player-count', {
      count: roomPlayers[roomName].length,
      roomName
    });

    // ✅ Start game if 4 players
    if (roomPlayers[roomName].length === 4) {
      io.to(roomName).emit('start-game', {
        message: 'All 4 players joined. Game is starting!'
      });
    }

    //     if (roomPlayers[roomName].length === 4) {
    //   const allPaid = roomPlayers[roomName].every(p => p.hasPaid);
    //   if (allPaid) {
    //     io.to(roomName).emit('start-game', {
    //       message: 'All 4 players paid & joined. Game is starting!'
    //     });
    //   }
    // }


    //       // Start the first turn
    //     roomTurns[roomName] = 0;
    //      const firstPlayer = roomPlayers[roomName][0];
    //     io.to(firstPlayer.id).emit('your-turn', {
    //       message: 🎯 ${firstPlayer.name}, it's your turn!
    //     });
    //     {
    //     console.log(Room ${roomName} has 4 players but not all paid yet.);
    //   }


    //     // 🔁 Start turn system
    //     roomTurns[roomName] = 0;
    //       firstPlayer = roomPlayers[roomName][0];
    //     io.to(firstPlayer.id).emit('your-turn', {
    //       message: 🎯 ${ firstPlayer.name }, it's your turn!
    // });


    // 🚪 Leaving room
    socket.on('leave-room', ({ roomName, playerName }) => {
      socket.leave(roomName);
      if (roomPlayers[roomName]) {
        roomPlayers[roomName] = roomPlayers[roomName].filter(p => p.id !== socket.id);

        console.log(`${playerName} (${socket.id}) leaved room: ${roomName}`); // ✅ Add this

        socket.to(roomName).emit('user-leaved', {
          playerId: socket.id,
          playerName
        });

        io.to(roomName).emit('player-count', {
          count: roomPlayers[roomName].length,
          roomName
        });

        if (roomPlayers[roomName].length === 0) {
          delete roomPlayers[roomName];
        }
      }

      delete paidUsers[socket.id];
    });



    // 🎮 Game actions
    socket.on('game-action', ({ roomName, action }) => {
      socket.to(roomName).emit('game-action', {
        playerId: socket.id,
        action
      });
    });

    // ❌ Disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);

      const roomName = socket.roomName;
      const playerName = socket.playerName;

      if (roomName && roomPlayers[roomName]) {
        roomPlayers[roomName] = roomPlayers[roomName].filter(p => p.id !== socket.id);

        socket.to(roomName).emit('user-left', {
          playerId: socket.id,
          playerName
        });

        io.to(roomName).emit('player-count', {
          count: roomPlayers[roomName].length,
          roomName
        });

        if (roomPlayers[roomName].length === 0) {
          delete roomPlayers[roomName];
        }
      }

      delete paidUsers[socket.id];
    });
  });
});


// Read data at a specific path
// db.ref('chatRooms/room123').once('value')
//   .then(snapshot => {
//     console.log(snapshot.val()); // view the data
//   })
//   .catch(error => {
//     console.error('Error reading Firebase Realtime Database:', error);
//   });


// socket.on('chat message', async (msg) => {
//   // Save message to Firebase Realtime DB
//   await db.ref('messages').push({
//     message: msg,
//     timestamp: Date.now(),
//     sender: socket.id
//   });

//   io.emit('chat message', msg); // Broadcast message
// });

// Middleware to verify Firebase Token
// const verifyFirebaseToken = async (token) => {
//   try {
//     const decodedToken = await admin.auth().verifyIdToken(token);
//     return decodedToken; // Contains user info
//   } catch (err) {
//     console.error("Invalid token:", err.message);
//     return null;
//   }
// };

// Token Verification Function
// async function verifyToken(xtd0FoIeubW2iQgLWuW3wNnJuap2) {
//   try {
//     const decoded = await admin.auth().verifyIdToken(xtd0FoIeubW2iQgLWuW3wNnJuap2);
//     return decoded;
//   } catch (error) {
//     console.error("Token verification failed:", error.message);
//     return null;
//   }
// }


// socket.on('sign-in', async ({ idToken }) => {
//   const user = await verifyFirebaseToken(idToken);

//   if (user) {
//     // Signed in successfully
//     socket.emit('sign-in-success', {
//       uid: user.uid,
//       email: user.email,
//       name: user.name
//     });
//     console.log("Authenticated:", user.email);
//   } else {
//     socket.emit('sign-in-failed', { error: 'Invalid or expired token' });
//   }
// });
// });

// Sign Up (Client must create user via Firebase Client SDK)
// socket.on("sign-up", async ({ email, password }) => {
//   try {
//     const userRecord = await admin.auth().createUser({
//       email,
//       password
//     });

//     socket.emit("sign-up-success", {
//       uid: userRecord.uid,
//       email: userRecord.email
//     });

//   } catch (error) {
//     socket.emit("sign-up-error", { error: error.message });
//   }
// });

// 🧩 POST: Email/Password Sign-Up
app.post('/api/email-signup', async (req, res) => {
  const { email, password } = req.body;
  console.log("Signup request received:", email);


  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required." });
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
    });

    res.json({
      success: true,
      uid: userRecord.uid,
      email: userRecord.email,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// Sign In (Client gets ID token and sends it)
// socket.on("sign-in", async ({ idToken }) => {
//   const user = await verifyToken(idToken);

//   if (user) {
//     socket.emit("sign-in-success", {
//       uid: user.uid,
//       email: user.email,
//       name: user.name || "",
//     });
//   } else {
//     socket.emit("sign-in-error", { error: "Invalid or expired token." });
//   }
// });
// });



// 🧩 POST: Verify Google ID Token (Sign-In)
app.post('/api/google-signin', async (req, res) => {
  const { xtd0FoIeubW2iQgLWuW3wNnJuap2 } = req.body;
  console.log("Google Sign-In Token received:", xtd0FoIeubW2iQgLWuW3wNnJuap2);


  const user = await verifyToken(xtd0FoIeubW2iQgLWuW3wNnJuap2);
  if (user) {
    res.json({
      success: true,
      uid: user.uid,
      email: user.email,
      name: user.name || "",
    });
  } else {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});

// ✅ GET Route (optional test)
app.get('/', (req, res) => {
  res.send("Socket.IO server with Google Authentication working!");
});


//   socket.on('roll-dice', ({ roomName }) => {
//     const players = roomPlayers[roomName];
//     const currentIndex = roomTurns[roomName];

//     if (!players || players.length < 2) return;

//     // Only current turn player can roll
//     if (players[currentIndex].id !== socket.id) {
//       socket.emit('not-your-turn');
//       return;
//     }

//     // 🎲 Generate dice roll from 1 to 6
//     const roll = Math.floor(Math.random() * 6) + 1;
//     console.log(`${players[currentIndex].name} rolled: ${roll}`);

//     // Broadcast result
//     io.to(roomName).emit('dice-rolled', {
//       playerId: socket.id,
//       playerName: players[currentIndex].name,
//       dice: roll
//     });

//     // Switch to next player
//     roomTurns[roomName] = (currentIndex + 1) % players.length;

//     const nextPlayer = players[roomTurns[roomName]];
//     io.to(nextPlayer.id).emit('your-turn', {
//       message: `🎯 ${nextPlayer.name}, it's your turn!`
//     });
//   });


//   socket.on('pay-game-fee', ({ roomName, playerName, amount }) => {
//   if (!roomName || !playerName || !amount) {
//     socket.emit('payment-failed', { reason: 'Missing info or amount' });
//     return;
//   }

//   const allowedAmounts = [10, 50, 100];
//   if (!allowedAmounts.includes(amount)) {
//     socket.emit('payment-failed', { reason: 'Invalid amount selected' });
//     return;
//   }

//   // ⛔ Check if room is full
//   const playersInRoom = roomPlayers[roomName];
//   if (playersInRoom && playersInRoom.length >= 4) {
//     socket.emit('room-full', { roomName });
//     return;
//   }

//   // ✅ Mark player as paid
//   paidUsers[socket.id] = { roomName, playerName, amount };
//   console.log(`${playerName} paid ₹${amount} for room ${roomName}`);

//   socket.emit('payment-success');
// });
// socket.on('get-room-list', () => {
//     const rooms = getActiveRooms();
//     console.log('roomPlayers object:', roomPlayers);
//     console.log('Current Active Rooms:', rooms);
//     socket.emit('room-list', rooms);
//   });

//   socket.on('get-player-list', () => {
//     const players = getActivePlayers();
//     console.log('roomPlayers object:', roomPlayers);
//     console.log('Current Active Players:', players);
//     socket.emit('player-list', players);
//   });

//   socket.on('declare-winner', ({ roomName, winnerId }) => {
//   const players = roomPlayers[roomName];
//   if (!players || players.length < 2) return;

//   const winner = players.find(p => p.id === winnerId);
//   if (!winner) return;

//   players.forEach(player => {
//     if (player.id === winnerId) {
//       io.to(player.id).emit('game-result', {
//         result: 'win',
//         message: `🎉 You won the game, ${player.name}!`
//       });
//     } else {
//       io.to(player.id).emit('game-result', {
//         result: 'lose',
//         message: `😞 You lost the game. Winner is ${winner.name}`
//       });
//     }
//   });

//   console.log(`🎯 ${winner.name} won in room ${roomName}`);
// });


//   // ✅ Step 2: Join room after payment
//   socket.on('join-room', ({ roomName, playerName }) => {
//     const paymentInfo = paidUsers[socket.id];
//     if (
//       !paymentInfo ||
//       paymentInfo.roomName !== roomName ||
//       paymentInfo.playerName !== playerName
//     ) {
//       socket.emit('payment-failed', { reason: 'Payment required before joining' });
//       return;
//     }

//     // ⛔ Check again if full (safety)
//     if (roomPlayers[roomName] && roomPlayers[roomName].length >= 4) {
//       socket.emit('room-full', { roomName });
//       return;
//     }

//     // ✅ Proceed to join
//     if (!roomPlayers[roomName]) {
//       roomPlayers[roomName] = [];
//     }

//     socket.join(roomName);
//     socket.roomName = roomName;
//     socket.playerName = playerName;

//     roomPlayers[roomName].push({
//       id: socket.id,
//       name: playerName,
//       hasPaid: true
//     });

//     console.log(`${playerName} joined room: ${roomName}`);

//     socket.to(roomName).emit('user-joined', {
//       playerId: socket.id,
//       playerName
//     });

//     io.to(roomName).emit('player-count', {
//       count: roomPlayers[roomName].length,
//       roomName
//     });

//     // ✅ Start game if 4 players
//     if (roomPlayers[roomName].length === 4) {
//       io.to(roomName).emit('start-game', {
//         message: 'All 4 players joined. Game is starting!'
//       });
//     }

//     //     if (roomPlayers[roomName].length === 4) {
//     //   const allPaid = roomPlayers[roomName].every(p => p.hasPaid);
//     //   if (allPaid) {
//     //     io.to(roomName).emit('start-game', {
//     //       message: 'All 4 players paid & joined. Game is starting!'
//     //     });
//     //   }
//     // }


//     //       // Start the first turn
//     //     roomTurns[roomName] = 0;
//     //      const firstPlayer = roomPlayers[roomName][0];
//     //     io.to(firstPlayer.id).emit('your-turn', {
//     //       message: 🎯 ${firstPlayer.name}, it's your turn!
//     //     });
//     //     {
//     //     console.log(Room ${roomName} has 4 players but not all paid yet.);
//     //   }


//     //     // 🔁 Start turn system
//     //     roomTurns[roomName] = 0;
//     //       firstPlayer = roomPlayers[roomName][0];
//     //     io.to(firstPlayer.id).emit('your-turn', {
//     //       message: 🎯 ${ firstPlayer.name }, it's your turn!
//     // });


//     // 🚪 Leaving room
//     socket.on('leave-room', ({ roomName, playerName }) => {
//       socket.leave(roomName);
//       if (roomPlayers[roomName]) {
//         roomPlayers[roomName] = roomPlayers[roomName].filter(p => p.id !== socket.id);

//         console.log(`${playerName} (${socket.id}) leaved room: ${roomName}`); // ✅ Add this

//         socket.to(roomName).emit('user-leaved', {
//           playerId: socket.id,
//           playerName
//         });

//         io.to(roomName).emit('player-count', {
//           count: roomPlayers[roomName].length,
//           roomName
//         });

//         if (roomPlayers[roomName].length === 0) {
//           delete roomPlayers[roomName];
//         }
//       }

//       delete paidUsers[socket.id];
//     });



//     // 🎮 Game actions
//     socket.on('game-action', ({ roomName, action }) => {
//       socket.to(roomName).emit('game-action', {
//         playerId: socket.id,
//         action
//       });
//     });

//     // ❌ Disconnect
//     socket.on('disconnect', () => {
//       console.log('User disconnected:', socket.id);

//       const roomName = socket.roomName;
//       const playerName = socket.playerName;

//       if (roomName && roomPlayers[roomName]) {
//         roomPlayers[roomName] = roomPlayers[roomName].filter(p => p.id !== socket.id);

//         socket.to(roomName).emit('user-left', {
//           playerId: socket.id,
//           playerName
//         });

//         io.to(roomName).emit('player-count', {
//           count: roomPlayers[roomName].length,
//           roomName
//         });

//         if (roomPlayers[roomName].length === 0) {
//           delete roomPlayers[roomName];
//         }
//       }

//       delete paidUsers[socket.id];
//     });
//   });
// });



app.get('/', (req, res) => {
  res.send('Socket.IO server with Firebase Realtime DB running!');
});

// Port from .env or default 3000
const PORT = process.env.PORT || 3001;


server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});