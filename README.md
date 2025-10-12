# Editor de captions fotográficos

Herramienta web pensada para fotógrafos de prensa y editores gráficos que necesitan generar captions normalizados, previsualizar coberturas y exportar el paquete final (imágenes + documentos) a Google Drive o en archivos locales.

La interfaz replica el flujo operativo en tres columnas:

1. **Cargar imágenes** – arrastra o selecciona archivos, revisa metadatos básicos y decide qué elementos se incluirán en la exportación.
2. **Editor editorial** – define el título de la cobertura, plantillas, fecha, lugar, agencia y créditos. Cada foto hereda la plantilla y puede ajustarse individualmente.
   - `Cobertura del día` genera captions con la fecha del calendario en el formato: `(<YYMMDD>) -- Ciudad DD mes, AAAA (AGENCIA) -- Caption, el DD de mes de AAAA. (AGENCIA/Autor) (Iniciales)`.
   - `Fechas anteriores` emplea el código de fecha del día actual y construye: `(<YYMMDD>) -- Ciudad, (AGENCIA) -- Caption. (AGENCIA/Autor) (Iniciales)`.
3. **Vista previa y exportación** – revisa miniaturas + captions finales, elige entre generar HTML, DOC o ambos y descarga localmente o envía directo a Google Drive.

## Requisitos

- Node.js 18 o superior.
- Cuenta de Google con acceso a Google Drive.
- Credenciales OAuth 2.0 tipo **Web application** provisionadas en [Google Cloud Console](https://console.cloud.google.com/).

## Variables de entorno

Copia `.env.example` a `.env` y ajusta los valores:

```env
GOOGLE_CLIENT_ID=tu-client-id
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5173/oauth2callback
SESSION_SECRET=cadena-segura
```

> El `GOOGLE_REDIRECT_URI` debe coincidir exactamente con el autorizado en Google Cloud. En desarrollo usamos `http://localhost:5173/oauth2callback`.
>
## Instalación y ejecución

```bash
npm install        # instala dependencias
npm run dev        # inicia el servidor con recarga (nodemon)
# o npm start      # servidor Express en modo producción
```

Abre `http://localhost:5173` en tu navegador y sigue este flujo:

1. **Carga** tus imágenes. Cada tarjeta muestra nombre, peso y la fecha de captura (basada en el `lastModified` del archivo).
2. Define los campos editoriales (título en mayúsculas, fecha, lugar, agencia, autor, editor). La plantilla de caption se regenera automáticamente con los créditos formateados así:

   ```
   (YYMMDD) -- LUGAR, DD mes, AAAA (AGENCIA) -- Descripción, el DD de mes de AAAA. (AGENCIA/Fotógrafo) (Iniciales editor)
   ```

3. Selecciona cada imagen para personalizar el nombre exportado, la descripción principal o el caption final. Puedes alternar entre modo automático/manual, regenerar desde la plantilla o guardar cambios.
4. En **Vista previa** elige qué formatos generar:
   - `HTML` con miniaturas embebidas en base64.
   - `DOC` (Word) con exactamente la misma estructura y estilos que el HTML, listo para enviarse por correo.
5. Usa **Descargar selección** para guardar los documentos en tu equipo (cada formato abre su diálogo de guardado) o autentícate con **Conectar con Google Drive** para subir imágenes + documentos a la nube.

## Exportar a Google Drive

1. Pulsa **Conectar con Google Drive** y completa el flujo OAuth en la ventana emergente.
2. Una vez autenticado, el estado mostrará “Sesión conectada con Google Drive”.
3. Selecciona las imágenes (checkbox por tarjeta) y los formatos de exportación (HTML y/o DOC).
4. Presiona **Exportar a Google Drive**. El servidor:
   - Crea una carpeta nombrada con la cobertura + fecha.
   - Sube todas las fotos incluidas.
   - Genera los documentos solicitados (HTML/DOC) con los captions finales.
   - Ajusta los permisos de la carpeta como “anyone with the link”.
5. El módulo devuelve el enlace compartible junto con los documentos generados para referencia local.

## Vista previa offline

Descarga `dist/module-preview.zip`, extráelo y abre `site/index.html`. Es una copia estática de la interfaz para evaluarla sin instalar Node.js. Ten en cuenta que:

- Las llamadas a `/api/*` (autenticación y exportación a Drive) fallarán porque no hay backend.
- El resto del flujo (carga de imágenes, edición de captions, vista previa y descargas locales) funciona en modo puramente cliente.

## Estructura del repositorio

```
public/          # HTML, CSS y JS usados en producción
server/          # Servidor Express + Google Drive
site/            # Copia estática que se empaqueta en dist/module-preview.zip
dist/            # Artefactos generados (zip de vista previa)
scripts/         # Utilidades de automatización
```

## Scripts útiles

- `npm run dev` – servidor con recarga automática (nodemon).
- `npm start` – servidor Express en modo producción.
- `npm test` – placeholder (sin pruebas por ahora).
- `scripts/build_preview.mjs` – empaqueta la carpeta `site/` en `dist/module-preview.zip` (requiere instalar `archiver` manualmente).

## Consideraciones de seguridad

- Mantén las credenciales OAuth en variables de entorno; no las subas al repositorio.
- Las sesiones usan `express-session` con almacenamiento en memoria. Para despliegues multiusuario emplea un store persistente (Redis, Firestore, etc.).
- Ajusta las políticas de CORS y HTTPS cuando publiques el módulo en producción.
## Próximos pasos sugeridos

- Añadir exportación a otros proveedores (S3, FTP) reutilizando la misma estructura de metadatos.
- Incluir pruebas E2E para validar el flujo completo con API de Google Drive en un entorno controlado.
- Internacionalizar la interfaz en caso de trabajar con equipos bilingües.
