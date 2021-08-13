function showSnackBar(document, text, duration = 3000) {
  var div = document.createElement('div');
  div.innerHTML = text;
  div.id = 'snackbar';
  document.body.appendChild(div);
  div.className = 'show';

  setTimeout(function () {
    div.className = div.className.replace('show', '');
  }, duration - 500);
  setTimeout(function () {
    document.body.removeChild(div);
  }, duration);
}

module.exports = {
  showSnackBar,
};
