// This token will be received from the server upon joining
// Use it to identify yourself when sending messages
var serverToken = "";
// Displayed name of current user
var username = "test" + Date.now().valueOf().toString();

var chatWindow = document.getElementById('chatWindow');
var messageWindow = document.getElementById('');
var btnChatMessageSend = document.getElementById("btnMessageSend");
var textAreaChatMessage = document.getElementById("textChatMessageField");

// Create websocket connection
const socket = new WebSocket("ws://localhost:8080", "chat");

// Connection opened
socket.addEventListener("open", function(event) {
    console.log("Opened socket to the chat server");
    openRegistrationPopup(function(err, username) {
        if(err != null) console.error("error from registration popup:", err);
        else connectToServer(socket, username);
    });
});

// SEND button click function that will send message
btnChatMessageSend.addEventListener("click", function(event) {
    console.log("SEND btn clicked, server token:", serverToken);
    // If there is no server token return
    if(serverToken === "") return;

    var messageBody = textAreaChatMessage.value;
    console.log("message body:", messageBody);
    sendMessage(socket, serverToken, messageBody);

    // Clear text area
    textAreaChatMessage.value = "";
});

function toggleMenu() {
    var menuDisplay = document.getElementById('menuWindow');
    var rotateImage = document.getElementById('btnMenu');
    if (menuDisplay.style.display === 'block') {
        rotateImage.style.transform = 'rotate(45deg)';
        menuDisplay.style.display = 'none';
    }
    else {
        rotateImage.style.transform = 'rotate(-90deg)';
        menuDisplay.style.display = 'block';
    }
}

/**
 * Open registration popup blocking chat connection until user specifies username.
 * When username is chosen by the user call callback with specified username.
 * 
 * @param {function(Error, string)} callback Callback with error and chosen username string
 */
function openRegistrationPopup(callback) {
    // TODO: show popup and handle username input then call callback function with username
    console.log("pretend that user has chosen " + username + " as username and proceed with chat registration");
    callback(null, username);
}

/**
 * Orchestrate connection transaction to the server.
 * 
 * @param {WebSocket} serverSocket WebSocket object that will be used to communicate with the server
 * @param {string} username Chosen username to register the user in chat with
 */
function connectToServer(serverSocket, username) {
    // Add handler for message WebSocket event
    serverSocket.addEventListener("message", onMessageWebSocketHandler);

    // Send login request to the server to receive token
    requestLogin(serverSocket, username);
}

/**
 * Sends register message to the server with provided username.
 * 
 * @param {WebSocket} serverSocket WebSocket object connected to the server
 * @param {string} username Username that will be registered
 */
function requestLogin(serverSocket, username) {
    var registerMessage = createRegisterTransaction(username);

    console.log("Sending REGISTER transaction to the server, message:", registerMessage);
    serverSocket.send(JSON.stringify(registerMessage));
}

/**
 * Creates REGISTER transaction payload.
 * 
 * @param {string} username Username that will be registered.
 */
function createRegisterTransaction(username) {
    var message = {
        type: "register",
        timestamp: Math.floor(Date.now().valueOf() / 1000),
        data: {
            username: username
        }
    }

    return message;
}


/**
 * Creates CHAT transaction payload.
 * 
 * @param {string} userToken Token of current user
 * @param {string} body Chat message body text
 */
function createChatTransaction(userToken, body) {

    if(userToken == null || body == null) return null;

    var message = {
        type: "chat",
        timestamp: Math.floor(Date.now().valueOf() / 1000),
        data: {
            userToken: userToken,
            body: body
        }
    };

    return message;
}

/**
 * This function will handle all communication received from the server.
 * 
 * @param {MessageEvent} event 
 */
function onMessageWebSocketHandler(event) {
    // Try to parse the event data
    var parsedData = null;

    try {
        parsedData = JSON.parse(event.data);
    }
    catch(e) {
        console.error("unable to parse server message:", event.data);
        return;
    }

    if(parsedData == null) {
        console.error("received empty data from server");
        return;
    }

    if(parsedData.type == null) {
        console.log("received message data without type from the server, omitting");
        return;
    }

    // Get identifier from transaction message type
    var transactionType = transactionTypeStringToNum(parsedData.type);

    // Server has sent register message with user token or error
    switch(transactionType) {
        case 0:
            // REGISTER
            registerTransactionHandler(parsedData);
            break;
        case 1:
            // UNREGISTER
            break;
        case 2:
            // PING
            break;
        case 3:
            // CHAT
            chatTransactionHandler(parsedData);
            break;
        default:
            // Unrecognized transaction type
            return;
    }
};

/**
 * Handles incoming REGISTER transaction message.
 * 
 * @param {any} message Transaction message JSON payload.
 */
function registerTransactionHandler(message) {
    console.log("Received REGISTER transaction, message:", message);

    if(message.data.userToken != null) {
        serverToken = message.data.userToken;
    }
}

/**
 * Handles incoming CHAT transaction message.
 * 
 * @param {any} message Transaction message JSON payload
 */
function chatTransactionHandler(message) {
    console.log("Received CHAT transaction, message:", message);
    chatWindow.innerHTML += "<br/>" + message.data.body;
}

/**
 * Send chat message to the server.
 * 
 * @param {string} userToken User token received upon registration.
 * @param {string} text Body of chat message to send
 */
function sendMessage(serverSocket, userToken, text) {
    var chatMessage = createChatTransaction(userToken, text);

    if(chatMessage == null) {
        return;
    }

    serverSocket.send(JSON.stringify(chatMessage));
}

/**
 * Converts string transaction message type to number identifier.
 * Returns -1 if identifier is not recognized.
 * 
 * @param {string} type String identifying transaction message type
 * @returns {number}
 */
function transactionTypeStringToNum(type) {

    if(type == null) return -1;

    switch(type.toLowerCase()) {
        case "register":
            return 0;
        case "unregister":
            return 1;
        case "ping":
            return 2;
        case "chat":
            return 3;
        default:
            return -1;
    }
}
