
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
  
  const maxWidth = calculationContainer.offsetWidth;
  
  const progress = document.querySelector('progress');
  progress.max = viewportSizes.length;
  let i = 1;
  for ( const viewportSize of viewportSizes ) {
    await calculateViewportSize( { maxWidth, markup, ...viewportSize } );
    
    
    
    
    progress.value = i;
    i++;
  }
}


async function calculateViewportSize( { maxWidth, width, height, markup } ) {
  const iframe = document.querySelector('iframe');
  iframe.src = 'about:blank';
  
  if ( maxWidth >= width ) {
    iframe.style.transform = '';
  } else {
    iframe.style.transform = `scale(${maxWidth/width})`;
  }
  
  iframe.width = width;
  iframe.height = height;
  iframe.contentWindow.document.open();
  iframe.contentWindow.document.write(markup);
  iframe.contentWindow.document.close();
  
  return new Promise((resolve) => {
    setTimeout( resolve, 100 )
  });
}