
import { default as viewportSizes } from './viewports.js';

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  form.addEventListener("submit", event => {
    event.preventDefault();
    start();
  });

  form.querySelector("button[type=submit]").disabled = false;

  start();
});

async function start() {
  const calculationContainer = document.getElementById("calculation");
  calculationContainer.hidden = false;
  
  const currentViewportWidthSpan = document.getElementById('current-viewport-width');
  const currentViewportHeightSpan = document.getElementById('current-viewport-height');
  
  const markup = document.getElementById("markup").value;

  const maxWidth = calculationContainer.offsetWidth;

  const progress = document.querySelector("progress");
  progress.max = viewportSizes.length;
  let i = 1;
  progress.value = 0;
  
  const results = [];
  
  for (const viewportSize of viewportSizes) {
    currentViewportWidthSpan.textContent = viewportSize.width.toString();
    currentViewportHeightSpan.textContent = viewportSize.height.toString();
    
    const data = await calculateViewportSize({
      maxWidth,
      markup,
      ...viewportSize
    });
    
    results.push({
      ...data,
      viewportSize
    })
    
    progress.value = i;
    i++;
  }
  
  console.info(results)
}

/**
 * This function must be self-contained because it is exported as JS string into the iframe.
 */
function watchForEmbedLoaded(container) {
  const windowLoaded = new Promise(resolve => {
    window.addEventListener("load", resolve);
  });

  const startTime = new Date();

  return new Promise((resolve, reject) => {
    const resolveWithResolution = () => {
      resolve({
        duration: new Date().valueOf() - startTime.valueOf(),
        width: container.offsetWidth,
        height: container.offsetHeight
      });
    };

    // Allow up to 5 seconds to size the embed.
    setTimeout(resolveWithResolution, 5000);

    // If there is no JS script in the embed, resolve once window loaded.
    // This allows us to obtain dimensions for an image/video that lacks
    // width/height attributes.
    const script = container.querySelector(
      'script:not([type]), script[type="module"], script[type~="javascript"], *[onload]'
    );
    if (!script) {
      const dimensionLessVideo = container.querySelector(
        "video:not([width][height])"
      );
      if (dimensionLessVideo) {
        if (dimensionLessVideo.videoWidth && dimensionLessVideo.videoHeight) {
          resolveWithResolution();
        } else {
          dimensionLessVideo.addEventListener(
            "loadedmetadata",
            resolveWithResolution
          );
        }
      } else {
        windowLoaded.then(resolveWithResolution);
      }
      return;
    }

    // Start listening for DOM changes, and stop once a 2.5-second pause is encountered.
    // Warning: the embed may be wise enough to implement lazy-loading.
    let resolveTimeoutId = 0;
    const observer = new MutationObserver(() => {
      clearTimeout(resolveTimeoutId);
      resolveTimeoutId = setTimeout(() => {
        observer.disconnect();
        resolveWithResolution();
      }, 2500);
    });
    observer.observe(container, {
      subtree: true,
      childList: true,
      attributes: true
    });
  });
}

async function calculateViewportSize({ maxWidth, width, height, markup }) {
  const oldIframe = document.querySelector("iframe");

  const iframe = document.createElement("iframe");
  iframe.src = "about:blank";
  iframe.width = width;
  iframe.height = height;
  if (maxWidth >= width) {
    iframe.style.transform = "";
  } else {
    iframe.style.transform = `scale(${maxWidth / width})`;
  }
  oldIframe.parentNode.replaceChild(iframe, oldIframe);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width">
      <style>
        /* Add border to prevent margin collapsing. */
        /*body > div { border: solid 1px transparent; }*/
      </style>
    </head>
    <body>
      <div>${markup}</div>
      <script>
      (async () => {
        ${watchForEmbedLoaded.toString()}
        const data = await watchForEmbedLoaded(document.querySelector('div'));
        parent.postMessage(data);
      })();
      </script>
    </body>
    </html>
  `;

  return new Promise(resolve => {
    window.addEventListener(
      "message",
      event => {
        if (event.source === iframe.contentWindow) {
          resolve(event.data);
        }
      },
      { once: true }
    );
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(html);
    iframe.contentWindow.document.close();
  });
}
