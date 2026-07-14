const fs = require('fs');
const path = require('path');

const esmDir = path.join(__dirname, '..', 'node_modules', 'zustand', 'esm');
if (fs.existsSync(esmDir)) {
  fs.readdirSync(esmDir).forEach(file => {
    if (file.endsWith('.js')) {
      const mjsFile = file.replace('.js', '.mjs');
      const mjsPath = path.join(esmDir, mjsFile);
      if (!fs.existsSync(mjsPath)) {
        fs.copyFileSync(path.join(esmDir, file), mjsPath);
      }
    }
  });
}
