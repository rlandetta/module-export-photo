import { createWriteStream } from 'node:fs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import archiver from 'archiver';

const DIST_DIR = path.resolve('dist');
const OUTPUT = path.join(DIST_DIR, 'module-preview.zip');
const PUBLIC_DIR = path.resolve('public');
const README_SNIPPET = `Instrucciones rápidas\n=====================\n\n1. Extrae el contenido del ZIP.\n2. Abre public/index.html en tu navegador.\n3. El flujo de Google Drive no estará disponible sin el backend Node.js.\n`;

async function ensureDirectories() {
  await fs.mkdir(DIST_DIR, { recursive: true });
}

async function removeOldArchive() {
  try {
    await fs.unlink(OUTPUT);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

async function verifySource() {
  try {
    const stats = await fs.stat(PUBLIC_DIR);
    if (!stats.isDirectory()) {
      throw new Error('La carpeta public no existe o no es un directorio.');
    }
  } catch (error) {
    throw new Error(`No se encontró la carpeta public. Detalle: ${error.message}`);
  }
}

async function createArchive() {
  const output = createWriteStream(OUTPUT);
  const archive = archiver('zip', { zlib: { level: 9 } });

  const closePromise = new Promise((resolve, reject) => {
    output.on('close', resolve);
    output.on('error', reject);
  });

  archive.pipe(output);

  archive.directory(PUBLIC_DIR, 'public');
  archive.append(README_SNIPPET, { name: 'LEEME.txt' });

  await archive.finalize();
  await closePromise;
}

async function main() {
  await verifySource();
  await ensureDirectories();
  await removeOldArchive();
  await createArchive();
  console.log(`Vista previa generada en ${OUTPUT}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
