import { default as viewportSizes } from "./viewports.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  form.addEventListener("submit", event => {
    event.preventDefault();
    start();
  });

  form.querySelector("button[type=submit]").disabled = false;

  document.getElementById('reload-preview').addEventListener( 'click', () => {
    renderOptimizedPreview(document.getElementById("optimized-markup").value);
    console.info('cod');
  } );
  
  start(); // Testing.
});

async function start() {
  const calculationContainer = document.getElementById("calculation");
  const terminationSection = document.getElementById("termination");

  calculationContainer.hidden = false;
  terminationSection.hidden = true;

  const currentViewportWidthSpan = document.getElementById(
    "current-viewport-width"
  );
  const currentViewportHeightSpan = document.getElementById(
    "current-viewport-height"
  );

  const markup = document.getElementById("markup").value;

  const maxWidth = calculationContainer.offsetWidth;

  const progress = document.querySelector("progress");
  progress.max = viewportSizes.length;
  let i = 1;
  progress.value = 0;

  const results = [];

  for (const viewportSize of viewportSizes) {
    progress.value = i;
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
    });

    i++;
  }

  calculationContainer.hidden = true;
  terminationSection.hidden = false;
  const markupViewportSizesOl = document.getElementById(
    "markup-viewport-sizes"
  );
  while (markupViewportSizesOl.firstChild) {
    markupViewportSizesOl.removeChild(markupViewportSizesOl.firstChild);
  }
  for (const result of results) {
    const li = document.createElement("li");
    li.textContent = JSON.stringify(result);
    markupViewportSizesOl.appendChild(li);
  }

  const optimizedMarkupTextarea = document.getElementById("optimized-markup");
  const id = `layout-shift-termination-${Math.random()}`.replace(".", "-");

  let styleTag = "<style class='layout-shift-termination'>";
  for (const result of results) {
    // @todo Also container queries.
    styleTag += `\n@media only screen and ( max-width: ${result.viewportSize.width}px ) { #${id} { min-height:${result.height}px; } }`;
  }
  styleTag += "\n</style>";

  const terminateLayoutShift = function(root) {
    setTimeout(function() {
      [].map.call(root.querySelectorAll(".layout-shift-termination"), el =>
        el.remove()
      );
    }, 4000);
  };

  let scriptTag = `<script class='layout-shift-termination' async>`;
  scriptTag += `(${terminateLayoutShift.toString()})(document.getElementById(${JSON.stringify(
    id
  )}))`;
  scriptTag += `</script>`;

  const optimizedMarkup = `<div id="${id}">\n${styleTag}\n${scriptTag}\n${markup}\n</div>`;
  optimizedMarkupTextarea.value = optimizedMarkup;

  const optimizedPreview = document.getElementById("optimized-preview");
  optimizedPreview.height = Math.max(...results.map(result => result.height)) + 100;
  
  renderOptimizedPreview(optimizedMarkup);
}


function renderOptimizedPreview(previewMarkup) {
  const iframe = document.getElementById("optimized-preview");
  iframe.contentWindow.document.open();
  iframe.contentWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width">
    </head>
    <body>
      ${previewMarkup}
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque ullamcorper consequat magna et feugiat. Integer placerat, dui nec semper posuere, urna nisl convallis mi, sed scelerisque ex mauris eget eros. Ut sit amet commodo leo. Vivamus ac efficitur ipsum. Integer vitae urna scelerisque, porta augue nec, blandit ligula. Aliquam massa sapien, mattis sit amet egestas ac, euismod ac urna. Interdum et malesuada fames ac ante ipsum primis in faucibus. Vestibulum risus neque, lobortis nec arcu eu, molestie congue nulla. Aliquam maximus diam id turpis eleifend, sed sagittis dui bibendum. In facilisis ullamcorper ornare.</p>
    </body>
    </html>
  `);
  iframe.contentWindow.document.close();
}

async function calculateViewportSize({ maxWidth, width, height, markup }) {
  const oldIframe = document.querySelector("iframe");
  const iframeWrapper = oldIframe.parentNode;

  const iframe = document.createElement("iframe");
  iframe.src = "about:blank";
  iframe.width = width;
  iframe.height = height;
  if (maxWidth >= width) {
    iframe.style.transform = "";
    iframeWrapper.style.height = "";
  } else {
    iframe.style.transform = `scale(${maxWidth / width})`;
    iframeWrapper.style.height = `${height * (maxWidth / width)}px`;
  }
  iframeWrapper.replaceChild(iframe, oldIframe);

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
      <script type="module">
      import { watchForEmbedLoaded } from "./measurement.js";
      (async () => {
        const data = await watchForEmbedLoaded(document.querySelector('div'));
        parent.postMessage(data);
        console.info(window.location.href)
      })();
      </script>
    </body>
    </html>
  `;

  return new Promise((resolve, reject) => {
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

    setTimeout(reject, 10000);
  });
}