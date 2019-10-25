// --------------------------------------------------------
// init elm
// --------------------------------------------------------
import { Elm } from './elm/src/Main.elm'

import * as pdfe from  "./pdfelement.js";

var app = Elm.Main.init({
  node: document.querySelector('main')
});

console.log("pdfe: ", pdfe);


var spc = pdfe.pdfCommandReceiver(app);

app.ports.sendPdfCommand.subscribe(spc);
