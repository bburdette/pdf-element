import * as pdfjsLib from "./pdfjs/build/pdf.js"

// workerSrc ends up with a 'fake' worker I think.
// pdfjsLib.GlobalWorkerOptions.workerSrc ="/pdfjs/pdf.worker.js";

// put this into a var so that parcel won't automatically mangle it,
// like it would if it was a direct argument of Worker.
// with this method you have to manually place pdf.worker.js into dist.
var meh ="/pdfjs/pdf.worker.js";
pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(meh);

class PdfElement extends HTMLElement {
  connectedCallback() {
    console.log("connectedCallback");
    var pdfName = this.getAttribute("name");
    console.log("pdfName", pdfName);
    var pdf = myPdfs[pdfName];
    if (pdf) {
      renderPdf(pdf, this.canvas);
    }
  }

  constructor() {
    super();
    console.log("pdfelement consgtructores");
    var shadow = this.attachShadow({mode:'open'});
    this.canvas = document.createElement('canvas');
    shadow.appendChild(this.canvas);
  }
}

customElements.define('pdf-element', PdfElement );

function renderPdf (pdf, canvas) {
  pdf.getPage(1).then(function(page) {
    console.log('rpfs Page loaded');
    
    var scale = 3.5;
    var viewport = page.getViewport({scale: scale});

    // Prepare canvas using PDF page dimensions
    // var canvas = document.getElementById('elm-canvas');
    var context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    console.log("viewpower w, h", viewport.width, viewport.height);

    // testCanvas(context);
    // Render PDF page into canvas context
    var renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    var renderTask = page.render(renderContext);
    renderTask.promise.then(function () {
      console.log('renderPDF page rendered');
    });
  });
}





var myPdfs = {};

function sendPdfCommand(cmd) {
  // console.log( "ssc: " +  JSON.stringify(cmd, null, 4));
  if (cmd.cmd == "open")
  {
    // Asynchronous download of PDF
    pdfjsLib.getDocument(cmd.url).promise.then(function(pdf) {
      console.log('PDF loaded 2');

      // At this point store 'pdf' into an array?
      myPdfs[cmd.name] = pdf;

      app.ports.receivePdfMsg.send({ msg: "loaded"
                                    , name : cmd.name
                                    } );

    }, function (reason) {
      // PDF loading error
      app.ports.receivePdfMsg.send({ msg: "error"
                                    , name : cmd.name
                                    , error : error
                                    } );
      console.error(reason);
    })
  }
  else if (cmd.cmd == "close")
  {
    // console.log("closing pdf: " + cmd.name);
    // myPdfs[cmd.name].close();
    delete myPdfs[cmd.name];
  }
}

// --------------------------------------------------------
// init elm
// --------------------------------------------------------
import { Elm } from './elm/src/Main.elm'

// import * as pdfe from  "./pdfelement.js";

var app = Elm.Main.init({
  node: document.querySelector('main')
});

app.ports.sendPdfCommand.subscribe(sendPdfCommand);
