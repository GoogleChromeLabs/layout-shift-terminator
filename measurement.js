
export function watchForEmbedLoaded(container) {
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

    // Warning: the embed may be wise enough to implement lazy-loading.
    
    // TODO: Consider using ResizeObserver.
//     const resizeObserver = new ResizeObserver(
//       ( entries ) => {
        
//         for ( const entry of entries ) {
//           console.info(entry)
//           const iframe = container.querySelector('iframe');
//           if (iframe) {
//             console.info('offsetHeight', iframe.offsetHeight)
//           }
          
//           console.info(  entry.contentBoxSize, entry.contentRect.height )
//           if ( entry.contentRect.height > 0 ) {
//             //console.info(  entry.contentBoxSize, entry.contentRect )
            
//             // resolveWithResolution();
//             break;
//           }
          
          
//         }
//       }
//     );
//     resizeObserver.observe( container );
//     return;
    
    // Start listening for DOM changes, and stop once a 2.5-second pause is encountered.
    let resolveTimeoutId = 0;
    const mutationObserver = new MutationObserver(() => {
      clearTimeout(resolveTimeoutId);
      
      const complete = () => {
        mutationObserver.disconnect();
        resolveWithResolution();
      };
      
      // As a shortcut, complete as soon as am iframe with a non-zero height is encountered.
      // TODO: Sometimes the mutation seems to trigger before layout happens.
      const iframe = container.querySelector('iframe');
      if ( iframe ) {
          //setTimeout(() => {
            if ( iframe.offsetHeight > 0 ) {
               complete();
            }
          //}, 100)
      }
      
      resolveTimeoutId = setTimeout(complete, 2500);
    });
    mutationObserver.observe(container, {
      subtree: true,
      childList: true,
      attributes: true
    });
  });
}
