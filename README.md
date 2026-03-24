# Solicitudes de Material — FP

PWA para gestionar solicitudes de material del departamento de Formación Profesional.

## Archivos

```
solicitudes-material/
├── index.html
├── style.css
├── app.js
├── supabase.js
├── manifest.json
├── sw.js
└── README.md
```

## SQL para Supabase

Ejecutar en el **SQL Editor** de Supabase:

```sql
-- Tabla solicitudes_material
CREATE TABLE IF NOT EXISTS solicitudes_material (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  nombre_profesor TEXT NOT NULL,
  grupo_curso TEXT,
  modulo TEXT,
  material_solicitado TEXT NOT NULL,
  cantidad INTEGER DEFAULT 1,
  urgencia TEXT DEFAULT 'Normal' CHECK (urgencia IN ('Normal', 'Pronto', 'Urgente')),
  nombre_proyecto TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: permitir acceso público total
ALTER TABLE solicitudes_material ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso público lectura" ON solicitudes_material
  FOR SELECT USING (true);

CREATE POLICY "Acceso público inserción" ON solicitudes_material
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Acceso público eliminación" ON solicitudes_material
  FOR DELETE USING (true);
```

## Despliegue en GitHub Pages

1. **Crear repo** en GitHub (ej: `solicitudes-material`)
2. **Subir archivos** del proyecto a la raíz del repo:
   ```bash
   cd solicitudes-material
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/TU_USER/solicitudes-material.git
   git push -u origin main
   ```
3. **GitHub Pages**: Settings → Pages → Source: `main` → Save
4. Esperar ~2 min → acceso en `https://TU_USER.github.io/solicitudes-material/`

## Notas

- La anon key está embebida en `supabase.js`. Si necesitasrotarla, actualiza `SUPABASE_ANON_KEY` en ese archivo.
- La RLS permite lectura/escritura sin autenticación. Para producción, considera restrict会更好.
- El Service Worker cachea los archivos del proyecto para funcionamiento offline.
