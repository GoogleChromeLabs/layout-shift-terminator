
const viewportSizes = [
  {"width": 1920, "height": 1080},
  {"width": 1536, "height": 864},
  {"width": 1366, "height": 768},
  {"width": 768, "height": 1024},
  {"width": 414, "height": 896},
  {"width": 375, "height": 667},
  {"width": 360, "height": 640}
];

document.addEventListener( 'DOMContentLoaded', () => {
  const form = document.querySelector('form');
  
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    start();
  })
  
  form.querySelector('button[type=submit]').disabled = false;
  
  start();
} );


function start() {
  const calculationContainer = document.getElementById('calculation');
  calculationContainer.hidden = false;
  
  const viewportIframe = document.querySelector('iframe');
  viewportIframe.src = 'about:blank';
  
}