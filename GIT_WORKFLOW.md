# 🚀 Flujo de Trabajo: Sincronización con GitHub

Para mantener el proyecto siempre actualizado y evitar conflictos ("rebases") al trabajar en equipo o entre diferentes dispositivos, sigue este ritmo de trabajo.

## ⏱️ El Ritmo de Desarrollo

Sigue estos 4 pasos cada vez que vayas a realizar cambios:

### 1. 📥 Sincronización Inicial (Al empezar el día)
Antes de tocar el código, asegúrate de tener lo último que hay en GitHub.
```bash
git pull origin main
```

### 2. ✍️ Realizar Cambios
Trabaja normalmente en tus archivos (HTML, CSS, JS).

### 3. 📦 Preparar y Comentar (Al terminar una tarea)
Guarda tus cambios localmente con un mensaje descriptivo.
```bash
git add .
git commit -m "Explicación breve de lo que has hecho"
```

### 4. 📤 Subir a la Nube
Envía tus cambios a GitHub para que estén seguros y disponibles.
```bash
git push origin main
```

---

## 🆘 ¿Qué hacer si hay un error en el paso 4?

Si al hacer `push` recibes un error de "rejected" u "updates were rejected", significa que hay cambios en GitHub que no tienes en tu ordenador. No te asustes, haz esto:

1. **Trae los cambios forzando la integración:**
   ```bash
   git pull origin main --rebase
   ```
2. **Si hay conflictos (archivos con marcas rojas):**
   - Elige qué versión del código quieres mantener.
   - Si no estás seguro, ¡pídeme ayuda!
3. **Finaliza el rebase y sube:**
   ```bash
   git push origin main
   ```

---

## 🧹 Limpieza Automática
Gracias al archivo `.gitignore` que hemos configurado, Git ignorará automáticamente:
- Archivos temporales de Supabase.
- Archivos basura del sistema operativo.
- Archivos con contraseñas o secretos (`.env`).
