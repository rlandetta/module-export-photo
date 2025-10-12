import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import sharp from 'sharp';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre'
];

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/oauth2callback';
const SESSION_SECRET = process.env.SESSION_SECRET || 'module-export-photo-secret';

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive'
];

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      sameSite: 'lax'
    }
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '..', 'public')));

function buildOAuthClient(req) {
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  if (req.session.tokens) {
    oauth2Client.setCredentials(req.session.tokens);
  }
  oauth2Client.on('tokens', (tokens) => {
    if (!req.session.tokens) {
      req.session.tokens = tokens;
    } else {
      req.session.tokens = { ...req.session.tokens, ...tokens };
    }
  });
  return oauth2Client;
}

function ensureOAuthConfigured() {
  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    const error = new Error('Google OAuth environment variables are missing.');
    error.statusCode = 500;
    throw error;
  }
}

app.get('/api/oauth-status', (req, res) => {
  res.json({ authenticated: Boolean(req.session.tokens) });
});

app.get('/api/oauth-url', (req, res, next) => {
  try {
    ensureOAuthConfigured();
    const oauth2Client = buildOAuthClient(req);
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GOOGLE_SCOPES,
      prompt: 'consent'
    });
    res.json({ url });
  } catch (error) {
    next(error);
  }
});

app.get('/oauth2callback', async (req, res, next) => {
  try {
    ensureOAuthConfigured();
    const { code } = req.query;
    if (!code) {
      return res.status(400).send('Missing authorization code.');
    }
    const oauth2Client = buildOAuthClient(req);
    const { tokens } = await oauth2Client.getToken(code);
    req.session.tokens = tokens;
    res.send(`<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Autorización completada</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 0; padding: 2rem; background: #111827; color: #f9fafb; }
      main { max-width: 32rem; margin: 0 auto; text-align: center; }
      h1 { font-size: 1.5rem; margin-bottom: 1rem; }
      p { line-height: 1.5; }
      button { margin-top: 2rem; background: #2563eb; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 9999px; font-size: 1rem; cursor: pointer; }
      button:hover { background: #1d4ed8; }
    </style>
  </head>
  <body>
    <main>
      <h1>¡Listo!</h1>
      <p>La sesión con Google Drive se estableció correctamente. Puede cerrar esta ventana y volver al módulo de exportación.</p>
      <button type="button" onclick="window.close()">Cerrar ventana</button>
    </main>
  </body>
</html>`);
  } catch (error) {
    next(error);
  }
});

app.post('/api/logout', (req, res) => {
  req.session.tokens = null;
  res.json({ success: true });
});

function sanitizeFileName(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\-_. ]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function formatEventDate(value) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  return `${day} de ${MONTHS[month]} de ${year}`;
}

function escapeHtml(value = '') {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildExportFileBase(metadata) {
  const parts = [metadata.coverageTitle, metadata.location]
    .map((value) => (value || '').trim())
    .filter(Boolean);
  const base = parts.length ? parts.join(' ') : 'Exportacion Fotos';
  const upper = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
  return sanitizeFileName(upper);
}

function buildHtmlDocument(metadata, entries) {
  const coverageTitle = (metadata.coverageTitle || 'Exportación de fotografías').toUpperCase();
  const metaParts = [];
  if (metadata.agency) metaParts.push(`Agencia: ${escapeHtml(metadata.agency)}`);
  if (metadata.photographer) metaParts.push(`Fotógrafo/a: ${escapeHtml(metadata.photographer)}`);
  if (metadata.editorInitials) metaParts.push(`Editor/a: ${escapeHtml(metadata.editorInitials)}`);
  const formattedEventDate = formatEventDate(metadata.eventDate);
  if (formattedEventDate) metaParts.push(`Fecha de cobertura: ${escapeHtml(formattedEventDate)}`);

  const entriesHtml = entries
    .map(
      (entry) => {
        const captionHtml = escapeHtml(entry.caption || '').replace(/\n/g, '<br />');
        return `      <article class="entry">
        <div class="entry__thumbnail">
          <img src="data:${entry.thumbnailMimeType};base64,${entry.thumbnailBase64}" alt="${escapeHtml(
            entry.displayName
          )}" />
        </div>
        <div class="entry__body">
          <h3>${escapeHtml(entry.displayName)}</h3>
          <p>${captionHtml}</p>
        </div>
      </article>`;
      }
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(coverageTitle)}</title>
    <style>
      body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; color: #111827; margin: 0; padding: 2.5rem; }
      h1 { font-size: 2rem; margin-bottom: 0.5rem; letter-spacing: 0.08em; }
      .meta { margin-bottom: 2rem; color: #4b5563; }
      .entries { display: flex; flex-direction: column; gap: 1.5rem; }
      .entry { background: #ffffff; border-radius: 1rem; display: flex; gap: 1.25rem; padding: 1rem; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.12); }
      .entry__thumbnail { width: 180px; flex-shrink: 0; }
      .entry__thumbnail img { width: 100%; border-radius: 0.75rem; object-fit: cover; display: block; }
      .entry__body { display: flex; flex-direction: column; justify-content: center; gap: 0.75rem; }
      .entry__body h3 { font-size: 1.1rem; margin: 0; color: #111827; }
      .entry__body p { margin: 0; line-height: 1.5; white-space: pre-wrap; }
      footer { margin-top: 2.5rem; color: #6b7280; font-size: 0.9rem; }
    </style>
  </head>
  <body>
    <header>
      <h1>${escapeHtml(coverageTitle)}</h1>
      <div class="meta">${metaParts.length ? metaParts.join(' · ') : '—'}</div>
    </header>
    <section class="entries">
${entriesHtml}
    </section>
    <footer>
      <p>Documento generado automáticamente por el módulo de exportación.</p>
    </footer>
  </body>
</html>`;
}

function buildWordDocument(metadata, entries) {
  const coverageTitle = (metadata.coverageTitle || 'Exportación de fotografías').toUpperCase();
  const formattedEventDate = formatEventDate(metadata.eventDate);
  const metaParts = [
    metadata.agency ? `Agencia: ${escapeHtml(metadata.agency)}` : null,
    metadata.photographer ? `Fotógrafo/a: ${escapeHtml(metadata.photographer)}` : null,
    metadata.editorInitials ? `Editor/a: ${escapeHtml(metadata.editorInitials)}` : null,
    formattedEventDate ? `Fecha de cobertura: ${escapeHtml(formattedEventDate)}` : null
  ]
    .filter(Boolean)
    .join('<br />');

  const entriesHtml = entries
    .map((entry, index) => {
      const captionHtml = escapeHtml(entry.caption || '').replace(/\n/g, '<br />');
      const thumbnail = `data:${entry.thumbnailMimeType};base64,${entry.thumbnailBase64}`;
      return `      <article class="entry">
        <div class="entry__index">${index + 1}.</div>
        <div class="entry__thumbnail"><img src="${thumbnail}" alt="${escapeHtml(entry.displayName)}" /></div>
        <div class="entry__body">
          <h3>${escapeHtml(entry.displayName)}</h3>
          <p>${captionHtml}</p>
        </div>
      </article>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(coverageTitle)}</title>
    <style>
      body { font-family: 'Calibri', Arial, sans-serif; color: #111; margin: 0; padding: 40px; }
      h1 { text-transform: uppercase; letter-spacing: 0.08em; font-size: 26px; margin-bottom: 6px; }
      .meta { margin-bottom: 20px; color: #444; font-size: 12px; }
      .entry { display: flex; gap: 12px; margin-bottom: 20px; }
      .entry__index { font-weight: 700; font-size: 16px; margin-top: 4px; }
      .entry__thumbnail img { width: 140px; height: auto; border-radius: 6px; }
      .entry__body { font-size: 13px; line-height: 1.48; }
      .entry__body h3 { margin: 0 0 6px; font-size: 14px; color: #0f172a; }
      .entry__body p { margin: 0; white-space: pre-wrap; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(coverageTitle)}</h1>
    <div class="meta">${metaParts || '—'}</div>
${entriesHtml}
  </body>
</html>`;
}

async function uploadFileToDrive(drive, folderId, fileBuffer, metadata) {
  const media = {
    mimeType: metadata.mimeType,
    body: Readable.from(fileBuffer)
  };
  const fileMetadata = {
    name: metadata.name,
    parents: [folderId]
  };
  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, webViewLink'
  });
  return response.data;
}

app.post('/api/export', upload.array('images'), async (req, res, next) => {
  try {
    if (!req.session.tokens) {
      return res.status(401).json({ error: 'Debe autenticarse con Google Drive antes de exportar.' });
    }

    const metadataRaw = req.body.metadata;
    if (!metadataRaw) {
      return res.status(400).json({ error: 'Falta la información de exportación.' });
    }

    const metadata = JSON.parse(metadataRaw);
    const files = req.files || [];

    if (!Array.isArray(metadata.entries) || metadata.entries.length === 0) {
      return res.status(400).json({ error: 'No se recibieron fotos para exportar.' });
    }

    if (metadata.entries.length !== files.length) {
      return res.status(400).json({ error: 'La cantidad de archivos y metadatos no coincide.' });
    }

    const exportOptions = {
      html: metadata.exportOptions?.html !== false,
      word: Boolean(metadata.exportOptions?.word)
    };

    if (!exportOptions.html && !exportOptions.word) {
      return res.status(400).json({ error: 'Selecciona al menos un formato para exportar.' });
    }

    metadata.exportOptions = exportOptions;

    ensureOAuthConfigured();
    const oauth2Client = buildOAuthClient(req);
    oauth2Client.setCredentials(req.session.tokens);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const folderNameParts = [metadata.coverageTitle || 'Cobertura'];
    if (metadata.eventDate) {
      folderNameParts.push(metadata.eventDate);
    }
    const folderName = sanitizeFileName(folderNameParts.join(' ')) || `Cobertura-${Date.now()}`;

    const { data: folder } = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
      },
      fields: 'id, webViewLink'
    });

    const processedEntries = [];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const entry = metadata.entries[index];

      const thumbnail = await sharp(file.buffer)
        .resize({ width: 480, height: 320, fit: 'inside' })
        .jpeg({ quality: 80 })
        .toBuffer();

      const uploadedFile = await uploadFileToDrive(drive, folder.id, file.buffer, {
        name: entry.displayName || file.originalname,
        mimeType: file.mimetype || 'image/jpeg'
      });

      processedEntries.push({
        ...entry,
        googleFileId: uploadedFile.id,
        thumbnailMimeType: 'image/jpeg',
        thumbnailBase64: thumbnail.toString('base64')
      });
    }

    const generatedFiles = [];
    let htmlDocument = null;
    let wordDocument = null;
    const exportFileBase = buildExportFileBase(metadata);

    if (exportOptions.html) {
      htmlDocument = buildHtmlDocument(metadata, processedEntries);
      const htmlFileName = `${exportFileBase}.html`;
      await uploadFileToDrive(drive, folder.id, Buffer.from(htmlDocument, 'utf8'), {
        name: htmlFileName,
        mimeType: 'text/html'
      });
      generatedFiles.push(htmlFileName);
    }

    if (exportOptions.word) {
      wordDocument = buildWordDocument(metadata, processedEntries);
      const wordFileName = `${exportFileBase}.doc`;
      await uploadFileToDrive(drive, folder.id, Buffer.from(wordDocument, 'utf8'), {
        name: wordFileName,
        mimeType: 'application/msword'
      });
      generatedFiles.push(wordFileName);
    }

    await drive.permissions.create({
      fileId: folder.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    const { data: folderInfo } = await drive.files.get({
      fileId: folder.id,
      fields: 'id, webViewLink, webContentLink'
    });

    req.session.tokens = oauth2Client.credentials;

    res.json({
      success: true,
      folderId: folder.id,
      shareableLink: folderInfo.webViewLink,
      exportFiles: generatedFiles,
      exportFileName: generatedFiles[0] || null,
      exportHtml: htmlDocument,
      exportWord: wordDocument,
      entries: processedEntries
    });
  } catch (error) {
    next(error);
  }
});

app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  res.status(status).json({ error: message });
});

const port = process.env.PORT || 5173;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Servidor iniciado en http://localhost:${port}`);
});
