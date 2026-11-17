const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function convertDirectory(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      convertDirectory(fullPath);
      continue;
    }

    if (!file.name.endsWith('.ts') && !file.name.endsWith('.tsx')) {
      continue;
    }

    if (file.name.endsWith('.d.ts')) {
      continue;
    }

    const source = fs.readFileSync(fullPath, 'utf8');

    const result = ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    });

    const newExtension = file.name.endsWith('.tsx') ? '.jsx' : '.js';
    const newPath = fullPath.replace(/\.(tsx|ts)$/, newExtension);

    fs.writeFileSync(newPath, result.outputText, 'utf8');

    console.log(`Converted: ${file.name} -> ${path.basename(newPath)}`);
  }
}

convertDirectory(srcDir);
console.log('Conversion completed!');