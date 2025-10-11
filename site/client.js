const dom = {
  dropzone: document.getElementById('dropzone'),
  fileInput: document.getElementById('file-input'),
  dropzoneStatus: document.getElementById('dropzone-status'),
  photoList: document.getElementById('photo-list'),
  photoEmpty: document.getElementById('photo-empty'),
  photoCounter: document.getElementById('photo-counter'),
  photoTemplate: document.getElementById('photo-item-template'),
  statusMessage: document.querySelector('.masthead__status'),
  editorForm: document.getElementById('editor-form'),
  editorFields: {
    coverageTitle: document.getElementById('coverage-title'),
    captionBase: document.getElementById('caption-base'),
    includeDate: document.getElementById('include-date'),
    captureDate: document.getElementById('capture-date'),
    location: document.getElementById('location'),
    agency: document.getElementById('agency'),
    photographer: document.getElementById('photographer'),
    editorInitials: document.getElementById('editor-initials')
  },
  previewImage: document.getElementById('preview-image'),
  previewEmpty: document.getElementById('preview-empty'),
  previewCaption: document.getElementById('preview-caption'),
  previewTitle: document.getElementById('preview-title-text'),
  previewBody: document.getElementById('preview-body-text'),
  previewMeta: document.getElementById('preview-meta-text'),
  downloadButton: document.getElementById('download-document'),
  exportButton: document.getElementById('export-drive')
};

const initialStatusMessage = dom.statusMessage?.textContent ?? '';
const initialDropzoneStatus = dom.dropzoneStatus?.textContent ?? '';

const state = {
  photos: [],
  activeId: null
};

let isSyncingEditor = false;

const defaultCaptionData = () => ({
  coverageTitle: '',
  captionBase: '',
  includeDate: true,
  captureDate: '',
  location: '',
  agency: '',
  photographer: '',
  editorInitials: ''
});

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  const precision = value >= 10 || exponent === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[exponent]}`;
};

const setStatusMessage = (message) => {
  if (!dom.statusMessage) return;
  dom.statusMessage.textContent = message || initialStatusMessage;
};

const setDropzoneStatus = (message) => {
  if (!dom.dropzoneStatus) return;
  dom.dropzoneStatus.textContent = message || initialDropzoneStatus;
};

const getActivePhoto = () => state.photos.find((photo) => photo.id === state.activeId) ?? null;

const syncPhotoCounter = () => {
  const count = state.photos.length;
  const label = count === 1 ? 'elemento' : 'elementos';
  dom.photoCounter.textContent = `${count} ${label}`;
};

const readPhotoFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        resolve({
          dataUrl: reader.result,
          width: image.naturalWidth,
          height: image.naturalHeight
        });
      };
      image.onerror = () => reject(new Error('No se pudo decodificar la imagen seleccionada.'));
      image.src = reader.result;
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });

const formatDimensions = (width, height) => {
  if (!width || !height) return 'Procesando dimensiones…';
  return `${width} × ${height}px`;
};

const renderPhotoList = () => {
  dom.photoList.querySelectorAll('.photo-list__item').forEach((item) => item.remove());

  if (!state.photos.length) {
    dom.photoEmpty.hidden = false;
    syncPhotoCounter();
    setDropzoneStatus(initialDropzoneStatus);
    return;
  }

  dom.photoEmpty.hidden = true;

  const fragment = document.createDocumentFragment();

  state.photos.forEach((photo) => {
    const clone = dom.photoTemplate.content.firstElementChild.cloneNode(true);
    const listItem = clone;
    listItem.dataset.photoId = photo.id;

    const thumb = clone.querySelector('img');
    thumb.src = photo.dataUrl;
    thumb.alt = `Miniatura de ${photo.fileName}`;

    const title = clone.querySelector('.photo-list__name');
    const captionTitle = photo.caption.coverageTitle.trim();
    title.textContent = captionTitle || photo.fileName;

    const meta = clone.querySelector('.photo-list__meta');
    meta.textContent = `${formatBytes(photo.fileSize)} · ${formatDimensions(photo.width, photo.height)}`;

    if (photo.id === state.activeId) {
      listItem.classList.add('is-active');
    }

    fragment.appendChild(clone);
  });

  dom.photoList.appendChild(fragment);
  syncPhotoCounter();
};

const setEditorAvailability = (enabled) => {
  const fields = Array.from(dom.editorForm.elements);
  fields.forEach((field) => {
    field.disabled = !enabled;
  });
};

const populateEditor = () => {
  const photo = getActivePhoto();
  const hasPhoto = Boolean(photo);
  setEditorAvailability(hasPhoto);

  if (!hasPhoto) {
    isSyncingEditor = true;
    dom.editorForm.reset();
    if (dom.editorFields.captureDate) {
      dom.editorFields.captureDate.disabled = true;
    }
    isSyncingEditor = false;
    return;
  }

  const caption = photo.caption;
  isSyncingEditor = true;
  dom.editorFields.coverageTitle.value = caption.coverageTitle;
  dom.editorFields.captionBase.value = caption.captionBase;
  dom.editorFields.includeDate.checked = caption.includeDate;
  dom.editorFields.captureDate.value = caption.captureDate;
  dom.editorFields.captureDate.disabled = !caption.includeDate;
  dom.editorFields.location.value = caption.location;
  dom.editorFields.agency.value = caption.agency;
  dom.editorFields.photographer.value = caption.photographer;
  dom.editorFields.editorInitials.value = caption.editorInitials;
  isSyncingEditor = false;
};

const formatDateForCaption = (value) => {
  if (!value) return '';
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return value;
  const formatter = new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  return formatter.format(new Date(timestamp));
};

const assemblePreviewData = (photo) => {
  const caption = photo.caption;
  const title = caption.coverageTitle.trim() || photo.fileName;

  const bodyParts = [];
  if (caption.captionBase.trim()) {
    bodyParts.push(caption.captionBase.trim());
  }

  const metaParts = [];
  if (caption.includeDate && caption.captureDate) {
    metaParts.push(formatDateForCaption(caption.captureDate));
  }
  if (caption.location.trim()) {
    metaParts.push(caption.location.trim());
  }
  if (caption.agency.trim()) {
    metaParts.push(caption.agency.trim());
  }

  const credits = [];
  if (caption.photographer.trim()) {
    credits.push(`Por ${caption.photographer.trim()}`);
  }
  if (caption.editorInitials.trim()) {
    credits.push(`Edición ${caption.editorInitials.trim()}`);
  }

  const body = bodyParts.join('\n');
  const meta = [...metaParts, ...credits].join(' · ');

  return { title, body, meta };
};

const renderPreview = () => {
  const photo = getActivePhoto();
  const hasPhoto = Boolean(photo);

  dom.previewEmpty.hidden = hasPhoto;
  dom.previewCaption.hidden = !hasPhoto;
  dom.previewImage.hidden = !hasPhoto;

  dom.downloadButton.disabled = !hasPhoto;
  dom.exportButton.disabled = !hasPhoto;

  if (!hasPhoto) {
    dom.previewImage.removeAttribute('src');
    dom.previewTitle.textContent = '';
    dom.previewBody.textContent = '';
    dom.previewMeta.textContent = '';
    return;
  }

  dom.previewImage.src = photo.dataUrl;
  dom.previewImage.alt = `Vista previa de ${photo.fileName}`;

  const assembled = assemblePreviewData(photo);
  dom.previewTitle.textContent = assembled.title;
  dom.previewBody.textContent = assembled.body || 'Añade la descripción del caption para esta fotografía.';
  dom.previewMeta.textContent = assembled.meta || 'Completa los metadatos para enriquecer el documento.';
};

const setActivePhoto = (photoId) => {
  if (state.activeId === photoId) return;
  state.activeId = photoId;
  renderPhotoList();
  populateEditor();
  renderPreview();
};

const removePhoto = (photoId) => {
  const index = state.photos.findIndex((photo) => photo.id === photoId);
  if (index === -1) return;

  const removed = state.photos.splice(index, 1)[0];

  if (!state.photos.length) {
    state.activeId = null;
  } else if (state.activeId === removed.id) {
    const nextIndex = Math.max(index - 1, 0);
    state.activeId = state.photos[nextIndex].id;
  }

  renderPhotoList();
  populateEditor();
  renderPreview();
  setStatusMessage('Se eliminó una fotografía del módulo.');
  if (!state.photos.length) {
    setDropzoneStatus(initialDropzoneStatus);
  }
};

const updateActiveCaption = (key, value) => {
  const photo = getActivePhoto();
  if (!photo) return;

  photo.caption[key] = value;

  if (key === 'includeDate') {
    dom.editorFields.captureDate.disabled = !value;
  }

  if (key === 'coverageTitle') {
    renderPhotoList();
  }

  renderPreview();
};

const handleFiles = async (fileList) => {
  const files = Array.from(fileList);
  if (!files.length) return;

  const hadActive = Boolean(getActivePhoto());
  let added = 0;
  let skipped = 0;

  setDropzoneStatus(`Procesando ${files.length} archivo${files.length === 1 ? '' : 's'}…`);

  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      skipped += 1;
      continue;
    }

    try {
      const { dataUrl, width, height } = await readPhotoFile(file);
      const id = `photo-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
      state.photos.push({
        id,
        fileName: file.name,
        fileSize: file.size,
        dataUrl,
        width,
        height,
        caption: defaultCaptionData()
      });
      added += 1;
      if (!hadActive) {
        state.activeId = id;
      }
    } catch (error) {
      skipped += 1;
      console.error(error);
    }
  }

  if (!state.activeId && state.photos.length) {
    state.activeId = state.photos[0].id;
  }

  renderPhotoList();
  populateEditor();
  renderPreview();

  if (added && !skipped) {
    setStatusMessage(
      `Se ${added === 1 ? 'añadió' : 'añadieron'} ${added} ${added === 1 ? 'fotografía' : 'fotografías'} al módulo.`
    );
    setDropzoneStatus(
      `${state.photos.length} fotografía${state.photos.length === 1 ? '' : 's'} en la bandeja`
    );
  } else if (added && skipped) {
    setStatusMessage(
      `Se incorporaron ${added} imágenes y se omitieron ${skipped} archivos no compatibles.`
    );
    setDropzoneStatus(
      `${state.photos.length} fotografía${state.photos.length === 1 ? '' : 's'} listas · ${skipped} omitidas`
    );
  } else if (!added && skipped) {
    setStatusMessage('Los archivos seleccionados no son imágenes compatibles.');
    setDropzoneStatus('Intenta con imágenes en formato JPG, PNG, GIF o WEBP');
  } else {
    setDropzoneStatus(initialDropzoneStatus);
  }

  dom.fileInput.value = '';
};

const handleDownload = () => {
  const photo = getActivePhoto();
  if (!photo) return;
  const { title, body, meta } = assemblePreviewData(photo);
  const lines = [
    `Título: ${title || 'Sin título'}`,
    '',
    'Caption:',
    body || 'Sin contenido',
    '',
    'Metadatos:',
    meta || 'Completa los campos en el editor para generar los metadatos.'
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  const baseName = photo.fileName.replace(/\.[^/.]+$/, '') || 'caption';
  link.download = `${baseName}-caption.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
  setStatusMessage('Se generó un archivo de texto con el caption de la fotografía activa.');
};

const handleExport = () => {
  const photo = getActivePhoto();
  if (!photo) return;
  setStatusMessage(
    'La exportación a Google Drive estará disponible en la siguiente iteración del módulo.'
  );
};

const initEventListeners = () => {
  dom.fileInput.addEventListener('change', async (event) => {
    await handleFiles(event.target.files);
  });

  dom.dropzone.addEventListener('click', (event) => {
    if (event.target === dom.fileInput) return;
    dom.fileInput.click();
  });

  dom.dropzone.addEventListener('dragenter', (event) => {
    event.preventDefault();
    dom.dropzone.classList.add('is-dragover');
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  });

  dom.dropzone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dom.dropzone.classList.add('is-dragover');
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  });

  dom.dropzone.addEventListener('dragleave', (event) => {
    if (!dom.dropzone.contains(event.relatedTarget)) {
      dom.dropzone.classList.remove('is-dragover');
    }
  });

  dom.dropzone.addEventListener('drop', async (event) => {
    event.preventDefault();
    dom.dropzone.classList.remove('is-dragover');
    if (event.dataTransfer?.files) {
      await handleFiles(event.dataTransfer.files);
    }
  });

  dom.photoList.addEventListener('click', (event) => {
    const actionButton = event.target.closest('.icon-button');
    if (actionButton) {
      const item = actionButton.closest('[data-photo-id]');
      if (!item) return;
      const { photoId } = item.dataset;
      const action = actionButton.dataset.action;
      if (action === 'edit') {
        setActivePhoto(photoId);
      } else if (action === 'delete') {
        removePhoto(photoId);
      }
      return;
    }

    const item = event.target.closest('[data-photo-id]');
    if (item) {
      setActivePhoto(item.dataset.photoId);
    }
  });

  const editorInputs = Array.from(dom.editorForm.elements).filter(
    (element) => element.name
  );

  editorInputs.forEach((input) => {
    const eventType = input.type === 'checkbox' ? 'change' : 'input';
    input.addEventListener(eventType, (event) => {
      if (isSyncingEditor) return;
      const target = event.target;
      const value = target.type === 'checkbox' ? target.checked : target.value;
      updateActiveCaption(target.name, value);
    });
  });

  dom.downloadButton.addEventListener('click', handleDownload);
  dom.exportButton.addEventListener('click', handleExport);
};

const init = () => {
  setStatusMessage(initialStatusMessage);
  setEditorAvailability(false);
  renderPreview();
  syncPhotoCounter();
  initEventListeners();
};

window.addEventListener('DOMContentLoaded', init);
