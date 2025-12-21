// src/hooks/useProjection.js
// ✅ M19.3: EXTENDIDO con escenarios y eventos programados (mantiene compatibilidad con M18.5)
import { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ProjectionEngine } from '../domain/engines/ProjectionEngine';

export function useProjection() {
  const { 
    categories, 
    debts, 
    ynabConfig, 
    convertCurrency, 
    displayCurrency 
  } = useApp();

  // ✅ M19.3: NUEVO - Estado para escenario y eventos programados
  const [scenario, setScenario] = useState(() => {
    const saved = localStorage.getItem('projection_scenario');
    return saved || 'realistic';
  });

  const [scheduledEvents, setScheduledEvents] = useState(() => {
    const saved = localStorage.getItem('projection_scheduledEvents');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ✅ M19.3: NUEVO - Guardar escenario cuando cambia
  useEffect(() => {
    localStorage.setItem('projection_scenario', scenario);
  }, [scenario]);

  // ✅ M19.3: NUEVO - Guardar eventos cuando cambian
  useEffect(() => {
    localStorage.setItem('projection_scheduledEvents', JSON.stringify(scheduledEvents));
  }, [scheduledEvents]);
  
  // ✅ M18.5 + M19.3: Proyección del escenario actual (EXTENDIDA)
  const cashflowProjection = useMemo(() => {
    return ProjectionEngine.projectCashflow(
      categories, 
      debts, 
      ynabConfig,
      convertCurrency,
      displayCurrency,
      { scenario, scheduledEvents } // ✅ M19.3: Agregar opciones
    );
  }, [categories, debts, ynabConfig, convertCurrency, displayCurrency, scenario, scheduledEvents]);
  
  const projectionStats = useMemo(() => {
    return ProjectionEngine.getProjectionStats(cashflowProjection);
  }, [cashflowProjection]);

  // ✅ M19.3: NUEVO - Comparación de escenarios
  const scenarioComparison = useMemo(() => {
    return ProjectionEngine.compareScenarios(
      categories,
      debts,
      ynabConfig,
      convertCurrency,
      displayCurrency,
      scheduledEvents
    );
  }, [categories, debts, ynabConfig, convertCurrency, displayCurrency, scheduledEvents]);

  // ✅ M19.3: NUEVO - Funciones para manejar eventos programados
  const addScheduledEvent = (event) => {
    const newEvent = {
      ...event,
      id: Date.now().toString(),
      enabled: event.enabled !== false
    };
    
    const validation = ProjectionEngine.validateScheduledEvent(newEvent);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    setScheduledEvents(prev => [...prev, newEvent]);
    return newEvent;
  };

  const updateScheduledEvent = (eventId, updates) => {
    setScheduledEvents(prev => 
      prev.map(event => 
        event.id === eventId 
          ? { ...event, ...updates }
          : event
      )
    );
  };

  const deleteScheduledEvent = (eventId) => {
    setScheduledEvents(prev => prev.filter(event => event.id !== eventId));
  };

  const toggleScheduledEvent = (eventId) => {
    setScheduledEvents(prev =>
      prev.map(event =>
        event.id === eventId
          ? { ...event, enabled: !event.enabled }
          : event
      )
    );
  };
  
  return {
    // ✅ M18.5: MANTIENE compatibilidad
    cashflowProjection,
    projectionStats,
    
    // ✅ M19.3: NUEVAS funcionalidades
    scenario,
    setScenario,
    scenarioComparison,
    scheduledEvents,
    addScheduledEvent,
    updateScheduledEvent,
    deleteScheduledEvent,
    toggleScheduledEvent
  };
}