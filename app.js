const elements = {
  dropZone: document.getElementById('drop-zone'),
  fileInput: document.getElementById('image-input'),
  fileList: document.getElementById('file-list'),
  filePlaceholder: document.getElementById('file-placeholder'),
  fileCounter: document.getElementById('file-counter'),
  previewStage: document.getElementById('preview-stage'),
  previewImage: document.getElementById('preview-image'),
  emptyPreview: document.getElementById('empty-preview'),
  captionInput: document.getElementById('caption-input'),
  captionLayer: document.getElementById('caption-preview'),
  captionText: document.getElementById('caption-text'),
  fontFamily: document.getElementById('font-family'),
  fontSize: document.getElementById('font-size'),
  fontSizeOutput: document.getElementById('font-size-output'),
  textColor: document.getElementById('text-color'),
  backgroundColor: document.getElementById('background-color'),
  backgroundOpacity: document.getElementById('background-opacity'),
  backgroundOpacityOutput: document.getElementById('background-opacity-output'),
  verticalPosition: document.getElementById('vertical-position'),
  horizontalPosition: document.getElementById('horizontal-position'),
  padding: document.getElementById('padding'),
  paddingOutput: document.getElementById('padding-output'),
  exportButton: document.getElementById('export-button'),
  previewButton: document.getElementById('preview-button'),
  downloadLink: document.getElementById('download-link'),
  exportFeedback: document.getElementById('export-feedback')
};

const state = {
  image: null,
  imageUrl: null,
  caption: '',
  fontFamily: elements.fontFamily.value,
  fontSize: Number(elements.fontSize.value),
  textColor: elements.textColor.value,
  backgroundColor: elements.backgroundColor.value,
  backgroundOpacity: Number(elements.backgroundOpacity.value) / 100,
  verticalPosition: elements.verticalPosition.value,
  horizontalPosition: elements.horizontalPosition.value,
  padding: Number(elements.padding.value),
  fileName: '',
  fileSize: 0,
  imageWidth: null,
  imageHeight: null,
  exportUrl: null
};

const setPreviewAvailability = (available) => {
  if (!elements.previewButton) return;
  elements.previewButton.disabled = !available;
  if (!available) {
    elements.previewButton.blur();
  }
};

const readFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });

const revokeImageUrl = () => {
  if (state.imageUrl) {
    URL.revokeObjectURL(state.imageUrl);
    state.imageUrl = null;
  }
};

const revokeExportUrl = () => {
  if (state.exportUrl) {
    URL.revokeObjectURL(state.exportUrl);
    state.exportUrl = null;
  }
  setPreviewAvailability(false);
};

const isImageFile = (file) => file && file.type.startsWith('image/');

const hexToRgba = (hex, alpha = 1) => {
  const sanitized = hex.replace('#', '');
  if (sanitized.length !== 6) return `rgba(0, 0, 0, ${alpha})`;
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : value >= 10 ? 0 : 1)} ${units[exponent]}`;
};

const updateFileCounter = () => {
  const count = state.image ? 1 : 0;
  const label = count === 1 ? 'archivo' : 'archivos';
  elements.fileCounter.textContent = `${count} ${label}`;
};

const updateFileSummary = () => {
  elements.fileList.querySelectorAll('.file-list__item').forEach((item) => item.remove());

  if (!state.image) {
    elements.filePlaceholder.hidden = false;
    updateFileCounter();
    return;
  }

  elements.filePlaceholder.hidden = true;

  const listItem = document.createElement('li');
  listItem.className = 'file-list__item';

  const thumb = document.createElement('div');
  thumb.className = 'file-list__thumb';
  const thumbImage = document.createElement('img');
  thumbImage.src = state.imageUrl;
  thumbImage.alt = `Miniatura de ${state.fileName}`;
  thumb.append(thumbImage);

  const meta = document.createElement('div');
  meta.className = 'file-list__meta';

  const title = document.createElement('strong');
  title.textContent = state.fileName || 'Imagen seleccionada';

  const details = document.createElement('p');
  details.className = 'file-list__details';
  const dimensions =
    state.imageWidth && state.imageHeight
      ? `${state.imageWidth} × ${state.imageHeight}px`
      : 'Procesando dimensiones…';
  details.textContent = `Peso ${formatBytes(state.fileSize)} · ${dimensions}`;

  const actions = document.createElement('div');
  actions.className = 'file-list__actions';

  const replaceButton = document.createElement('button');
  replaceButton.type = 'button';
  replaceButton.className = 'file-list__button';
  replaceButton.dataset.action = 'replace';
  replaceButton.textContent = 'Reemplazar';

  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'file-list__button';
  removeButton.dataset.action = 'remove';
  removeButton.textContent = 'Eliminar';

  actions.append(replaceButton, removeButton);
  meta.append(title, details, actions);
  listItem.append(thumb, meta);
  elements.fileList.append(listItem);

  updateFileCounter();
};

const updatePreviewVisibility = (hasImage) => {
  elements.previewImage.hidden = !hasImage;
  elements.captionLayer.hidden = !hasImage;
  elements.emptyPreview.hidden = hasImage;
  elements.exportButton.disabled = !hasImage;
  if (!hasImage) {
    setPreviewAvailability(false);
  }
};

const updateCaptionPreview = () => {
  elements.captionText.textContent = state.caption;
  elements.captionText.style.fontFamily = state.fontFamily;
  elements.captionText.style.fontSize = `${state.fontSize}px`;
  elements.captionText.style.color = state.textColor;
  elements.captionText.style.padding = `${state.padding * 0.6}px ${state.padding}px`;
  elements.captionText.style.backgroundColor = hexToRgba(
    state.backgroundColor,
    state.backgroundOpacity
  );
  elements.captionLayer.dataset.vertical = state.verticalPosition;
  elements.captionLayer.dataset.horizontal = state.horizontalPosition;
  elements.captionText.style.display = state.caption.trim() ? 'inline-block' : 'none';
};

const clearImage = () => {
  revokeImageUrl();
  revokeExportUrl();
  state.image = null;
  state.fileName = '';
  state.fileSize = 0;
  state.imageWidth = null;
  state.imageHeight = null;
  elements.previewImage.removeAttribute('src');
  elements.fileInput.value = '';
  updatePreviewVisibility(false);
  updateFileSummary();
  elements.downloadLink.hidden = true;
  elements.downloadLink.removeAttribute('href');
  elements.exportFeedback.textContent = '';
  setPreviewAvailability(false);
};

const handleImageSelection = async (file) => {
  if (!isImageFile(file)) {
    elements.exportFeedback.textContent =
      'Por favor selecciona un archivo de imagen válido.';
    return;
  }

  elements.exportFeedback.textContent = '';
  elements.exportButton.disabled = true;
  revokeExportUrl();
  elements.downloadLink.hidden = true;
  elements.downloadLink.removeAttribute('href');
  setPreviewAvailability(false);

  state.fileName = file.name;
  state.fileSize = file.size;
  state.imageWidth = null;
  state.imageHeight = null;

  revokeImageUrl();
  updatePreviewVisibility(false);

  try {
    const dataUrl = await readFile(file);
    const image = new Image();
    image.src = dataUrl;

    image.onload = () => {
      state.image = image;
      state.imageUrl = dataUrl;
      state.imageWidth = image.naturalWidth;
      state.imageHeight = image.naturalHeight;
      elements.previewImage.src = dataUrl;
      updatePreviewVisibility(true);
      updateCaptionPreview();
      updateFileSummary();
      elements.exportButton.disabled = false;
      elements.fileInput.value = '';
    };

    image.onerror = () => {
      const message =
        'Hubo un problema al cargar la imagen. Intenta con otro archivo.';
      clearImage();
      elements.exportFeedback.textContent = message;
    };
  } catch (error) {
    clearImage();
    elements.exportFeedback.textContent = error.message;
  }
};

const handleDrop = async (event) => {
  event.preventDefault();
  elements.dropZone.classList.remove('dragover');
  const file = event.dataTransfer.files[0];
  if (file) {
    await handleImageSelection(file);
  }
};

const handleDragOver = (event) => {
  event.preventDefault();
  elements.dropZone.classList.add('dragover');
};

const handleDragLeave = () => {
  elements.dropZone.classList.remove('dragover');
};

const wrapText = (context, text, maxWidth) => {
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = context.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

const exportImage = async () => {
  if (!state.image) {
    elements.exportFeedback.textContent =
      'Primero necesitas cargar una imagen.';
    return;
  }

  setPreviewAvailability(false);
  const { naturalWidth: width, naturalHeight: height } = state.image;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  context.drawImage(state.image, 0, 0, width, height);

  if (state.caption.trim()) {
    const previewWidth = elements.previewImage.getBoundingClientRect().width || width;
    const scale = width / previewWidth;
    const fontSize = state.fontSize * scale;
    const lineHeight = fontSize * 1.25;
    const paddingY = state.padding * 0.6 * scale;
    const paddingX = state.padding * scale;

    context.font = `${fontSize}px ${state.fontFamily}`;
    context.fillStyle = state.textColor;
    context.textBaseline = 'top';

    const maxTextWidth = width * 0.9 - paddingX * 2;
    const lines = wrapText(context, state.caption, maxTextWidth);
    const textWidth = Math.min(
      maxTextWidth,
      Math.max(...lines.map((line) => context.measureText(line).width))
    );
    const textHeight = lines.length * lineHeight;

    let x = paddingX;
    if (state.horizontalPosition === 'center') {
      x = (width - textWidth) / 2;
    } else if (state.horizontalPosition === 'right') {
      x = width - textWidth - paddingX;
    }

    let y = paddingY;
    if (state.verticalPosition === 'middle') {
      y = (height - textHeight) / 2;
    } else if (state.verticalPosition === 'bottom') {
      y = height - textHeight - paddingY;
    }

    if (state.backgroundOpacity > 0) {
      context.fillStyle = hexToRgba(state.backgroundColor, state.backgroundOpacity);
      context.fillRect(
        x - paddingX,
        y - paddingY,
        textWidth + paddingX * 2,
        textHeight + paddingY * 2
      );
    }

    context.fillStyle = state.textColor;

    lines.forEach((line, index) => {
      context.fillText(line, x, y + index * lineHeight);
    });
  }

  revokeExportUrl();

  canvas.toBlob(
    (blob) => {
      if (!blob) {
        elements.exportFeedback.textContent =
          'No se pudo generar la imagen exportada. Intenta nuevamente.';
        return;
      }

      const downloadUrl = URL.createObjectURL(blob);
      state.exportUrl = downloadUrl;
      elements.downloadLink.href = downloadUrl;
      elements.downloadLink.download = `caption-export-${Date.now()}.png`;
      elements.downloadLink.hidden = false;
      elements.downloadLink.textContent = 'Descargar imagen exportada';
      setPreviewAvailability(true);
      elements.exportFeedback.textContent =
        '¡Listo! Tu imagen ha sido renderizada. Pulsa en descargar para guardarla.';
    },
    'image/png',
    0.95
  );
};

const openPreviewWindow = () => {
  if (!state.exportUrl) {
    elements.exportFeedback.textContent =
      'Genera la exportación para poder abrir la vista previa.';
    return;
  }

  const previewWindow = window.open(state.exportUrl, '_blank', 'noopener');
  if (!previewWindow) {
    elements.exportFeedback.textContent =
      'No se pudo abrir la vista previa. Verifica que el navegador permita ventanas emergentes.';
  }
};

const init = () => {
  elements.dropZone.addEventListener('dragover', handleDragOver);
  elements.dropZone.addEventListener('dragleave', handleDragLeave);
  elements.dropZone.addEventListener('drop', handleDrop);

  elements.fileInput.addEventListener('change', async (event) => {
    const [file] = event.target.files;
    if (file) {
      await handleImageSelection(file);
    }
  });

  elements.fileList.addEventListener('click', (event) => {
    const button = event.target.closest('.file-list__button');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'replace') {
      elements.fileInput.click();
    } else if (action === 'remove') {
      clearImage();
    }
  });

  elements.captionInput.addEventListener('input', (event) => {
    state.caption = event.target.value;
    updateCaptionPreview();
  });

  elements.fontFamily.addEventListener('change', (event) => {
    state.fontFamily = event.target.value;
    updateCaptionPreview();
  });

  elements.fontSize.addEventListener('input', (event) => {
    state.fontSize = Number(event.target.value);
    elements.fontSizeOutput.textContent = `${state.fontSize} px`;
    updateCaptionPreview();
  });

  elements.textColor.addEventListener('input', (event) => {
    state.textColor = event.target.value;
    updateCaptionPreview();
  });

  elements.backgroundColor.addEventListener('input', (event) => {
    state.backgroundColor = event.target.value;
    updateCaptionPreview();
  });

  elements.backgroundOpacity.addEventListener('input', (event) => {
    state.backgroundOpacity = Number(event.target.value) / 100;
    elements.backgroundOpacityOutput.textContent = `${event.target.value}%`;
    updateCaptionPreview();
  });

  elements.verticalPosition.addEventListener('change', (event) => {
    state.verticalPosition = event.target.value;
    updateCaptionPreview();
  });

  elements.horizontalPosition.addEventListener('change', (event) => {
    state.horizontalPosition = event.target.value;
    updateCaptionPreview();
  });

  elements.padding.addEventListener('input', (event) => {
    state.padding = Number(event.target.value);
    elements.paddingOutput.textContent = `${state.padding} px`;
    updateCaptionPreview();
  });

  elements.exportButton.addEventListener('click', exportImage);
  elements.previewButton.addEventListener('click', openPreviewWindow);

  updatePreviewVisibility(false);
  updateCaptionPreview();
  updateFileSummary();
};

window.addEventListener('DOMContentLoaded', init);
