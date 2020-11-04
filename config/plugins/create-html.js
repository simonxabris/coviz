// @ts-check
import html from "@rollup/plugin-html";

export function createHtml() {
  return html({
    title: 'Coviz',
    template({ files, title }) {
      const scripts = files.js.filter(file => file.fileName.startsWith('sw') === false).reduce((scriptsString, chunk) => {
        scriptsString += `<script src="/${chunk.fileName}"></script>\n`;

        return scriptsString;
      }, '');

      const styles = files.css.reduce((styleStrings, chunk) => {
        styleStrings += `<link rel="stylesheet" href="/${chunk.fileName}" />\n`;

        return styleStrings;
      }, '')

      return `
<!DOCTYPE html>
<html>
  <head>
    <title>${title}</title>
    <link rel="stylesheet" href="/global.css"></link>
    ${styles}
    <style>
    html,
    body {
      margin: 0;
      padding: 0;
    }

    * {
      box-sizing: border-box;
    }
    </style>
  </head>
  <body>
    ${scripts}
  </body>
</html>
      `
    }
  })
}