// This token will be received from the server upon joining
// Use it to identify yourself when sending messages
var serverToken = "";
// Displayed name of current user
var username = "test" + Date.now().valueOf().toString();
// Randomly generated map of usernames to colors for displaying chat users' usernames
var usernameColorsMap = new Map();

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

    // Set color for this user
    var color = getRandomColor();
    usernameColorsMap.set(username, color);

    // Register callback for chat message event
    chat.registerIncomingChatMessageCallback(handleChatMessage);
});

function handleChatMessage(messageData, timestamp) {
    var username = messageData.username;
    var messageBody = messageData.body;
    // Transform timestamp to local date
    var date = new Date(timestamp * 1000);
    console.log("got message:", messageData);

    // If username that sent this message does not have color associated with it in username to color map
    // generate new color for this user
    if(usernameColorsMap.has(username) == false)
    {
        var randomColor = getRandomColor();
        usernameColorsMap.set(username, randomColor);
    }

    var color = usernameColorsMap.get(username);

    chatWindow.innerHTML += "<br/><span style='color:" + color + "'>" + date.toLocaleTimeString("en-US", {hour12: false}) + " " + username + ":</span> " + messageBody;
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

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
