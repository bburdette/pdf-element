# pdf-element example

building this relies on an egregious hack:

```
> cd ../npm/
> yarn
> cd -
> yarn
> parcel index.html
```

the yarn step gets the pdfjs-dist dependency, which is used by the 
parcel-plugin-static-files-copy parcel plugin.  The reason is that
the pdf.js worker needs to know load the worker.js script location, which 
ordinarily parcel scrambles.  Its all kind of a [mess](https://github.com/parcel-bundler/parcel/issues/670).  Anyway, hope it works
for you and let me know if you know a better way!

