// index.js

import { Elm } from './elm/src/Main.elm'

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

var pdfjsLib = require("./pdfjs/build/pdf.js");

// workerSrc ends up with a 'fake' worker I think.
// pdfjsLib.GlobalWorkerOptions.workerSrc ="/pdfjs/pdf.worker.js";

// put this into a var so that parcel won't automatically mangle it,
// like it would if it was a direct argument of Worker.
var meh ="/pdfjs/pdf.worker.js";
pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(meh);

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


Elm.Main.init({
  node: document.querySelector('main')
});

