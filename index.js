// --------------------------------------------------------
// init elm
// --------------------------------------------------------
import { Elm } from './elm/src/Main.elm'

import * as pdfe from  "./pdfelement.js";

var app = Elm.Main.init({
  node: document.querySelector('main')
});

app.ports.sendPdfCommand.subscribe(pdfe.pdfCommandReceiver(app));
