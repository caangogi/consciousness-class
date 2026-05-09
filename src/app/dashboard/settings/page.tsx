'use client';
import React from 'react';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
      <h1 className="text-largeTitle font-bold text-foreground mb-6">Ajustes</h1>
      <div className="ios-list">
        <div className="ios-list-item justify-center text-secondary-foreground py-8">
          Configuración en construcción.
        </div>
      </div>
    </div>
  );
}
