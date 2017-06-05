var chatWindow = document.getElementById('');
var messageWindow = document.getElementById('');

function toggleMenu() {
  var menuDisplay = document.getElementById('menuWindow');
  if (menuDisplay.style.display === 'block') {
    menuDisplay.style.display = 'none';
  } else {
    menuDisplay.style.display = 'block';
  }
}
