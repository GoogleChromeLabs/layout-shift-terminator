
const viewportSizes = [
  {"width": 1920, "height": 1080},
  // {"width": 1536, "height": 864},
  // {"width": 1366, "height": 768},
  // {"width": 768, "height": 1024},
  // {"width": 414, "height": 896},
  // {"width": 375, "height": 667},
  // {"width": 360, "height": 640}
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


async function start() {
  const calculationContainer = document.getElementById('calculation');
  calculationContainer.hidden = false;
  const markup = document.getElementById('markup').value;
  
  const progress = document.querySelector('progress');
  progress.max = viewportSizes.length;
  let i = 1;
  for ( const viewportSize of viewportSizes ) {
    await calculateViewportSize( { markup, ...viewportSize } );
    
    
    
    progress.value = i;
    i++;
  }
}


async function calculateViewportSize( { width, height, markup } ) {
  const iframe = document.querySelector('iframe');
  iframe.src = 'about:blank';
  iframe.width = width;
  iframe.height = height;
  iframe.contentWindow.document.open();
  iframe.contentWindow.document.write(markup);
  iframe.contentWindow.document.close();
}