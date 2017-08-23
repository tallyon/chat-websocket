const WebSocketServer = require('websocket').server;
const uuidv4 = require("uuid/v4");
const express = require("express");
const app = express();
const async = require("async");
const mongo = require("mongoose");
mongo.Promise = global.Promise;

var user = require("./models/user.js");
var userModel = user.export.User, userSchema = user.export.UserSchema;
var UserProfileInfo = require("./userProfileInfo.js").UserProfileInfo;

testUserDBConnection();

const port = 8080;

// Array with all registered users
var registeredUsers = [];

// Array with all websocket connections
var socketConnections = [];

// For each connection output current time, requesting ip and url to the console
app.all("*", function(req, res, next) {
    var timeNow = new Date(Date.now());
    console.log(timeNow.toUTCString() + ": " + req.ip + " " + req.method + " " + req.url);
    next();
});

var server = app.listen(port, () => {
    console.log("Chat server listening on port", port);
});

var wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false,
    closeTimeout: 10000,
    maxReceivedMessageSize: 10000
});

function originIsAllowed(origin) {
    return true;
}

wsServer.on("request", function(req) {
    if(originIsAllowed(req.origin) == false) {
        req.reject();
        console.log("Connection from origin", req.origin, "rejected");
        return;
    }

    var connection = req.accept("chat", req.origin);
    // Add this websocket connection to array of all connections
    socketConnections.push(connection);
    
    var timeNow = new Date(Date.now());
    console.log(timeNow.toUTCString(), "Connection accepted from", req.origin);
    
    connection.on("message", function(message) {
        if(message.type === "utf8") {
            // Parse message
            var parsedMessage = null;

            try {
                parsedMessage = JSON.parse(message.utf8Data);
            }
            catch(e) {
                console.log("Could not parse incoming message");
                return;
            }

            console.log("Received message:", parsedMessage);

            var messageType = parsedMessage.type;

            if(messageType == null) {
                console.log("Invalid message type, skip message");
                return;
            }

            switch(messageType.toLowerCase()) {
                case "register":
                    // REGISTER message received from the client
                    registerTransactionHandler(connection, parsedMessage);
                    break;
                case "chat":
                    // CHAT message received from the client
                    chatTransactionHandler(connection, parsedMessage);
                    break;
                default:
                    console.log("Unrecognized message type:", messageType);
                    return;
            }

            // If message was PING send message type ping with no other text
            if(message.utf8Data == "PING") {
                var pingResponse = {
                    type: "PING",
                    data: {
                        timestamp: Math.floor(Date.now() / 1000)
                    }
                }
                connection.sendUTF(JSON.stringify(pingResponse));
            }
            // If message was not ping treat it as chat text
            else {
                var textResponse = {
                    type: "TEXT",
                    data: "This is response from server"
                };
                connection.sendUTF(JSON.stringify(textResponse));
            }
        }
        else if(message.type === "binary") {
            console.log("Received binary message of", message.binaryData.length, "bytes");
            connection.sendBytes(0);
        }
    });

    connection.on("close", function(reasonCode, description) {
        console.log("Peer", connection.remoteAddress, "disconnected");
    });
});

function registerTransactionHandler(connection, message) {
    if(message == null || message.data == null || message.data.username == null) return;

    var username = message.data.username;
    console.log("Received register transaction message from the client to register username", username);

    // Register new user
    var userToken = registerUser(username);

    var responseRegisterMessage = {
        type: "register",
        timestamp: Math.floor(Date.now().valueOf() / 1000),
        data: null
    };

    if(userToken === "") {
        // User has not been registered, add error message to response
        responseRegisterMessage.error = "username taken";
    }
    else {
        // User has been registered, add username and user token to response
        responseRegisterMessage.data = {
            username: username,
            userToken: userToken
        };
    }

    // Send back register transaction message to the user
    connection.sendUTF(JSON.stringify(responseRegisterMessage));

    // Send chat message to broadcast new user entering the chat
    sendChatMessage(socketConnections, username, "joined chat!");
}

/**
 * Registers new user in chat. Returns user token string when successfuly added user to chat, empty string otherwise.
 * 
 * @param {string} username Username of new user
 * @return {string}
 */
function registerUser(username) {
    // Check if there is user with this username registered
    var foundUser = registeredUsers.find((user, index) => {
        return user.username == username;
    });

    if(foundUser == null) {
        // This username is not taken
        var newUser = {
            username: username,
            userToken: uuidv4()
        };

        // Add new user to registered users array
        registeredUsers.push(newUser);

        // Return user token of registered user
        return newUser.userToken;
    }
    else {
        // This username is taken
        return "";
    }
}

/**
 * Sends chat transaction message to clients.
 * 
 * @param {connection} connection WebSocket connection object
 * @param {string} senderUsername Username of the sender of the message
 * @param {string} body Body text of chat message
 */
function sendChatMessage(connections, senderUsername, body) {
    // Create transaction message with type chat
    var transactionMessage = {
        type: "chat",
        timestamp: Math.floor(Date.now().valueOf() / 1000),
        data: {
            username: senderUsername,
            body: body
        }
    };

    console.log("Sending chat transaction message to the clients:", transactionMessage);
    connections.forEach((connection) => {
        connection.sendUTF(JSON.stringify(transactionMessage));
    });
}

function chatTransactionHandler(connection, message) {
    if(message == null || message.data == null || message.data.userToken == null) return;

    console.log("Received chat transaction message from the client to broadcast the message", message);

    var userToken = message.data.userToken;

    // Find username of the user in array of registered users
    var foundUser = registeredUsers.find((user) => {
        return user.userToken == userToken;
    });

    if(foundUser == null) {
        // Could not find user with this token
        return;
    }
    else {
        // Send chat message
        sendChatMessage(socketConnections, foundUser.username, message.data.body);
    }
}


/**
 * Tests connection to mongodb instance with chat_users database and prints info about the db
 * 
 */
function testUserDBConnection() {

    async.waterfall([
        // Connect to mongodb
        (callback) => {
            console.log("Connecting to mongodb instance...");
            mongo.connect("mongodb://chat_backend:zaq1%40WSX@ds153413.mlab.com:53413/chat_users", {
                useMongoClient: true
            }, (err) => {
                if(err) {
                    console.log("Could not connect to mongodb instance: " + err.message);
                    return callback(err);
                } else {
                    console.log("Connected to mongodb instance with database:" + mongo.connection.db.databaseName);
                    return callback(null);
                }
            });
        },
        // Get user profile info
        (callback) => {
            // Get user profile info
            getUserProfileInfo((err, info) => {
                if(info != null) {
                    console.log("\nUser Profiles info:\n====================\n\t" + info.toString());
                    return callback(null);
                } else if (err != null) {
                    console.log("Unable to get user profile info: " + err.message);
                    return callback(err);
                } else { 
                    console.log("Unable to get user profiles info: no error data");
                    return callback(null);
                }
            });
        }
    ], (err) => {
        // Close mongodb connection
        console.log("Disconnecting from mongodb...");
        mongo.disconnect((err) => {
            if(err == null) console.log("\tdone");
            else console.error(err);
        });
    });
}


/**
 * This function returns user profile stats object that contains discovered statistics about database
 * 
 * @param {any} callback 
 */
function getUserProfileInfo(callback) {
    let info = new UserProfileInfo();

    async.waterfall([
        // Get count of user profiles in db
        (callback) => {
            userModel.count({}, (err, count) => {
                if(count != null) info.countUsers = count;
                callback(null);
            });
        }
    ], (err) => {
        if(err == null) callback(err, info);
        else callback(err, null);
    });
}
