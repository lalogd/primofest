# 🎸 2DO PRIMOFEST — Invitación Web & Sistema de Confirmación

Sitio web interactivo y minimalista para la fiesta de primos **"2do Primofest"**, con cartel de rock en vivo, confirmación de asistencia vinculada a **Google Sheets** (con conteo de acompañantes, máximo 5) y generador de **flyer en alta resolución** para compartir por WhatsApp e Instagram.

---

## ⚡ Características Principales

1. **Estética Minimalista Rock**:
   - Diseño moderno inspirado en carteles de festivales indie/rock (paleta oscura carbón, detalles en verde lima ácido `#d4ff00` y acentos neón).
   - Tipografía limpia y contundente (`Syne` y `Space Grotesk`).
   - Cuenta regresiva automática hasta el **5 de diciembre de 2026 a las 8:00 PM**.
   - Cartel de bandas: **La Petite Mort**, **Plagio** y **DJ Set en vivo**.
   - Ubicación directa con enlace a Google Maps: **Calle Sonora #24, Col. Providencia**.

2. **Formulario de Registro (RSVP)**:
   - Nombre completo del asistente.
   - Selector interactivo de acompañantes: **0 (Solo yo), +1, +2, +3, +4, +5 (Máximo)**.
   - Cálculo automático del número total de asistentes por grupo.
   - Campo para sugerir canciones al DJ o a las bandas.
   - **Ticket digital personalizado**: al confirmar, se despliega un pase de acceso con efecto de confeti de rock.

3. **Conexión Automática con Google Sheets**:
   - Cada confirmación se guarda directamente en una hoja de cálculo en tu Google Drive.
   - Registra fecha/hora, nombre, acompañantes, suma total de asistentes y notas.
   - Sistema de respaldo local en caso de desconexión.

4. **Descarga de Flyer Oficial**:
   - Botón directo que genera una imagen **PNG en Full HD (1080 x 1920)** con relación de aspecto 9:16 ideal para estados de WhatsApp y stories de Instagram.
   - Incluye el cartel de bandas, fecha y dirección.

5. **Panel del Organizador**:
   - Acceso rápido en el footer para ver el recuento acumulado de asistentes y descargar la lista en formato CSV.

---

## 🚀 Cómo Ejecutar en XAMPP

Dado que el proyecto se encuentra en `C:\xampp2\htdocs\primofest`:

1. Inicia **Apache** desde el panel de control de XAMPP.
2. Abre tu navegador web e ingresa a:
   ```
   http://localhost/primofest/
   ```
3. ¡Listo! La invitación funcionará de inmediato.

---

## 📊 Paso a Paso: Vincular a Google Sheets (En 3 minutos)

Para que las confirmaciones se guarden en tu Google Drive sin costo ni configuraciones complejas de servidores:

### Paso 1: Crear la Hoja de Cálculo
1. Entra a [Google Sheets](https://sheets.new) y crea una hoja nueva.
2. Nómbrala como gustes (ejemplo: `Confirmaciones 2do Primofest`).

### Paso 2: Pegar el Script
1. En el menú superior de tu hoja de cálculo, haz clic en **Extensiones** ➔ **Apps Script**.
2. Borra el código existente y pega todo el contenido del archivo `google-apps-script.js` que se encuentra en la carpeta del proyecto.
3. Guarda los cambios haciendo clic en el ícono de disco (o `Ctrl + S`).

### Paso 3: Implementar como Aplicación Web
1. En la esquina superior derecha, haz clic en el botón azul **Implementar** ➔ **Nueva implementación**.
2. En el icono de engranaje (⚙️ *Seleccionar tipo*), elige **Aplicación web**.
3. Llena los campos:
   - **Descripción**: `Primofest API`
   - **Ejecutar como**: `Yo (tu correo)`
   - **Quién tiene acceso**: `Cualquiera` *(IMPORTANTE: debe ser 'Cualquiera' para que tus primos puedan enviar sus datos sin necesidad de iniciar sesión).*
4. Haz clic en **Implementar**. Si Google te pide autorizar permisos, acéptalos.
5. Copia la **URL de la aplicación web** (la que termina en `/exec`).

### Paso 4: Pegar la URL en el Proyecto
1. Abre el archivo `js/app.js` en tu editor de código.
2. En la línea 12, pega tu URL entre las comillas:
   ```javascript
   const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycb.../exec";
   ```
3. Guarda el archivo. ¡A partir de ese momento, cada confirmación se registrará al instante en tu hoja!

---

## 📁 Estructura del Proyecto

```
primofest/
├── css/
│   └── styles.css             # Estilos minimalistas, animaciones y diseño del ticket
├── js/
│   └── app.js                 # Lógica de cuenta regresiva, Google Sheets, validaciones y flyer
├── google-apps-script.js      # Código listo para pegar en Google Apps Script
├── index.html                 # Página principal de la invitación
└── README.md                  # Documentación del proyecto
```

