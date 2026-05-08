import React from 'react';
import './aurora.css';

const AuroraBackground: React.FC = () => {
  return (
    <div className="aurora-root" aria-hidden="true">
      <div className="aurora-blob aurora-blob--1" />
      <div className="aurora-blob aurora-blob--2" />
      <div className="aurora-blob aurora-blob--3" />
      <div className="aurora-blob aurora-blob--4" />
    </div>
  );
};

export default AuroraBackground;