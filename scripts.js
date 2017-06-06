var chatWindow = document.getElementById('');
var messageWindow = document.getElementById('');

function toggleMenu() {
  var menuDisplay = document.getElementById('menuWindow');
  var rotateImage = document.getElementById('btnMenu');
  if (menuDisplay.style.display === 'block') {
    rotateImage.style.transform = 'rotate(45deg)';
    menuDisplay.style.display = 'none';
  } else {
    rotateImage.style.transform = 'rotate(-90deg)';
    menuDisplay.style.display = 'block';
  }
}
