// import * as pdfjsLib from "../example/node_modules/pdfjs-dist/build/pdf.js"

import * as pdfjsLib from "../pdfjs-dist/build/pdf.js"

import * as pkg from "./package.json"

export { pdfCommandReceiver }

// put this into a var so that parcel won't automatically mangle it,
// like it would if it was a direct argument of Worker.
// with this method you have to manually place pdf.worker.js into dist.
var meh ="./pdf.worker.js";
pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(meh);

class PdfElement extends HTMLElement {
  connectedCallback() {

    var name = this.getAttribute("name");
    var page = parseInt(this.getAttribute("page"));
    var scale = parseFloat(this.getAttribute("scale"));
    if (!scale) {
      scale = 1.0;
    }
    var width = parseFloat(this.getAttribute("width"));
    var height = parseFloat(this.getAttribute("height"));

    var pdf = myPdfs[name];
    if (pdf) {
      if (width) {
        this.canvas.width = width;
      } else if (pdf.prevWidth) {
        this.canvas.width = pdf.prevWidth;
      }

      if (height) {
        this.canvas.height = height;
      } else if (pdf.prevHeight) {
        this.canvas.height = pdf.prevHeight;
      }
      renderPdf(pdf, this.canvas, page, scale, width, height);
    }
  }

  constructor() {
    super();
    var shadow = this.attachShadow({mode:'open'});
    this.canvas = document.createElement('canvas');
    shadow.appendChild(this.canvas);
  }
}

customElements.define('pdf-element', PdfElement );

function renderPdf (pdfs, canvas, pageno, scale, width, height) {
  var pdf = pdfs.pdf;
  pdf.getPage(pageno).then(function(page) {
   
    var viewport = page.getViewport({scale: scale});

    if (width && height) {
      var wscale = width / viewport.width;
      var hscale = height / viewport.height;
      var newscale;
      // go with the smaller of the two scale factors
      if (wscale < hscale) {
        newscale = wscale * scale;
      }
      else {
        newscale = hscale * scale;
      }
      // replace the initial scale with the newone.
      scale = newscale;
      // get another viewport, as just setting the scale doesn't affect it.
      viewport = page.getViewport({scale: newscale});
      // however, setting the width and height are effective.
      viewport.width = width;
      viewport.height = height;
    }
    else if (width) {
      var wscale = width / viewport.width;
      scale = wscale * scale;
      height = wscale * viewport.height;
      // get another viewport, as just setting the scale doesn't affect it.
      viewport = page.getViewport({scale: scale});
      viewport.width = width;
      viewport.height = height;
    }
    else if (height) {
      var hscale = height / viewport.height;
      scale = hscale * scale;
      width = hscale * viewport.width;
      // get another viewport, as just setting the scale doesn't affect it.
      viewport = page.getViewport({scale: scale});
      viewport.width = width;
      viewport.height = height;
    }

    // straight from the mozilla pdf viewer, its this trick
    // for getting non-blurry pdfs.
    let context = canvas.getContext('2d', { alpha: false, });
    let outputScale = getOutputScale(context);

    canvas.width = (viewport.width * outputScale.sx) | 0;
    canvas.height = (viewport.height * outputScale.sy) | 0;
    canvas.style.height = viewport.height + 'px';
    canvas.style.width = viewport.width + 'px';

    context.scale(outputScale.sx, outputScale.sy);

    // here's where we mutate our argument!
    // storing the size to make it less blinky when changing pages.
    pdfs.prevHeight = viewport.height;
    pdfs.prevWidth = viewport.width;

    // Render PDF page into canvas context
    var renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    var renderTask = page.render(renderContext);
    renderTask.promise.then(function () {
      // send back a 'render complete' msg?
    });
  });
}

var myPdfs = {};

function pdfCommandReceiver(elmApp) {
  return function (cmd) {
    if (cmd.version != pkg.version) {
      // version error!
      elmApp.ports.receivePdfMsg.send(
        { msg: "error"
        , name : cmd.name
        , error : "pdf-element package version doesn't match!"
        });
    } else if (cmd.cmd == "openurl")
    {
      // Asynchronous download of PDF
      pdfjsLib.getDocument(cmd.url).promise.then(function(pdf) {
        myPdfs[cmd.name] = { pdf: pdf };

        elmApp.ports.receivePdfMsg.send({ msg: "loaded"
                                      , name : cmd.name
                                      , pageCount : pdf.numPages
                                      } );

      }, function (reason) {
        // PDF loading error
        elmApp.ports.receivePdfMsg.send({ msg: "error"
                                      , name : cmd.name
                                      , error : reason
                                      } );
        console.error(reason);
      })
    } else if (cmd.cmd == "openstring")
    {
      // convert the base64 string to arraybytes.
      // var buff = new ArrayBuffer(atob(cmd.string));
      var buff =  Uint8Array.from(atob(cmd.string), c => c.charCodeAt(0));
      // Asynchronous download of PDF
      pdfjsLib.getDocument(buff).promise.then(function(pdf) {
        // At this point store 'pdf' into an array?
        myPdfs[cmd.name] = { pdf: pdf };

        elmApp.ports.receivePdfMsg.send({ msg: "loaded"
                                      , name : cmd.name
                                      , pageCount : pdf.numPages
                                      } );

      }, function (reason) {
        // PDF loading error
        elmApp.ports.receivePdfMsg.send({ msg: "error"
                                      , name : cmd.name
                                      , error : reason
                                      } );
        console.error(reason);
      })
    }
    else if (cmd.cmd == "close")
    {
      // myPdfs[cmd.name].close();
      delete myPdfs[cmd.name];
    }
    else
    {
        // unknown command  
        elmApp.ports.receivePdfMsg.send({ msg: "error"
                                      , name : cmd.name
                                      , error : ("invalid command to pdf-element: " + cmd.cmd)
                                      } );
        console.error(reason);
    }
  }
}


function getOutputScale(ctx) {
  let devicePixelRatio = window.devicePixelRatio || 1;
  let backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
                          ctx.mozBackingStorePixelRatio ||
                          ctx.msBackingStorePixelRatio ||
                          ctx.oBackingStorePixelRatio ||
                          ctx.backingStorePixelRatio || 1;
  let pixelRatio = devicePixelRatio / backingStoreRatio;
  return {
    sx: pixelRatio,
    sy: pixelRatio,
    scaled: pixelRatio !== 1,
  };
}

