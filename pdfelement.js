import * as pdfjsLib from "./node_modules/pdfjs-dist/build/pdf.js"

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
      console.log("herre");
      var wscale = width / viewport.width;
      var hscale = height / viewport.height;
      console.log("wscale, hscale: ", wscale, hscale);
      // var newscale;
      if (wscale < hscale) {
        console.log("wscale: ", scale, wscale, wscale * scale);
        viewport.scale = wscale * scale;
      }
      else {
        console.log("hscale: ", scale, hscale, hscale * scale);
        viewport.scale = hscale * scale;
      }
      viewport.width = width;
      viewport.height = height;
      console.log("scale: ", viewport.scale);
    }
    else if (width) {
      var wscale = width / viewport.width;
      scale = wscale * scale;
      viewport.width = width;
      viewport.height = viewport.height * wscale;
    }
    else if (height) {
      viewport.height = height;
    }

    // Prepare canvas using PDF page dimensions
    var context = canvas.getContext('2d');
    console.log("viewport: " + viewport.width + " " + viewport.height);
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // here's where we mutate our argument!
    pdfs.prevHeight = viewport.height;
    pdfs.prevWidth = viewport.width;

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
        myPdfs[cmd.name] = { pdf: pdf };

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
  }
}

