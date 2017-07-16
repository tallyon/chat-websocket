// This token will be received from the server upon joining
// Use it to identify yourself when sending messages
var serverToken = "";
// Displayed name of current user
var username = "test" + Date.now().valueOf().toString();

var chatWindow = document.getElementById("chatWindow");
var messageWindow = document.getElementById("");
var btnChatMessageSend = document.getElementById("btnMessageSend");
var textAreaChatMessage = document.getElementById("textChatMessageField");
var registrationPopup = document.getElementById("registration-popup");

// Will be instantiated with new Chat() later after username is provided.
var chat = null;

// Open registration popup for user to provide username
openRegistrationPopup((err, username) => {
    chat = new Chat("ws://localhost:8080", "chat", username);

    // Hide registration popup
    hideRegistrationPopup();

    // Register callback for chat message event
    chat.registerIncomingChatMessageCallback(handleChatMessage);
});

function handleChatMessage(messageData, timestamp) {
    var messageBody = messageData.body;
    // Transform timestamp to local date
    var date = new Date(timestamp * 1000);
    console.log("got message:", messageData);
    chatWindow.innerHTML += "<br/>" + date.toLocaleTimeString("en-US", {hour12: false}) + " " + messageBody;
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
    var menuDisplay = document.getElementById("menuWindow");
    var rotateImage = document.getElementById("btnMenu");
    if (menuDisplay.style.display === "block") {
        rotateImage.style.transform = "rotate(45deg)";
        menuDisplay.style.display = "none";
    } else {
        rotateImage.style.transform = "rotate(-90deg)";
        menuDisplay.style.display = "block";
    }
}

// User registration popup
function openRegistrationPopup(callback) {
    // Currently registration popup is visible from the start
    
    document.getElementById("register-button").onclick = function() {
        var username = usernameRegistration.value;
        callback(null, username);
    };
};

/**
 * Remove registration popup.
 * 
 */
function hideRegistrationPopup() {
    registrationPopup.remove();
}
