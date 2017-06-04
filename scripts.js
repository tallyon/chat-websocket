var chatWindow = document.getElementById('');
var messageWindow = document.getElementById('');

function toggleMenu() {
  var menuDisplay = document.getElementById('menuWindow');
  if (menuDisplay.style.visibility === 'hidden') {
    menuDisplay.style.visibility = 'visible';
  } else {
    menuDisplay.style.visibility = 'hidden';
  }
}
