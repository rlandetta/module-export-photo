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

const state = {
  coverageTitle: '',
  captionTemplate: '',
  includeDate: true,
  eventDate: '',
  location: '',
  agency: '',
  photographer: '',
  editorInitials: '',
  captionMode: 'same-day',
  images: [],
  activeImageId: null,
  lastExportHtml: null,
  lastExportWord: null,
  lastExportLink: null,
  exportOptions: {
    html: true,
    word: false
  }
};

const dom = {
  fileInput: document.querySelector('#file-input'),
  dropZone: document.querySelector('#drop-zone'),
  imageList: document.querySelector('#image-list'),
  imageTemplate: document.querySelector('#image-card-template'),
  previewTemplate: document.querySelector('#preview-card-template'),
  previewGrid: document.querySelector('#preview-grid'),
  previewEmpty: document.querySelector('#preview-empty'),
  previewTitle: document.querySelector('#preview-title'),
  previewMeta: document.querySelector('#preview-meta'),
  coverageTitle: document.querySelector('#coverage-title'),
  captionTemplate: document.querySelector('#caption-template'),
  includeDate: document.querySelector('#include-date'),
  eventDate: document.querySelector('#event-date'),
  location: document.querySelector('#location'),
  agency: document.querySelector('#agency'),
  photographer: document.querySelector('#photographer'),
  editorInitials: document.querySelector('#editor-initials'),
  imageEditor: document.querySelector('#image-editor'),
  editingLabel: document.querySelector('#editing-label'),
  displayName: document.querySelector('#display-name'),
  imageBody: document.querySelector('#image-body'),
  imageCaption: document.querySelector('#image-caption'),
  imageAuto: document.querySelector('#image-auto'),
  applyTemplate: document.querySelector('#apply-template'),
  saveImage: document.querySelector('#save-image'),
  modeTabs: document.querySelectorAll('.mode-tab'),
  modeHint: document.querySelector('#mode-hint'),
  optionHtml: document.querySelector('#option-html'),
  optionWord: document.querySelector('#option-word'),
  status: document.querySelector('#status'),
  exportResult: document.querySelector('#export-result'),
  exportButton: document.querySelector('#export-button'),
  downloadExport: document.querySelector('#download-export'),
  loginButton: document.querySelector('#login-button'),
  logoutButton: document.querySelector('#logout-button'),
  authState: document.querySelector('#auth-state')
};

let suppressEditorUpdates = false;

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatFileDate(file) {
  if (!file?.lastModified) return 'Fecha no disponible';
  const date = new Date(file.lastModified);
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

function formatDateSegmentsFromDate(date) {
  if (!date || Number.isNaN(date.getTime())) {
    return { code: '', short: '', long: '' };
  }
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  const code = `${String(year).slice(-2)}${String(month + 1).padStart(2, '0')}${String(day).padStart(2, '0')}`;
  const short = `${day} ${MONTHS[month]}, ${year}`;
  const long = `${day} de ${MONTHS[month]} de ${year}`;
  return { code, short, long };
}

function formatDateSegments(value) {
  if (!value) {
    return { code: '', short: '', long: '' };
  }
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return { code: '', short: '', long: '' };
  }
  return formatDateSegmentsFromDate(date);
}

function getTodaySegments() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return formatDateSegmentsFromDate(now);
}

function getImageById(id) {
  return state.images.find((image) => image.id === id);
}

function invalidateExports() {
  state.lastExportHtml = null;
  state.lastExportWord = null;
  state.lastExportLink = null;
}

function composeCaption(image) {
  const descriptionRaw = (image.captionBody || '').replace(/\s+/g, ' ').trim();
  const location = (state.location || '').trim();
  const agency = (state.agency || '').trim();
  const photographer = (state.photographer || '').trim();
  const editor = (state.editorInitials || '').trim();

  const credits = [];
  if (agency) credits.push(agency);
  if (photographer) credits.push(photographer);

  if (state.captionMode === 'previous-day') {
    const { code } = getTodaySegments();
    let caption = '';
    if (code) {
      caption = `(${code})`;
    }
    const agencyPart = agency ? `(${agency})` : '';
    let lead = '';
    if (location && agencyPart) {
      lead = `${location}, ${agencyPart}`;
    } else if (location || agencyPart) {
      lead = [location, agencyPart].filter(Boolean).join(' ');
    }
    if (lead) {
      caption += `${caption ? ' -- ' : ''}${lead}`;
    }
    if (descriptionRaw) {
      caption += `${caption ? ' -- ' : ''}${descriptionRaw}`;
      caption = caption.replace(/[\s.]*$/, '');
      caption += '.';
    }
    if (credits.length) {
      caption += ` (${credits.join('/')})`;
    }
    if (editor) {
      caption += ` (${editor})`;
    }
    return caption.replace(/\s+/g, ' ').trim();
  }

  const includeDate = state.includeDate && state.eventDate;
  const { code, short, long } = includeDate ? formatDateSegments(state.eventDate) : { code: '', short: '', long: '' };

  let caption = '';
  if (includeDate && code) {
    caption = `(${code})`;
  }

  const leadPieces = [];
  if (location) leadPieces.push(location);
  if (includeDate && short) leadPieces.push(short);
  const lead = leadPieces.join(' ');
  const agencyPart = agency ? `(${agency})` : '';

  if (lead || agencyPart) {
    const segment = [lead, agencyPart].filter(Boolean).join(' ');
    if (segment) {
      caption += `${caption ? ' -- ' : ''}${segment}`;
    }
  }

  if (descriptionRaw) {
    caption += `${caption ? ' -- ' : ''}${descriptionRaw}`;
  }

  if (includeDate && long) {
    caption = caption.replace(/[.,\s]*$/, '');
    caption += `, el ${long}.`;
  } else if (descriptionRaw && !/[.!?…]$/.test(descriptionRaw)) {
    caption += '.';
  }

  if (credits.length) {
    caption += ` (${credits.join('/')})`;
  }
  if (editor) {
    caption += ` (${editor})`;
  }

  return caption.replace(/\s+/g, ' ').trim();
}

function setStatus(message, type = 'info') {
  if (!message) {
    dom.status.hidden = true;
    dom.status.textContent = '';
    dom.status.classList.remove('error');
    return;
  }
  dom.status.hidden = false;
  dom.status.textContent = message;
  dom.status.classList.toggle('error', type === 'error');
}

function setExportResult(message, type = 'info') {
  if (!message) {
    dom.exportResult.hidden = true;
    dom.exportResult.textContent = '';
    dom.exportResult.classList.remove('error');
    return;
  }
  dom.exportResult.hidden = false;
  dom.exportResult.textContent = message;
  dom.exportResult.classList.toggle('error', type === 'error');
}

function refreshModeUI() {
  const sameDay = state.captionMode === 'same-day';
  dom.modeTabs.forEach((tab) => {
    const tabMode = tab.dataset.mode;
    const isActive = tabMode === state.captionMode;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  if (dom.modeHint) {
    dom.modeHint.textContent = sameDay
      ? 'Usa esta vista cuando la cobertura se realiza y entrega el mismo día. El formato incorpora el código YYMMDD, la ciudad, la fecha editorial y la agencia antes del caption.'
      : 'Selecciona esta vista cuando la foto se tomó antes del día de hoy. El código inicial usa la fecha actual del sistema y el bloque principal muestra ciudad, agencia y caption, seguido por los créditos editoriales.';
  }
  const includeContainer = dom.includeDate?.closest('.toggle');
  if (includeContainer) {
    includeContainer.classList.toggle('is-disabled', !sameDay);
  }
  if (dom.includeDate) {
    dom.includeDate.disabled = !sameDay;
  }
}

function setCaptionMode(mode) {
  if (!['same-day', 'previous-day'].includes(mode)) return;
  if (state.captionMode === mode) return;
  state.captionMode = mode;
  refreshModeUI();
  handleGlobalChange();
}

function refreshPreview() {
  const included = state.images.filter((image) => image.include);
  dom.previewGrid.innerHTML = '';
  const template = dom.previewTemplate.content;

  const coverageTitle = (state.coverageTitle || 'Exportación de fotografías').toUpperCase();
  dom.previewTitle.textContent = coverageTitle;
  const metaParts = [];
  if (state.agency) metaParts.push(`Agencia: ${state.agency}`);
  if (state.photographer) metaParts.push(`Fotógrafo/a: ${state.photographer}`);
  if (state.editorInitials) metaParts.push(`Editor/a: ${state.editorInitials}`);
  const eventDateFormatted = state.eventDate ? formatDateSegments(state.eventDate).long : '';
  if (eventDateFormatted) metaParts.push(`Fecha de cobertura: ${eventDateFormatted}`);
  metaParts.push(`Imágenes seleccionadas: ${included.length}/${state.images.length}`);
  dom.previewMeta.textContent = metaParts.join(' · ');

  if (!included.length) {
    dom.previewEmpty.classList.remove('hidden');
    return;
  }
  dom.previewEmpty.classList.add('hidden');

  included.forEach((image) => {
    const node = template.cloneNode(true);
    const img = node.querySelector('img');
    const name = node.querySelector('[data-role="name"]');
    const caption = node.querySelector('[data-role="caption"]');
    img.src = image.previewUrl;
    img.alt = image.displayName || image.file.name;
    name.textContent = image.displayName || image.file.name;
    caption.textContent = image.caption;
    dom.previewGrid.appendChild(node);
  });
}

function refreshImageList() {
  dom.imageList.innerHTML = '';
  const template = dom.imageTemplate.content;
  state.images.forEach((image) => {
    const node = template.cloneNode(true);
    const article = node.querySelector('.image-card');
    const img = node.querySelector('img');
    const name = node.querySelector('[data-role="name"]');
    const meta = node.querySelector('[data-role="meta"]');
    const include = node.querySelector('[data-role="include"]');
    const edit = node.querySelector('[data-role="edit"]');
    const save = node.querySelector('[data-role="save"]');
    const remove = node.querySelector('[data-role="remove"]');

    article.dataset.dirty = image.isDirty ? 'true' : 'false';
    img.src = image.previewUrl;
    img.alt = image.displayName || image.file.name;
    name.textContent = image.displayName || image.file.name;
    meta.textContent = `${formatFileSize(image.file.size)} · ${formatFileDate(image.file)}`;
    include.checked = image.include;

    include.addEventListener('change', () => {
      image.include = include.checked;
      invalidateExports();
      refreshPreview();
    });

    edit.addEventListener('click', () => {
      setActiveImage(image.id);
    });

    save.addEventListener('click', () => {
      setActiveImage(image.id);
      persistActiveImage();
      refreshImageList();
      refreshPreview();
    });

    remove.addEventListener('click', () => {
      removeImage(image.id);
    });

    if (state.activeImageId === image.id) {
      article.classList.add('active');
    } else {
      article.classList.remove('active');
    }

    dom.imageList.appendChild(node);
  });
}

function updateEditor() {
  const image = getImageById(state.activeImageId);
  if (!image) {
    dom.imageEditor.hidden = true;
    dom.editingLabel.textContent = 'Selecciona una foto para editar.';
    return;
  }

  dom.imageEditor.hidden = false;
  dom.editingLabel.textContent = `Editando: ${image.displayName || image.file.name}`;

  suppressEditorUpdates = true;
  dom.displayName.value = image.displayName || '';
  dom.imageBody.value = image.captionBody || '';
  dom.imageCaption.value = image.caption || '';
  dom.imageAuto.checked = image.autoCaption;
  suppressEditorUpdates = false;
}

function persistActiveImage() {
  const image = getImageById(state.activeImageId);
  if (!image) return;

  const newDisplayName = dom.displayName.value.trim();
  if (image.displayName !== newDisplayName) {
    image.displayName = newDisplayName;
  }

  const newBody = dom.imageBody.value.replace(/\r/g, '');
  if (image.captionBody !== newBody) {
    image.captionBody = newBody;
    image.usesGlobalTemplate = image.captionBody === state.captionTemplate;
  }

  const autoChecked = dom.imageAuto.checked;
  image.autoCaption = autoChecked;
  if (image.autoCaption) {
    image.caption = composeCaption(image);
    suppressEditorUpdates = true;
    dom.imageCaption.value = image.caption;
    suppressEditorUpdates = false;
  } else {
    image.caption = dom.imageCaption.value.replace(/\r/g, '');
  }

  image.isDirty = false;
  invalidateExports();
}

function setActiveImage(id) {
  if (state.activeImageId && state.activeImageId !== id) {
    persistActiveImage();
  }
  state.activeImageId = id;
  refreshImageList();
  updateEditor();
}

function removeImage(id) {
  const index = state.images.findIndex((image) => image.id === id);
  if (index === -1) return;
  const [image] = state.images.splice(index, 1);
  if (image.previewUrl) {
    URL.revokeObjectURL(image.previewUrl);
  }
  if (state.activeImageId === id) {
    state.activeImageId = null;
  }
  invalidateExports();
  refreshImageList();
  refreshPreview();
  updateEditor();
}

function updateAutoCaptions(options = {}) {
  const { propagateTemplate = false } = options;
  state.images.forEach((image) => {
    if (propagateTemplate && image.usesGlobalTemplate) {
      image.captionBody = state.captionTemplate;
    }
    if (image.autoCaption) {
      image.caption = composeCaption(image);
    }
  });
}

function handleGlobalChange(options = {}) {
  invalidateExports();
  updateAutoCaptions(options);
  refreshImageList();
  refreshPreview();
  updateEditor();
}

function hydrateStateFromInputs() {
  state.coverageTitle = dom.coverageTitle.value.trim();
  state.captionTemplate = dom.captionTemplate.value;
  state.includeDate = dom.includeDate.checked;
  state.eventDate = dom.eventDate.value;
  state.location = dom.location.value.trim();
  state.agency = dom.agency.value.trim();
  state.photographer = dom.photographer.value.trim();
  state.editorInitials = dom.editorInitials.value.trim();
}

function isSupportedImage(file) {
  if (file.type && file.type.startsWith('image/')) return true;
  const extension = file.name.split('.').pop()?.toLowerCase();
  const allowed = ['jpg', 'jpeg', 'png', 'heic', 'raw', 'nef', 'cr2', 'arw', 'dng', 'raf'];
  return extension ? allowed.includes(extension) : false;
}

async function addFiles(files) {
  const list = Array.from(files);
  if (!list.length) return;
  let skipped = 0;
  const previousCount = state.images.length;

  await Promise.all(
    list.map(async (file) => {
      if (!isSupportedImage(file)) {
        skipped += 1;
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      const id =
        window.crypto && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2, 10);
      const image = {
        id,
        file,
        previewUrl,
        include: true,
        displayName: file.name,
        captionBody: state.captionTemplate,
        caption: '',
        autoCaption: true,
        usesGlobalTemplate: true,
        isDirty: false
      };
      image.caption = composeCaption(image);
      state.images.push(image);
    })
  );

  refreshImageList();
  refreshPreview();
  if (!state.activeImageId && state.images.length) {
    setActiveImage(state.images[0].id);
  }

  const added = state.images.length - previousCount;
  if (skipped && !added) {
    setStatus(`Se omitieron ${skipped} archivo${skipped === 1 ? '' : 's'} que no son compatibles.`, 'error');
    return;
  }
  if (skipped && added) {
    setStatus(
      `${added === 1 ? '1 imagen agregada' : `${added} imágenes agregadas`} correctamente. ` +
        `Se omitieron ${skipped} archivo${skipped === 1 ? '' : 's'} que no son compatibles.`,
      'error'
    );
    return;
  }
  if (added) {
    setStatus(`${added === 1 ? 'Imagen agregada' : `${added} imágenes agregadas`} correctamente.`);
  }
}

async function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function createThumbnailDataUrl(file) {
  const dataUrl = await readAsDataURL(file);
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });

  const maxWidth = 480;
  const maxHeight = 320;
  let { width, height } = image;
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  width = Math.round(width * ratio);
  height = Math.round(height * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.85);
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function collectExportEntries() {
  const included = state.images.filter((image) => image.include);
  return Promise.all(
    included.map(async (image) => ({
      thumbnail: await createThumbnailDataUrl(image.file),
      displayName: image.displayName || image.file.name,
      caption: image.caption
    }))
  );
}

async function buildExportHtml() {
  const entries = await collectExportEntries();

  const coverageTitle = (state.coverageTitle || 'Exportación de fotografías').toUpperCase();
  const metaParts = [];
  if (state.agency) metaParts.push(`Agencia: ${state.agency}`);
  if (state.photographer) metaParts.push(`Fotógrafo/a: ${state.photographer}`);
  if (state.editorInitials) metaParts.push(`Editor/a: ${state.editorInitials}`);
  const coverageSegments = state.eventDate ? formatDateSegments(state.eventDate) : { long: '' };
  if (coverageSegments.long) metaParts.push(`Fecha de cobertura: ${coverageSegments.long}`);
  const headerMeta = metaParts.length ? metaParts.map((part) => escapeHtml(part)).join(' · ') : '—';

  const entriesHtml = entries
    .map(
      (entry) => `      <article class="entry">
        <div class="entry__thumbnail">
          <img src="${entry.thumbnail}" alt="${escapeHtml(entry.displayName)}" />
        </div>
        <div class="entry__body">
          <h3>${escapeHtml(entry.displayName)}</h3>
          <p>${escapeHtml(entry.caption).replace(/\n/g, '<br />')}</p>
        </div>
      </article>`
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
      .entry__body { display: flex; flex-direction: column; gap: 0.75rem; }
      .entry__body h3 { font-size: 1.1rem; margin: 0; color: #111827; }
      .entry__body p { margin: 0; line-height: 1.5; white-space: pre-wrap; }
      footer { margin-top: 2.5rem; color: #6b7280; font-size: 0.9rem; }
    </style>
  </head>
  <body>
    <header>
      <h1>${escapeHtml(coverageTitle)}</h1>
      <div class="meta">${headerMeta || '—'}</div>
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

async function buildExportWordDoc() {
  const included = state.images.filter((image) => image.include);
  const coverageTitle = (state.coverageTitle || 'Exportación de fotografías').toUpperCase();
  const segments = state.eventDate ? formatDateSegments(state.eventDate) : { long: '' };
  const headerLines = [
    coverageTitle,
    ''.padEnd(coverageTitle.length, '='),
    '',
    state.agency ? `Agencia: ${state.agency}` : null,
    state.photographer ? `Fotógrafo/a: ${state.photographer}` : null,
    state.editorInitials ? `Editor/a: ${state.editorInitials}` : null,
    segments.long ? `Fecha de cobertura: ${segments.long}` : null,
    ''.padEnd(coverageTitle.length, '='),
    ''
  ].filter((line) => line !== null);

  const entries = await collectExportEntries();

  const entriesHtml = entries
    .map(
      (entry, index) => `      <article class="entry">
        <div class="entry__index">${index + 1}.</div>
        <div class="entry__thumbnail"><img src="${entry.thumbnail}" alt="${escapeHtml(
          entry.displayName
        )}" /></div>
        <div class="entry__body">
          <h3>${escapeHtml(entry.displayName)}</h3>
          <p>${escapeHtml(entry.caption)}</p>
        </div>
      </article>`
    )
    .join('\n');

  const metaLines = [
    state.agency ? `Agencia: ${escapeHtml(state.agency)}` : null,
    state.photographer ? `Fotógrafo/a: ${escapeHtml(state.photographer)}` : null,
    state.editorInitials ? `Editor/a: ${escapeHtml(state.editorInitials)}` : null,
    segments.long ? `Fecha de cobertura: ${escapeHtml(segments.long)}` : null
  ]
    .filter(Boolean)
    .join('<br />');

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
    <div class="meta">${metaLines || '—'}</div>
    ${entriesHtml}
  </body>
</html>`;
}

function downloadBlob(content, filename, mimeType = 'text/html') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function handleDownload() {
  const included = state.images.filter((image) => image.include);
  if (!included.length) {
    setStatus('Selecciona al menos una imagen para exportar.', 'error');
    return;
  }
  if (!state.exportOptions.html && !state.exportOptions.word) {
    setStatus('Elige al menos un formato para descargar.', 'error');
    return;
  }
  try {
    setStatus('Generando archivos...', 'info');
    if (state.exportOptions.html) {
      const html = await buildExportHtml();
      state.lastExportHtml = html;
      downloadBlob(html, `${state.coverageTitle || 'exportacion-fotos'}.html`);
    }
    if (state.exportOptions.word) {
      const word = await buildExportWordDoc();
      state.lastExportWord = word;
      downloadBlob(word, `${state.coverageTitle || 'exportacion-fotos'}.doc`, 'application/msword');
    }
    setStatus('Descarga completada.');
  } catch (error) {
    console.error(error);
    setStatus('No se pudo generar el documento.', 'error');
  }
}

async function handleExport() {
  const included = state.images.filter((image) => image.include);
  if (!included.length) {
    setExportResult('Selecciona al menos una imagen para exportar.', 'error');
    return;
  }
  if (!state.exportOptions.html && !state.exportOptions.word) {
    setExportResult('Elige al menos un formato para exportar.', 'error');
    return;
  }

  setExportResult('Exportando a Google Drive...', 'info');

  const formData = new FormData();
  formData.append(
    'metadata',
    JSON.stringify({
      coverageTitle: state.coverageTitle,
      captionTemplate: state.captionTemplate,
      includeDate: state.includeDate,
      eventDate: state.eventDate,
      location: state.location,
      agency: state.agency,
      photographer: state.photographer,
      editorInitials: state.editorInitials,
      captionMode: state.captionMode,
      exportOptions: state.exportOptions,
      entries: included.map((image) => ({
        id: image.id,
        displayName: image.displayName || image.file.name,
        caption: image.caption
      }))
    })
  );

  included.forEach((image) => {
    formData.append('images', image.file, image.file.name);
  });

  try {
    const response = await fetch('/api/export', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(error.error || 'No se pudo exportar.');
    }
    const result = await response.json();
    state.lastExportHtml = result.exportHtml || null;
    state.lastExportWord = result.exportWord || null;
    state.lastExportLink = result.shareableLink || null;
    const generated = [];
    if (result.exportHtml) generated.push('HTML');
    if (result.exportWord) generated.push('DOC');
    const formats = generated.length ? generated.join(' + ') : 'sin documentos';
    setExportResult(`¡Listo! Carpeta compartida (${formats}): ${result.shareableLink}`, 'info');
  } catch (error) {
    console.error(error);
    setExportResult(error.message, 'error');
  }
}


function registerGlobalListeners() {
  dom.coverageTitle.addEventListener('input', () => {
    hydrateStateFromInputs();
    handleGlobalChange();
  });

  dom.captionTemplate.addEventListener('input', () => {
    hydrateStateFromInputs();
    handleGlobalChange({ propagateTemplate: true });
  });

  dom.eventDate.addEventListener('input', () => {
    hydrateStateFromInputs();
    handleGlobalChange();
  });

  [dom.location, dom.agency, dom.photographer, dom.editorInitials].forEach((input) => {
    input.addEventListener('input', () => {
      hydrateStateFromInputs();
      handleGlobalChange();
    });
  });

  dom.includeDate.addEventListener('change', () => {
    hydrateStateFromInputs();
    handleGlobalChange();
  });
}

function registerModeTabs() {
  dom.modeTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const { mode } = tab.dataset;
      setCaptionMode(mode);
    });
    tab.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const { mode } = tab.dataset;
        setCaptionMode(mode);
      }
    });
  });
}

function registerEditorListeners() {
  dom.displayName.addEventListener('input', () => {
    if (suppressEditorUpdates) return;
    const image = getImageById(state.activeImageId);
    if (!image) return;
    image.displayName = dom.displayName.value.trim();
    image.isDirty = true;
    invalidateExports();
    refreshImageList();
    refreshPreview();
  });

  dom.imageBody.addEventListener('input', () => {
    if (suppressEditorUpdates) return;
    const image = getImageById(state.activeImageId);
    if (!image) return;
    image.captionBody = dom.imageBody.value.replace(/\r/g, '');
    image.usesGlobalTemplate = image.captionBody === state.captionTemplate;
    image.isDirty = true;
    if (image.autoCaption) {
      image.caption = composeCaption(image);
      suppressEditorUpdates = true;
      dom.imageCaption.value = image.caption;
      suppressEditorUpdates = false;
      image.isDirty = false;
    }
    invalidateExports();
    refreshImageList();
    refreshPreview();
  });

  dom.imageAuto.addEventListener('change', () => {
    if (suppressEditorUpdates) return;
    const image = getImageById(state.activeImageId);
    if (!image) return;
    image.autoCaption = dom.imageAuto.checked;
    image.isDirty = true;
    if (image.autoCaption) {
      image.caption = composeCaption(image);
      suppressEditorUpdates = true;
      dom.imageCaption.value = image.caption;
      suppressEditorUpdates = false;
      image.isDirty = false;
    }
    invalidateExports();
    refreshImageList();
    refreshPreview();
  });

  dom.imageCaption.addEventListener('input', () => {
    if (suppressEditorUpdates) return;
    const image = getImageById(state.activeImageId);
    if (!image) return;
    image.caption = dom.imageCaption.value.replace(/\r/g, '');
    if (image.autoCaption) {
      image.autoCaption = false;
      dom.imageAuto.checked = false;
    }
    image.isDirty = true;
    invalidateExports();
    refreshPreview();
    refreshImageList();
  });

  dom.applyTemplate.addEventListener('click', () => {
    const image = getImageById(state.activeImageId);
    if (!image) return;
    image.captionBody = state.captionTemplate;
    image.autoCaption = true;
    image.usesGlobalTemplate = true;
    image.caption = composeCaption(image);
    image.isDirty = false;
    suppressEditorUpdates = true;
    dom.imageBody.value = image.captionBody || '';
    dom.imageCaption.value = image.caption || '';
    dom.imageAuto.checked = true;
    suppressEditorUpdates = false;
    invalidateExports();
    refreshPreview();
    refreshImageList();
  });

  dom.saveImage.addEventListener('click', () => {
    persistActiveImage();
    refreshImageList();
    refreshPreview();
  });
}

function registerFileInput() {
  dom.fileInput.addEventListener('change', (event) => {
    addFiles(event.target.files);
    dom.fileInput.value = '';
  });
}

function registerDropZone() {
  if (!dom.dropZone) return;

  const preventDefaults = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
    dom.dropZone.addEventListener(eventName, preventDefaults);
  });

  ['dragenter', 'dragover'].forEach((eventName) => {
    dom.dropZone.addEventListener(eventName, () => {
      dom.dropZone.classList.add('is-dragover');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dom.dropZone.addEventListener(eventName, () => {
      dom.dropZone.classList.remove('is-dragover');
    });
  });

  dom.dropZone.addEventListener('drop', (event) => {
    const { files } = event.dataTransfer || {};
    if (files?.length) {
      addFiles(files);
    }
  });

  dom.dropZone.addEventListener('click', () => {
    dom.fileInput.click();
  });

  dom.dropZone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      dom.fileInput.click();
    }
  });

  ['dragover', 'drop'].forEach((eventName) => {
    document.addEventListener(eventName, (event) => {
      event.preventDefault();
    });
  });
}

async function checkAuthStatus() {
  try {
    const response = await fetch('/api/oauth-status', { credentials: 'include' });
    if (!response.ok) throw new Error();
    const { authenticated } = await response.json();
    if (authenticated) {
      dom.authState.textContent = 'Sesión conectada con Google Drive.';
      dom.loginButton.disabled = true;
      dom.logoutButton.disabled = false;
    } else {
      dom.authState.textContent = 'No conectado. Inicia sesión para exportar.';
      dom.loginButton.disabled = false;
      dom.logoutButton.disabled = true;
    }
  } catch (error) {
    dom.authState.textContent = 'No se pudo verificar la sesión.';
  }
}

function registerAuthButtons() {
  dom.loginButton.addEventListener('click', async () => {
    try {
      const response = await fetch('/api/oauth-url', { credentials: 'include' });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'No se pudo iniciar la autenticación.');
      }
      const { url } = await response.json();
      window.open(url, '_blank', 'width=500,height=700');
      dom.authState.textContent = 'Completa la autenticación en la ventana emergente...';
    } catch (error) {
      setExportResult(error.message, 'error');
    }
  });

  dom.logoutButton.addEventListener('click', async () => {
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    } finally {
      checkAuthStatus();
    }
  });
}

function registerPreviewActions() {
  dom.downloadExport.addEventListener('click', () => {
    const wantsHtml = state.exportOptions.html;
    const wantsWord = state.exportOptions.word;
    const title = state.coverageTitle || 'exportacion-fotos';
    if (wantsHtml && !wantsWord && state.lastExportHtml) {
      downloadBlob(state.lastExportHtml, `${title}.html`);
      return;
    }
    if (wantsWord && !wantsHtml && state.lastExportWord) {
      downloadBlob(state.lastExportWord, `${title}.doc`, 'application/msword');
      return;
    }
    handleDownload();
  });
  dom.exportButton.addEventListener('click', handleExport);
}

function registerExportOptions() {
  dom.optionHtml.addEventListener('change', () => {
    state.exportOptions.html = dom.optionHtml.checked;
  });
  dom.optionWord.addEventListener('change', () => {
    state.exportOptions.word = dom.optionWord.checked;
  });
}

function init() {
  hydrateStateFromInputs();
  refreshModeUI();
  registerGlobalListeners();
  registerEditorListeners();
  registerFileInput();
  registerDropZone();
  registerPreviewActions();
  registerExportOptions();
  registerAuthButtons();
  registerModeTabs();
  refreshPreview();
  checkAuthStatus();
  window.addEventListener('focus', checkAuthStatus);
}

init();
