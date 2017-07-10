// This token will be received from the server upon joining
// Use it to identify yourself when sending messages
var serverToken = "";
// Displayed name of current user
var username = "test" + Date.now().valueOf().toString();

var chatWindow = document.getElementById('chatWindow');
var messageWindow = document.getElementById('');
var btnChatMessageSend = document.getElementById("btnMessageSend");
var textAreaChatMessage = document.getElementById("textChatMessageField");

// Will be instantiated with new Chat() later after username is provided.
var chat = null;

// Start chat client with username provided via registration popup (mockup right now)
openRegistrationPopup((err, username) => {
    chat = new Chat("ws://localhost:8080", "chat", username);

    // Register callback for chat message event
    chat.registerIncomingChatMessageCallback(handleChatMessage);
});

function handleChatMessage(messageBody) {
    console.log("got message body:", messageBody);
    chatWindow.innerHTML += "<br/>" + messageBody;
}

// SEND button click function that will send message
btnChatMessageSend.addEventListener("click", function(event) {
    if (chat == null) return;

    console.log("SEND btn clicked, server token:", serverToken);

    var messageBody = textAreaChatMessage.value;
    console.log("message body:", messageBody);
    chat.sendMessage(messageBody);

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
