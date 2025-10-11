const state = {
  coverageTitle: '',
  captionTemplate: '',
  includeDate: true,
  eventDate: '',
  location: '',
  agency: '',
  photographer: '',
  editorInitials: '',
  images: [],
  activeImageId: null,
  lastExportHtml: null,
  lastExportLink: null
};

const dom = {
  fileInput: document.querySelector('#file-input'),
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
=======
  dropZone: document.querySelector('#drop-zone'),
>>>>>>> theirs
=======
  dropZone: document.querySelector('#drop-zone'),
>>>>>>> theirs
=======
  dropZone: document.querySelector('#drop-zone'),
>>>>>>> theirs
  imageList: document.querySelector('#image-list'),
  imageTemplate: document.querySelector('#image-card-template'),
  previewTemplate: document.querySelector('#preview-card-template'),
  previewGrid: document.querySelector('#preview-grid'),
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
  imageCaption: document.querySelector('#image-caption'),
  applyTemplate: document.querySelector('#apply-template'),
  saveImage: document.querySelector('#save-image'),
  status: document.querySelector('#status'),
  exportResult: document.querySelector('#export-result'),
  exportButton: document.querySelector('#export-button'),
  downloadExport: document.querySelector('#download-export'),
  loginButton: document.querySelector('#login-button'),
  logoutButton: document.querySelector('#logout-button'),
  authState: document.querySelector('#auth-state')
};

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDateToSpanish(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function getImageById(id) {
  return state.images.find((image) => image.id === id);
}

function composeCaption(image) {
  const base = (state.captionTemplate || '').trim();
  const lines = [];
  if (base) {
    lines.push(base);
  }

  const metaParts = [];
  if (state.location) metaParts.push(state.location);
  if (state.includeDate && state.eventDate) metaParts.push(formatDateToSpanish(state.eventDate));
  if (state.agency) metaParts.push(state.agency);
  const displayName = image.displayName || image.file.name;
  metaParts.push(displayName);

  let caption = `——— — ${metaParts.filter(Boolean).join(', ')}`;
  const creditParts = [];
  if (state.photographer) creditParts.push(state.photographer);
  if (state.agency) creditParts.push(state.agency);
  const credit = creditParts.length ? ` (${creditParts.join('/')})` : ' (—)';
  const editor = state.editorInitials ? ` (${state.editorInitials})` : ' (—)';
  caption += `${credit}${editor}`;

  if (lines.length) {
    lines.push(caption);
    return lines.join('\n');
  }
  return caption;
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

function refreshPreview() {
  dom.previewGrid.innerHTML = '';
  const template = dom.previewTemplate.content;
  const images = state.images.filter((image) => image.include);
  images.forEach((image) => {
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
    const size = node.querySelector('[data-role="size"]');
    const include = node.querySelector('[data-role="include"]');
    const edit = node.querySelector('[data-role="edit"]');
    const remove = node.querySelector('[data-role="remove"]');

    img.src = image.previewUrl;
    img.alt = image.displayName || image.file.name;
    name.textContent = image.displayName || image.file.name;
    size.textContent = `${formatFileSize(image.file.size)} · ${image.file.type || 'image'}`;
    include.checked = image.include;

    include.addEventListener('change', () => {
      image.include = include.checked;
      refreshPreview();
    });

    edit.addEventListener('click', () => {
      setActiveImage(image.id);
    });

    remove.addEventListener('click', () => {
      removeImage(image.id);
    });

    if (state.activeImageId === image.id) {
      article.classList.add('active');
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
=======
    } else {
      article.classList.remove('active');
>>>>>>> theirs
=======
    } else {
      article.classList.remove('active');
>>>>>>> theirs
=======
    } else {
      article.classList.remove('active');
>>>>>>> theirs
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
  dom.displayName.value = image.displayName || image.file.name;
  dom.imageCaption.value = image.caption;
}

function setActiveImage(id) {
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
  refreshImageList();
  refreshPreview();
  updateEditor();
}

function updateAutoCaptions() {
  state.images.forEach((image) => {
    if (image.autoCaption) {
      image.caption = composeCaption(image);
    }
  });
}

function handleGlobalChange() {
  updateAutoCaptions();
  refreshImageList();
  refreshPreview();
  updateEditor();
}

<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
async function addFiles(files) {
  const list = Array.from(files);
  if (!list.length) return;
  await Promise.all(list.map(async (file) => {
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
function isSupportedImage(file) {
  if (file.type && file.type.startsWith('image/')) return true;
  const extension = file.name.split('.').pop()?.toLowerCase();
  const allowed = ['jpg', 'jpeg', 'png', 'heic', 'raw', 'nef', 'cr2', 'arw', 'dng'];
  return extension ? allowed.includes(extension) : false;
}

async function addFiles(files) {
  const list = Array.from(files);
  if (!list.length) return;
  let skipped = 0;
  const previousCount = state.images.length;
  await Promise.all(list.map(async (file) => {
    if (!isSupportedImage(file)) {
      skipped += 1;
      return;
    }
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
    const previewUrl = URL.createObjectURL(file);
    const id = (window.crypto && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10));
    const image = {
      id,
      file,
      previewUrl,
      include: true,
      displayName: file.name,
      caption: '',
      autoCaption: true
    };
    image.caption = composeCaption(image);
    state.images.push(image);
  }));
  refreshImageList();
  refreshPreview();
  if (!state.activeImageId && state.images.length) {
    setActiveImage(state.images[0].id);
  }
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
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
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
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

async function buildExportHtml() {
  const included = state.images.filter((image) => image.include);
  const entries = await Promise.all(
    included.map(async (image) => ({
      thumbnail: await createThumbnailDataUrl(image.file),
      displayName: image.displayName || image.file.name,
      caption: image.caption
    }))
  );

  const coverageTitle = state.coverageTitle || 'Exportación de fotografías';
  const headerMeta = `Agencia: ${state.agency || '—'} · Fotógrafo/a: ${state.photographer || '—'}${state.editorInitials ? ` · Editor/a: ${state.editorInitials}` : ''}`;

  const entriesHtml = entries
    .map(
      (entry) => `      <article class="entry">
        <div class="entry__thumbnail">
          <img src="${entry.thumbnail}" alt="${entry.displayName}" />
        </div>
        <div class="entry__body">
          <h3>${entry.displayName}</h3>
          <p>${entry.caption.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br />')}</p>
        </div>
      </article>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>${coverageTitle}</title>
    <style>
      body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; color: #111827; margin: 0; padding: 2.5rem; }
      h1 { font-size: 2rem; margin-bottom: 0.5rem; }
      .meta { margin-bottom: 2rem; color: #4b5563; }
      .entries { display: flex; flex-direction: column; gap: 1.5rem; }
      .entry { background: #ffffff; border-radius: 1rem; display: flex; gap: 1.25rem; padding: 1rem; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.12); }
      .entry__thumbnail { width: 180px; flex-shrink: 0; }
      .entry__thumbnail img { width: 100%; border-radius: 0.75rem; object-fit: cover; display: block; }
      .entry__body { display: flex; flex-direction: column; justify-content: center; gap: 0.75rem; }
      .entry__body h3 { font-size: 1.1rem; margin: 0; color: #111827; }
      .entry__body p { margin: 0; line-height: 1.5; }
      footer { margin-top: 2.5rem; color: #6b7280; font-size: 0.9rem; }
    </style>
  </head>
  <body>
    <header>
      <h1>${coverageTitle}</h1>
      <div class="meta">${headerMeta}</div>
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
  try {
    setStatus('Generando documento local...', 'info');
    const html = await buildExportHtml();
    state.lastExportHtml = html;
    downloadBlob(html, `${state.coverageTitle || 'exportacion-fotos'}.html`);
    setStatus('Documento generado correctamente.');
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
    state.lastExportHtml = result.exportHtml;
    state.lastExportLink = result.shareableLink;
    setExportResult(`¡Listo! Carpeta compartida: ${result.shareableLink}`, 'info');
  } catch (error) {
    console.error(error);
    setExportResult(error.message, 'error');
  }
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

function registerGlobalListeners() {
  const inputs = [
    dom.coverageTitle,
    dom.captionTemplate,
    dom.eventDate,
    dom.location,
    dom.agency,
    dom.photographer,
    dom.editorInitials
  ];

  inputs.forEach((input) => {
    input.addEventListener('input', () => {
      hydrateStateFromInputs();
      handleGlobalChange();
    });
  });

  dom.includeDate.addEventListener('change', () => {
    state.includeDate = dom.includeDate.checked;
    handleGlobalChange();
  });
}

function registerEditorListeners() {
  dom.applyTemplate.addEventListener('click', () => {
    const image = getImageById(state.activeImageId);
    if (!image) return;
    image.autoCaption = true;
    image.caption = composeCaption(image);
    dom.imageCaption.value = image.caption;
    refreshPreview();
    refreshImageList();
  });

  dom.saveImage.addEventListener('click', () => {
    const image = getImageById(state.activeImageId);
    if (!image) return;
    image.displayName = dom.displayName.value.trim() || image.file.name;
    image.caption = dom.imageCaption.value;
    image.autoCaption = false;
    refreshPreview();
    refreshImageList();
    updateEditor();
  });
}

function registerFileInput() {
  dom.fileInput.addEventListener('change', (event) => {
    addFiles(event.target.files);
    dom.fileInput.value = '';
  });
}

<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
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

<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
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

function registerPreviewDownload() {
  dom.downloadExport.addEventListener('click', () => {
    if (state.lastExportHtml) {
      downloadBlob(state.lastExportHtml, `${state.coverageTitle || 'exportacion-fotos'}.html`);
    } else {
      handleDownload();
    }
  });
}

function registerExportButton() {
  dom.exportButton.addEventListener('click', () => {
    handleExport();
  });
}

function init() {
  hydrateStateFromInputs();
  registerGlobalListeners();
  registerEditorListeners();
  registerFileInput();
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
=======
  registerDropZone();
>>>>>>> theirs
=======
  registerDropZone();
>>>>>>> theirs
=======
  registerDropZone();
>>>>>>> theirs
  registerPreviewDownload();
  registerExportButton();
  registerAuthButtons();
  checkAuthStatus();
  window.addEventListener('focus', checkAuthStatus);
}

init();
