wget https://github.com/mozilla/pdf.js/releases/download/v2.2.228/pdfjs-2.2.228-dist.zip
unzip pdfjs-2.2.228-dist.zip -d pdfjs
mkdir -p dist/pdfjs
cp pdfjs/build/pdf.worker.js dist/pdfjs/