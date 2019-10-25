// index.js

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

function testCanvas(ctx) {
    // --------------------------------
    // Set line width
    ctx.lineWidth = 10;

    // Wall
    ctx.strokeRect(75, 140, 150, 110);

    // Door
    ctx.fillRect(130, 190, 40, 60);

    // Roof
    ctx.moveTo(50, 140);
    ctx.lineTo(150, 60);
    ctx.lineTo(250, 140);
    ctx.closePath();
    ctx.stroke();
}

class PdfElement extends HTMLElement {
// class PdfElement extends HTMLCanvasElement {
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

// If absolute URL from the remote server is provided, configure the CORS
// header on that server.
var url = 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf';

// Mozilla's comment.
// Loaded via <script> tag, create shortcut to access PDF.js exports.
// var pdfjsLib = window['pdfjs-dist/build/pdf'];
// ^ can't get this to work with parcel

// whats in the window?
// for( var key in window ) {
//   console.log("key,type", key, typeof(window[key]));
// }

// var pdfjsLib = require("./pdfjs/build/pdf.js");

import * as pdfjsLib from "./pdfjs/build/pdf.js"

// workerSrc ends up with a 'fake' worker I think.
// pdfjsLib.GlobalWorkerOptions.workerSrc ="/pdfjs/pdf.worker.js";

// put this into a var so that parcel won't automatically mangle it,
// like it would if it was a direct argument of Worker.
// with this method you have to manually place pdf.worker.js into dist.
var meh ="/pdfjs/pdf.worker.js";
pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(meh);


var myPdf = null;

// Asynchronous download of PDF
var loadingTask = pdfjsLib.getDocument(url);
loadingTask.promise.then(function(pdf) {
  console.log('PDF loaded');

  // At this point store 'pdf' into an array?
  myPdf = pdf;
  
  // Fetch the first page
  renderMyPdf();
}, function (reason) {
  // PDF loading error
  console.error(reason);
});

function renderMyPdf () {
  myPdf.getPage(1).then(function(page) {
    console.log('Page loaded');
    
    var scale = 3.5;
    var viewport = page.getViewport({scale: scale});

    // Prepare canvas using PDF page dimensions
    var canvas = document.getElementById('elm-canvas');
    var context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // testCanvas(context);

    // Render PDF page into canvas context
    var renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    var renderTask = page.render(renderContext);
    renderTask.promise.then(function () {
      console.log('Page rendered');
    });
  });
}

// --------------------------------------------------------
// init elm
// --------------------------------------------------------
import { Elm } from './elm/src/Main.elm'

var app = Elm.Main.init({
  node: document.querySelector('main')
});

app.ports.render.subscribe(renderMyPdf);
app.ports.sendPdfCommand.subscribe(sendPdfCommand);
