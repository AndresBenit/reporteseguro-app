import React from 'react';

const SupervisionSelector = ({ onFormSelect }) => {
  const forms = [
    {
      id: 'recomendaciones',
      title: 'Recomendaciones',
      description: 'Registrar recomendación a colaborador',
      icon: '•',
      color: '#3b82f6'
    },
    {
      id: 'abordajes',
      title: 'Abordajes en Campo',
      description: 'Documentar abordaje directo',
      icon: '•',
      color: '#059669'
    },
    {
      id: 'supervision',
      title: 'Supervisión Completa',
      description: 'Registro completo con evidencias',
      icon: '•',
      color: '#7c3aed'
    }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '10px', color: '#1f2937' }}>
          Supervisión de Campo
        </h1>
        <p style={{ color: '#6b7280' }}>Selecciona el tipo de registro</p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px'
      }}>
        {forms.map((form) => (
          <div
            key={form.id}
            onClick={() => onForm