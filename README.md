<<<<<<< ours
# Módulo de carga, edición de caption y exportación de imágenes

Este proyecto proporciona un módulo listo para usarse que permite:

1. **Cargar imágenes** desde una columna dedicada que incluye dropzone y resumen del archivo activo.
2. **Editar el caption** superpuesto con opciones de tipografía, tamaño, colores, posición y márgenes distribuidas en secciones temáticas.
3. **Previsualizar y exportar** la composición final como una imagen PNG descargable desde el panel derecho.

## Características clave

- Disposición en tres columnas inspirada en herramientas editoriales: carga, edición y vista previa.
- Listado del archivo activo con miniatura, peso, dimensiones y acciones rápidas para reemplazar o eliminar.
- Controles agrupados por categorías (contenido, tipografía, distribución) para un flujo de trabajo más claro.
- Botón de vista previa en nueva pestaña para comprobar la exportación sin necesidad de descargarla.

## Cómo utilizarlo

1. Clona este repositorio o descarga los archivos.
2. Abre `index.html` en tu navegador preferido.
3. Carga una imagen utilizando el módulo, personaliza el caption y pulsa **Exportar imagen**.
4. Si quieres comprobar el resultado antes de guardar, usa **Vista previa en nueva pestaña** para abrir la exportación generada.
5. Haz clic en el enlace de descarga que se habilitará para guardar el resultado en tu equipo.

> No se requieren dependencias ni procesos de compilación: todo funciona con HTML, CSS y JavaScript puro.
=======
# Módulo de exportación fotográfica

Aplicación de escritorio web que permite a fotógrafos y editores preparar coberturas para agencias. Incluye tres módulos principales:

1. **Carga de imágenes** – arrastra o selecciona archivos, decide cuáles se exportarán y gestiona la lista de fotos.
2. **Edición de captions** – configura plantillas editoriales, personaliza títulos, lugar, fecha, agencia y créditos por imagen.
3. **Exportación** – genera un documento HTML con miniaturas y sube automáticamente las fotos seleccionadas más el documento a Google Drive.

La interfaz replica el flujo mostrado en las capturas de referencia y entrega un enlace compartible a la carpeta generada en Drive.

## Requisitos

- Node.js 18 o superior.
- Cuenta de Google con acceso a Google Drive.
- Credenciales OAuth 2.0 de tipo _web application_ creadas en Google Cloud Console.

## Configuración

1. Copia el archivo `.env.example` a `.env` y completa los valores:

   ```env
   GOOGLE_CLIENT_ID=tu-client-id
   GOOGLE_CLIENT_SECRET=tu-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:5173/oauth2callback
   SESSION_SECRET=cadena-segura
   ```

   - El URI de redirección debe coincidir con la ruta configurada en Google Cloud. En desarrollo se usa `http://localhost:5173/oauth2callback`.

2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Inicia el servidor en modo desarrollo:

   ```bash
   npm run dev
   ```

   El servidor levanta la interfaz en `http://localhost:5173`.

## Uso

1. Desde la interfaz, selecciona o arrastra imágenes al módulo de carga.
2. Configura los datos editoriales: título de cobertura, caption base, fecha, lugar, agencia, autor y editor.
3. Selecciona cada imagen para ajustar el nombre final y el caption. Puedes regenerarlo automáticamente con la plantilla.
4. Visualiza el documento en la sección *Preview*. El botón **Descargar documento** genera un HTML local con miniaturas.
5. Presiona **Conectar con Google Drive** y completa el flujo OAuth. Al finalizar, la aplicación mostrará que la sesión está lista.
6. Con la sesión activa, usa **Exportar a Google Drive**. El servidor creará una carpeta, subirá las imágenes y el documento HTML, y devolverá el enlace compartible.

> **Nota:** para funcionar en producción debes alojar el servidor en un dominio propio y registrar la URL en los orígenes autorizados de Google Cloud.

## Scripts disponibles

- `npm run dev` – inicia el servidor con reinicios automáticos (`nodemon`).
- `npm start` – levanta el servidor en modo producción.
- `npm test` – placeholder sin pruebas configuradas.
>>>>>>> theirs

## Estructura del proyecto

```
<<<<<<< ours
├── app.js          # Lógica del módulo: carga, previsualización y exportación
├── index.html      # Marcado principal de la interfaz
├── styles.css      # Estilos y diseño responsivo del módulo
└── README.md       # Esta guía rápida
```

## Personalización

- Puedes extender el listado de fuentes disponibles en el `<select>` o integrar servicios de tipografías adicionales.
- Los parámetros de exportación (como dimensiones, formato o calidad) se pueden ajustar editando la función `exportImage` en `app.js`.
- Si deseas integrar el módulo en otro proyecto, puedes incrustar el contenido de `index.html` en tu aplicación y adaptar los estilos según tus necesidades.

## Licencia

Este módulo se ofrece "tal cual" para que puedas incorporarlo a tus propios flujos de trabajo. Ajusta y redistribuye según tus requerimientos.
=======
public/        # Interfaz web (HTML, CSS y JS)
server/        # Servidor Express con integración Google Drive
.env.example   # Variables de entorno requeridas
```

## Seguridad

- Las credenciales OAuth nunca deben versionarse. Usa variables de entorno.
- El servidor mantiene los tokens de Google Drive en sesión. Para despliegues multiusuario se recomienda un almacén distribuido (Redis, Firestore, etc.).

## Limitaciones

- La subida a Google Drive requiere conectividad externa y credenciales válidas. En entornos sin acceso a Internet no funcionará.
- El botón de descarga genera un documento HTML. Si necesitas DOCX u otros formatos, se debe extender el servicio.

## Licencia

Este proyecto se entrega sin licencia explícita. Ajusta los términos según tus necesidades antes de distribuirlo.
>>>>>>> theirs
