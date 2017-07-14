// Shit is retarded - in order to be able to refer to Chat class in functions that have 'this' provided
// from the caller (e.g. serverSocket.addEventListener("message", this.onMessageWebSocketHandler), there has to be
// globally visible variable that holds Chat class reference. It's ugly and there has be a better practice.
var self;

/**
 * Single connection chat client over websockets.
 * 
 * @class Chat client
 */
class Chat {
    /**
     * Creates an instance of Chat.
     * @memberof Chat
     */
    constructor(connectionString, protocol, username) {
        self = this;
        // This token will be received from the server upon registering username
        // Use it to identify yourself when sending messages
        this.serverToken = "";
        // Username
        this.username = username;
        // Websocket connection to the server's chat
        this.socket = this.connectToSocket(connectionString, protocol);
        this.socket.addEventListener("open", (event) => {
            console.log("Opened socket to the chat server, connecting to chat...");
            this.connectToChat(this.socket, this.username);
        });
    }

    /**
     * Send chat message to the server.
     * 
     * @param {string} text Body of chat message to send
     */
    sendMessage(text) {
        // Prevent sending empty messages
        if(text == null || text.length < 1) return;

        var chatMessage = this.createChatTransaction(this.serverToken, text);

        if(chatMessage == null) {
            return;
        }

        this.socket.send(JSON.stringify(chatMessage));
    }

    registerIncomingChatMessageCallback(handlerFunction) {
        this.onIncomingChatMessage = handlerFunction;
    }

    /**
     * Orchestrate connection transaction to the server.
     * 
     * @param {WebSocket} serverSocket WebSocket object that will be used to communicate with the server
     * @param {string} username Username that will be registered for currently connecting user
     * @memberof Chat
     */
    connectToChat(serverSocket, username) {
        serverSocket.addEventListener("message", this.onMessageWebSocketHandler);

        // Send login request to the server to receive token
        this.requestLogin(serverSocket, username);
    }

    /**
     * Handles incoming REGISTER transaction message.
     * 
     * @param {any} message Transaction message JSON payload.
     */
    registerTransactionHandler(message) {
        console.log("Received REGISTER transaction, message:", message);

        if(message.data.userToken != null) {
            this.serverToken = message.data.userToken;
        }
    }

    /**
     * Connects to chat server via websocket. Returns WebSocket with server connection.
     * 
     * @returns {WebSocket} socket with connection to the chat server
     * @memberof Chat
     */
    connectToSocket(url, protocol) {
        // return new WebSocket("ws://localhost:8080", "chat");
        return new WebSocket(url, protocol);
    }

    /**
     * Sends register message to the server with provided username.
     * 
     * @param {WebSocket} serverSocket WebSocket object connected to the server
     * @param {string} username Username that will be registered
     */
    requestLogin(serverSocket, username) {
        var registerMessage = this.createRegisterTransaction(username);

        console.log("Sending REGISTER transaction to the server, message:", registerMessage);
        serverSocket.send(JSON.stringify(registerMessage));
    }

    /**
     * Handles incoming CHAT transaction message.
     * 
     * @param {any} message Transaction message JSON payload
     */
    chatTransactionHandler(message, callback) {
        console.log("Received CHAT transaction, message:", message);

        // If callback for chat message has been registered pass message to it
        if(callback != null) callback(message.data.body);
    }

    /**
     * Creates REGISTER transaction payload.
     * 
     * @param {string} username Username that will be registered.
     */
    createRegisterTransaction(username) {
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
    createChatTransaction(userToken, body) {

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
     * Converts string transaction message type to number identifier.
     * Returns -1 if identifier is not recognized.
     * 
     * @param {string} type String identifying transaction message type
     * @returns {number}
     */
    transactionTypeStringToNum(type) {

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

    onMessageWebSocketHandler(event) {
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
        var transactionType = self.transactionTypeStringToNum(parsedData.type);

        // Server has sent register message with user token or error
        switch(transactionType) {
            case 0:
                // REGISTER
                self.registerTransactionHandler(parsedData);
                break;
            case 1:
                // UNREGISTER
                break;
            case 2:
                // PING
                break;
            case 3:
                // CHAT
                self.chatTransactionHandler(parsedData, self.onIncomingChatMessage);
                break;
            default:
                // Unrecognized transaction type
                return;
        }
    }
}
