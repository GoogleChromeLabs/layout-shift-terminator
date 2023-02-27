/*
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { default as viewportSizes } from "./viewports.mjs";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  const run = async () => {
    document.getElementById("calculation").hidden = true;
    document.getElementById("termination").hidden = true;
    const markup = document.getElementById("markup").value;
    const results = await calculate({ markup });
    await terminate({ markup, results });
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  form.querySelector("button[type=submit]").disabled = false;

  for (const demoButton of document.querySelectorAll("#demos button")) {
    demoButton.addEventListener("click", () => {
      let markup = demoButton.querySelector("template").innerHTML;
      const leadingWhitespaceMatches = markup.match(/^\s+/);
      if (leadingWhitespaceMatches) {
        markup = markup.replaceAll(leadingWhitespaceMatches[0], "\n");
      }
      document.getElementById("markup").value = markup.trim();
      run();
    });
  }

  document.getElementById("reload-preview").addEventListener("click", () => {
    renderOptimizedPreview(document.getElementById("optimized-markup").value);
  });

  const query = new URLSearchParams(window.location.search.substr(1));
  if (query.has("autorun")) {
    run();
  }
});

async function calculate({ markup }) {
  const calculationSection = document.getElementById("calculation");
  calculationSection.hidden = false;
  calculationSection.scrollIntoView();

  const currentViewportWidthSpan = document.getElementById(
    "current-viewport-width"
  );
  const currentViewportHeightSpan = document.getElementById(
    "current-viewport-height"
  );

  const maxWidth = calculationSection.offsetWidth;

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
      ...viewportSize,
    });

    results.push({
      ...data,
      viewportSize,
    });

    i++;
  }
  calculationSection.hidden = true;

  return results;
}

async function terminate({ markup, results }) {
  const terminationSection = document.getElementById("termination");
  terminationSection.hidden = false;

  // Make sure the results are sorted by viewport width in descending order.
  results.sort((a, b) => {
    return b.viewportSize.width - a.viewportSize.width;
  });

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
  const containerId = `layout-shift-termination-${Math.random()}`.replace(
    ".",
    "-"
  );

  let styleTag = "<style class='layout-shift-termination'>";
  styleTag += `\n@supports (contain: inline-size) {`;
  styleTag += `\n#${containerId} { container-type: inline-size; }`;
  styleTag += `\n#${containerId} > .layout-shift-terminated { min-height:${results[0].height}px; }`;
  for (const result of results.slice(1)) {
    styleTag += `\n@container ( max-width: ${result.viewportSize.width}px ) { #${containerId} > .layout-shift-terminated { min-height:${result.height}px; } }`;
  }
  styleTag += "\n}";
  styleTag += "\n</style>";

  const terminateLayoutShift = function (root) {
    setTimeout(function () {
      [].map.call(root.querySelectorAll(".layout-shift-termination"), (el) =>
        el.remove()
      );
    }, 4000);
  };

  let scriptTag = `<script class='layout-shift-termination' async>`;
  scriptTag += `(${terminateLayoutShift.toString()})(document.getElementById(${JSON.stringify(
    containerId
  )}))`;
  scriptTag += `</script>`;

  const optimizedMarkup = `<div id="${containerId}">\n${styleTag}\n${scriptTag}\n<div class="layout-shift-terminated">${markup}</div>\n</div>`;
  optimizedMarkupTextarea.value = optimizedMarkup;
  optimizedMarkupTextarea.select();

  const optimizedPreview = document.getElementById("optimized-preview");
  optimizedPreview.height =
    Math.max(...results.map((result) => result.height)) + 100;

  renderOptimizedPreview(optimizedMarkup);
}

function renderOptimizedPreview(previewMarkup) {
  // Replace the old iframe because document.write() does not reset global variables.
  const oldIframe = document.getElementById("optimized-preview");
  const iframe = oldIframe.cloneNode();
  oldIframe.parentNode.replaceChild(iframe, oldIframe);

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
      <hr>
      <script type="module">
      import { watchForEmbedLoaded } from "./measurement.mjs";
      (async () => {
        const data = await watchForEmbedLoaded(document.querySelector('div'));
        parent.postMessage(data);
      })();
      </script>
    </body>
    </html>
  `;

  return new Promise((resolve, reject) => {
    window.addEventListener(
      "message",
      (event) => {
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
