# 📘 Guía de Uso: Campañas y Optimización

## 🎯 ¿Qué puedes hacer con las Campañas?

### 1. **Ver Campañas (Sin Suscripción Requerida)**
- ✅ Ver todas tus campañas en la página de Campañas
- ✅ Ver métricas básicas (gasto, presupuesto, estado)
- ✅ Ver estadísticas de rendimiento (impresiones, clics, CTR)
- ✅ Ver detalles de cada campaña
- ✅ Ver recomendaciones de optimización

### 2. **Gestionar Campañas (Requiere Suscripción Activa)**
- ✏️ **Crear nuevas campañas**
  - Selecciona plataformas (Meta, Google Ads, LinkedIn)
  - Define nombre, descripción y presupuesto
  - Asocia imágenes creativas
  - Las campañas se crean tanto localmente como en la API externa (Plai)

- ✏️ **Editar campañas existentes**
  - Cambiar nombre, descripción, presupuesto
  - Modificar plataformas
  - Actualizar estado (activa, pausada, completada)
  - Cambiar imágenes asociadas
  - Los cambios se sincronizan con la API externa

- 🗑️ **Eliminar campañas**
  - Elimina campañas que ya no necesitas
  - Solo disponible con suscripción activa

- 🔄 **Sincronizar métricas**
  - Actualiza las métricas desde la API externa
  - Obtiene datos en tiempo real de rendimiento
  - Disponible con suscripción activa

### 3. **Estados de Campaña**
- **Activa**: La campaña está corriendo y mostrando anuncios
- **Pausada**: La campaña está temporalmente detenida
- **Completada**: La campaña ha terminado

---

## 🚀 ¿Cómo usar la Optimización?

### **Paso 1: Acceder a la Optimización**

Hay dos formas de acceder a la página de optimización:

1. **Desde la página de Campañas:**
   - Haz clic en el botón "Optimizar" (🚀) en cualquier campaña
   - Te llevará a `/optimize/:id`

2. **Desde la página de Detalles de Campaña:**
   - Haz clic en una campaña para ver sus detalles
   - La página muestra automáticamente las recomendaciones

### **Paso 2: Entender las Recomendaciones**

La página de optimización muestra recomendaciones con diferentes niveles de prioridad:

#### 🔴 **Prioridad Alta (Rojo)**
- Problemas críticos que requieren atención inmediata
- Ejemplo: CTR muy bajo (< 2%), lo que indica que los anuncios no están atrayendo clics

#### 🟡 **Prioridad Media (Amarillo)**
- Problemas que deberían abordarse pronto
- Ejemplo: Costo por clic elevado, presupuesto casi agotado

#### 🔵 **Prioridad Baja (Azul)**
- Sugerencias de mejora o información general
- Ejemplo: Rendimiento estable, sin datos suficientes

### **Paso 3: Aplicar las Recomendaciones**

Cada recomendación incluye:
- **Título**: Describe el problema o área de mejora
- **Descripción**: Explica por qué es importante
- **Acción sugerida**: Qué hacer para mejorar

**Ejemplos de acciones:**
- "Revisar creatividades y audiencia" → Ve a la campaña y actualiza las imágenes o el targeting
- "Optimizar pujas" → Ajusta el presupuesto o las pujas en la plataforma
- "Revisar presupuesto" → Considera aumentar o redistribuir el presupuesto

### **Paso 4: Ver Insights Detallados**

La página también muestra:
- **Métricas en tiempo real**: Gasto, impresiones, clics, CTR
- **Utilización de presupuesto**: Cuánto has gastado vs. cuánto tienes disponible
- **Datos de la API externa**: Si la campaña está conectada a Plai, verás insights adicionales

---

## 📊 Flujo Completo de Trabajo

### **Escenario 1: Crear y Optimizar una Nueva Campaña**

1. **Activa tu suscripción** (si no la tienes)
   - Haz clic en "Activar suscripción" en el banner
   - Esto conecta tu cuenta con la API externa

2. **Conecta tus cuentas de publicidad**
   - Ve a Configuración → Integraciones
   - Conecta Meta, Google Ads o LinkedIn

3. **Crea una campaña**
   - Ve a Campañas → "Nueva campaña"
   - Completa los datos y guarda

4. **Monitorea el rendimiento**
   - Ve a la página de Campañas
   - Haz clic en el ícono de métricas (📊) para actualizar datos

5. **Optimiza la campaña**
   - Haz clic en "Optimizar" (🚀)
   - Revisa las recomendaciones
   - Aplica los cambios sugeridos

### **Escenario 2: Optimizar una Campaña Existente**

1. **Ve a la página de Campañas**
2. **Haz clic en "Optimizar"** en la campaña que quieres mejorar
3. **Revisa las recomendaciones** ordenadas por prioridad
4. **Toma acción:**
   - Si el CTR es bajo → Edita la campaña y cambia las imágenes
   - Si el presupuesto está agotado → Aumenta el presupuesto
   - Si el CPC es alto → Revisa el targeting o las pujas
5. **Sincroniza las métricas** para ver el impacto de los cambios

---

## 🔐 Permisos y Suscripción

### **Sin Suscripción:**
- ✅ Ver todas tus campañas
- ✅ Ver métricas y estadísticas
- ✅ Ver recomendaciones de optimización
- ✅ Ver detalles de campañas
- ❌ Crear nuevas campañas
- ❌ Editar campañas existentes
- ❌ Eliminar campañas
- ❌ Sincronizar métricas desde la API

### **Con Suscripción Activa:**
- ✅ Todo lo anterior +
- ✅ Crear campañas
- ✅ Editar campañas
- ✅ Eliminar campañas
- ✅ Sincronizar métricas
- ✅ Conectar cuentas de publicidad

---

## 💡 Tips de Optimización

1. **Revisa regularmente las recomendaciones**
   - Las métricas cambian constantemente
   - Sincroniza las métricas periódicamente

2. **Presta atención a las prioridades altas**
   - Los problemas críticos pueden estar desperdiciando tu presupuesto

3. **Experimenta con diferentes creatividades**
   - Si el CTR es bajo, prueba nuevas imágenes
   - A/B testing es clave para mejorar el rendimiento

4. **Monitorea el presupuesto**
   - Si estás gastando muy rápido, considera pausar o ajustar

5. **Usa múltiples plataformas**
   - Distribuye tu presupuesto entre Meta, Google Ads y LinkedIn
   - Compara el rendimiento entre plataformas

---

## 🆘 ¿Necesitas Ayuda?

- **No puedo crear campañas**: Verifica que tu suscripción esté activa
- **No veo métricas**: Haz clic en el botón de sincronizar (🔄) o espera a que se recopilen datos
- **Las recomendaciones no aparecen**: Asegúrate de que la campaña tenga métricas sincronizadas
- **No puedo conectar cuentas**: Activa tu suscripción primero y luego ve a Integraciones

---

¡Listo para optimizar tus campañas! 🚀

