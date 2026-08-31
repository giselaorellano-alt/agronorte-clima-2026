# Encuesta de Clima 2026 · Agronorte

Reporte de resultados de la Encuesta de Clima (Work Environment Survey) para **Agronorte Oficial** (instance 181841, survey 435206), con segmentación por Departamento (Área), Jefe Directo y otras segmentaciones (División, Género, Sucursal, Ropa de trabajo, Antigüedad).

Sitio estático (HTML/CSS/JS sin build step) pensado para deploy directo en Vercel.

## Estructura

- `index.html` — estructura de la página
- `styles.css` — estilos (tokens de Humand Design System)
- `app.js` — lógica de filtros, render de gráficos y tablas
- `data.json` — dataset generado a partir de 3 queries de Redash:
  - `Agronorte 181841 | Clima 435206 | Favorabilidad por Dimensión (Seg, Jefe Directo, Departamento)` (id 61463)
  - `Agronorte 181841 | Clima 435206 | Participación por Dimensión` (id 61464)
  - `Agronorte 181841 | Clima 435206 | Detalle por Pregunta` (id 61465)

## Notas de datos

- Favorabilidad = % de respuestas "de acuerdo" / "totalmente de acuerdo" (top-2-box, escala 0-4) sobre el total de respuestas de cada pregunta.
- Los cortes segmentados solo se muestran para grupos con **3 o más respuestas** (anonimato).
- "Departamento" corresponde al grupo de segmentación **ÁREA** (este cliente no usa el módulo de Departments de Humand).
- "Jefe Directo" corresponde a `WorkEnvironmentSurveyUsers.directBossId`, congelado al momento de lanzar la encuesta.

## Desarrollo local

No requiere build. Basta con servir los archivos estáticos, por ejemplo:

```bash
npx serve .
```

## Deploy

Deploy automático vía Vercel al pushear a `main` (GitHub App de Vercel instalada en la organización Humand-CX).
