# bburdette/pdf-element

This elm package has an associated 'pdf-element' npm package; together they provide a
custom element for rendering PDFs in elm, using mozilla's pdf.js library.  Using a tool like 
parcel (which is very nice) to build the project is pretty much a requirement as of now. 
There's a parcel project in the example folder. 

Pdf documents live in javascript; you open and close them using Elm Cmds.  If an open Cmd is 
successful, you should receive a Loaded msg in return; otherwise you'll get an Error.

When you open a pdf, you give it a name - just an arbitrary string.  You can use this name 
to make one or more custom elements that refer to the same document, with the pdfPage function.
Each custom element is identified by its document name, page number, and sizing.  Its up to you 
to close the pdf when you're done with it, with a Cmd.

[Documentation](http://package.elm-lang.org/packages/bburdette/pdf-element/latest)
