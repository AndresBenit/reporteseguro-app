import React from 'react';
import { Icon } from '../common/Icons';

const ActividadReciente = ({ reportes = [] }) => {
  // ✅ VALIDACIÓN: Asegurar que reportes es un array válido
  const reportesValidos = Array.isArray(reportes) ? reportes : [];
  
  
  // Ordenar por fecha más reciente y tomar los primeros 5
  const recentReports = reportesValidos
    .filter(r => r && (r.fecha || r.created_at)) // ✅ Filtrar reportes válidos con fecha o created_at
    .sort((a, b) => {
      // Intentar múltiples campos de fecha
      const getFecha = (reporte) => {
        const fecha = reporte.fecha || reporte.created_at;
        return fecha?.toDate ? fecha.toDate() : new Date(fecha);
      };
      
      const dateA = getFecha(a);
      const dateB = getFecha(b);
      return dateB - dateA;
    })
    .slice(0, 5);

  const getSeverityColor = (severity) => {
    const colors = {
      baja: "#059669",
      media: "#f59e0b",
      alta: "#ef4444",
      critica: "#dc2626"
    };
    return colors[severity] || "#6b7280";
  };

  const getStatusColor = (status) => {
    const colors = {
      pendiente: "#3b82f6",
      proceso: "#8b5cf6",
      resuelto: "#10b981"
    };
    return colors[status] || "#6b7280";
  };

  const formatTimeAgo = (reporte) => {
    const fecha = reporte.fecha || reporte.created_at;
    if (!fecha) return 'Fecha no disponible';
    
    const now = new Date();
    const reportDate = fecha?.toDate ? fecha.toDate() : new Date(fecha);
    const diffInMs = now - reportDate;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `Hace ${diffInMinutes} min`;
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} h`;
    } else {
      return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    }
  };

  if (recentReports.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 inline-flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <Icon name="Clock" size={20} color="white" />
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-indigo-700 bg-clip-text text-transparent">
              Actividad Reciente
            </h2>
          </div>
        </div>

        {/* Estado vacío */}
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-12 shadow-xl border border-white/20 text-center">
          <Icon name="Calendar" size={48} color="#9ca3af" />
          <p className="text-gray-500 mt-4 text-lg">No hay actividad reciente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 inline-flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
            <Icon name="Clock" size={20} color="white" />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-indigo-700 bg-clip-text text-transparent">
            Actividad Reciente
          </h2>
        </div>
      </div>

      {/* Lista de actividades */}
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        {recentReports.map((reporte, index) => (
          <div key={reporte.id || index} className="flex gap-4 p-6 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors duration-200">
            {/* Icono de actividad */}
            <div className="w-10 h-10 rounded-xl bg-white shadow-lg border border-gray-100 flex items-center justify-center flex-shrink-0">
              <Icon
                name={reporte.severidad === 'critica' ? 'AlertCircle' : 'FileText'}
                size={18}
                color={getSeverityColor(reporte.severidad)}
              />
            </div>

            {/* Contenido */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-900 text-sm">{reporte.tipo}</span>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {formatTimeAgo(reporte)}
                </span>
              </div>

              {/* Descripción */}
              <div className="text-gray-600 text-sm leading-relaxed mb-3">
                {reporte.descripcion?.length > 80
                  ? `${reporte.descripcion.substring(0, 80)}...`
                  : reporte.descripcion || 'Sin descripción'}
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center gap-3">
                {/* Área */}
                <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                  <Icon name="MapPin" size={12} />
                  {reporte.area}
                </div>

                {/* Badges */}
                <div className="flex gap-2">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wide ${
                      reporte.severidad === 'critica' ? 'bg-red-100 text-red-700' :
                      reporte.severidad === 'alta' ? 'bg-orange-100 text-orange-700' :
                      reporte.severidad === 'media' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}
                  >
                    {reporte.severidad}
                  </span>

                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wide ${
                      reporte.estado === 'resuelto' ? 'bg-emerald-100 text-emerald-700' :
                      reporte.estado === 'proceso' ? 'bg-purple-100 text-purple-700' :
                      'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {reporte.estado}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActividadReciente;