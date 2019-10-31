import * as pdfjsLib from "./node_modules/pdfjs-dist/build/pdf.js"

export { pdfCommandReceiver }

// put this into a var so that parcel won't automatically mangle it,
// like it would if it was a direct argument of Worker.
// with this method you have to manually place pdf.worker.js into dist.
var meh ="./pdf.worker.js";
pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(meh);

class PdfElement extends HTMLElement {
  connectedCallback() {
    var pdfName = this.getAttribute("name");
    var pdfPage = parseInt(this.getAttribute("page"));
    var pdfScale = parseFloat(this.getAttribute("scale"));
    var pdf = myPdfs[pdfName];
    if (pdf) {
      renderPdf(pdf, this.canvas, pdfPage, pdfScale);
    }
  }

  constructor() {
    super();
    var shadow = this.attachShadow({mode:'open'});
    this.canvas = document.createElement('canvas');
    if (prevWidth) {
      this.canvas.width = prevWidth;
    }
    if (prevHeight) {
      this.canvas.height = prevHeight;
    }
    shadow.appendChild(this.canvas);
  }
}

var prevWidth;
var prevHeight;

customElements.define('pdf-element', PdfElement );

function renderPdf (pdf, canvas, pageno, scale) {
  pdf.getPage(pageno).then(function(page) {
   
    var viewport = page.getViewport({scale: scale});

    // Prepare canvas using PDF page dimensions
    var context = canvas.getContext('2d');
    console.log("viewport: " + viewport.width + " " + viewport.height);
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    prevHeight = viewport.height;
    prevWidth = viewport.width;
    // Render PDF page into canvas context
    var renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    var renderTask = page.render(renderContext);
    renderTask.promise.then(function () {
      // console.log('renderPDF page rendered');
    });
  });
}

var myPdfs = {};

function pdfCommandReceiver(elmApp) {
  return function (cmd) {
    if (cmd.cmd == "openurl")
    {
      // Asynchronous download of PDF
      pdfjsLib.getDocument(cmd.url).promise.then(function(pdf) {
        myPdfs[cmd.name] = pdf;

        elmApp.ports.receivePdfMsg.send({ msg: "loaded"
                                      , name : cmd.name
                                      } );

      }, function (reason) {
        // PDF loading error
        elmApp.ports.receivePdfMsg.send({ msg: "error"
                                      , name : cmd.name
                                      , error : error
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
        myPdfs[cmd.name] = pdf;

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
  }
}

