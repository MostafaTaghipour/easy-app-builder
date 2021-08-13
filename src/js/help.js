// const scrollId = window.location.hash?.replace('#', '');
// console.log(scrollId);

const {shell} = require('@electron/remote');

(function () {
  const externalLinks = document.querySelectorAll("a[target='_external']");

  Array.from(externalLinks).forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const url = e.currentTarget.getAttribute('href');
      shell.openExternal(url);
    });
  });
})();
