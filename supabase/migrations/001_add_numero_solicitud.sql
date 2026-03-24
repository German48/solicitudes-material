-- =============================================
-- Migración: Añadir columna numero_solicitud y función RPC
-- =============================================

-- 1. Añadir columna numero_solicitud a la tabla
ALTER TABLE solicitudes_material ADD COLUMN IF NOT EXISTS numero_solicitud TEXT;

-- 2. Crear función RPC para generar número correlativo de forma atómica
-- Formato: SOL-2526-NNN (curso 2025-2026, 3 dígitos correlativos)
CREATE OR REPLACE FUNCTION generar_numero_solicitud()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  siguiente INTEGER;
  numero_texto TEXT;
  curso_anio INTEGER := 2526; -- curso académico 2025-2026
BEGIN
  -- Contar registros existentes y calcular siguiente
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(numero_solicitud FROM 'SOL-\d{4}-(\d{3})') AS INTEGER)
  ), 0) + 1
  INTO siguiente
  FROM solicitudes_material
  WHERE numero_solicitud ~ 'SOL-\d{4}-\d{3}';

  -- Si la tabla está vacía, empieza en 1
  IF siguiente IS NULL OR siguiente = 1 THEN
    SELECT COUNT(*) + 1 INTO siguiente FROM solicitudes_material;
  END IF;

  -- Formatear con 3 dígitos
  numero_texto := LPAD(siguiente::TEXT, 3, '0');

  RETURN 'SOL-' || curso_anio || '-' || numero_texto;
END;
$$;

-- 3. Crear índice para mejorar rendimiento de búsqueda por numero_solicitud
CREATE INDEX IF NOT EXISTS idx_solicitudes_numero ON solicitudes_material(numero_solicitud);

-- 4. Añadir constraint única para evitar duplicados (opcional pero recomendado)
-- ALTER TABLE solicitudes_material ADD CONSTRAINT unique_numero_solicitud UNIQUE (numero_solicitud);
