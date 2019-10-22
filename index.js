// index.js

// import { Elm } from './elm/src/Main.elm'

// If absolute URL from the remote server is provided, configure the CORS
// header on that server.
var url = 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf';

// Mozilla's comment.
// Loaded via <script> tag, create shortcut to access PDF.js exports.
// var pdfjsLib = window['pdfjs-dist/build/pdf'];

// Qs:
// does this actually load anything?
// would window['blah'] work just as well (poorly)?
// This definitely doesn't seem to be working, "pdfjsLib not found" happens as
// soon as something tries to use the var.
// var pdfjsLib = window['dist/pdf.c25250cf'];

// for( var key in window ) {
//   console.log("key,type", key, typeof(window[key]));
// }

// var pdfjsLib = window.document.getElementById('pdfscript');

var pdfjsLib = require("./pdfjs/build/pdf.js");

// pdfjsLib.GlobalWorkerOptions.workerSrc ="/pdfjs/pdf.worker.js";
// put this into a var so that parcel won't automatically mangle it

var meh ="/pdfjs/pdf.worker.js";
pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(meh);

// var pdfjsLib = require("./node_modules/pdfjs-dist/build/pdf.js");

// var pdfjsLib = window.document.getElementById('pdfscript');

// console.log("pdfjsLib: ", pdfjsLib);

// The workerSrc property shall be specified.
// pdfjsLib.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.js';

// pdfjsLib.GlobalWorkerOptions.workerSrc = "./node_modules/pdfjs-dist/build/pdf.worker.js";

// pdfjsLib.GlobalWorkerOptions.workerSrc ="pdf-parcel.e31bb0bc.js";

// Asynchronous download of PDF
var loadingTask = pdfjsLib.getDocument(url);
loadingTask.promise.then(function(pdf) {
  console.log('PDF loaded');
  
  // Fetch the first page
  var pageNumber = 1;
  pdf.getPage(pageNumber).then(function(page) {
    console.log('Page loaded');
    
    var scale = 1.5;
    var viewport = page.getViewport({scale: scale});

    // Prepare canvas using PDF page dimensions
    var canvas = document.getElementById('the-canvas');
    var context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

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
}, function (reason) {
  // PDF loading error
  console.error(reason);
});


// Elm.Main.init({
//   node: document.querySelector('main')
// });

console.log('hello world');
