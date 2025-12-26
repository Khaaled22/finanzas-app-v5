// src/hooks/useProjection.js
// ✅ M36 Fase 5: EXTENDIDO con inversión flexible
// ✅ M19.3: Mantiene escenarios y eventos programados
import { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ProjectionEngine } from '../domain/engines/ProjectionEngine';

export function useProjection() {
  const { 
    categories, 
    debts, 
    investments,
    ynabConfig, 
    convertCurrency, 
    displayCurrency 
  } = useApp();

  // Estado para escenario
  const [scenario, setScenario] = useState(() => {
    const saved = localStorage.getItem('projection_scenario');
    return saved || 'realistic';
  });

  // Estado para eventos programados
  const [scheduledEvents, setScheduledEvents] = useState(() => {
    const saved = localStorage.getItem('projection_scheduledEvents');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ✅ M36 Fase 5: Estado para modo de inversión
  const [investmentMode, setInvestmentMode] = useState(() => {
    const saved = localStorage.getItem('projection_investmentMode');
    return saved || 'fixed'; // 'fixed' | 'flexible' | 'none'
  });

  const [flexibleInvestmentPercent, setFlexibleInvestmentPercent] = useState(() => {
    const saved = localStorage.getItem('projection_flexiblePercent');
    return saved ? parseInt(saved, 10) : 20;
  });

  // Persistir configuración
  useEffect(() => {
    localStorage.setItem('projection_scenario', scenario);
  }, [scenario]);

  useEffect(() => {
    localStorage.setItem('projection_scheduledEvents', JSON.stringify(scheduledEvents));
  }, [scheduledEvents]);

  useEffect(() => {
    localStorage.setItem('projection_investmentMode', investmentMode);
  }, [investmentMode]);

  useEffect(() => {
    localStorage.setItem('projection_flexiblePercent', flexibleInvestmentPercent.toString());
  }, [flexibleInvestmentPercent]);
  
  // Proyección del escenario actual
  const cashflowProjection = useMemo(() => {
    return ProjectionEngine.projectCashflow(
      categories, 
      debts, 
      ynabConfig,
      convertCurrency,
      displayCurrency,
      { 
        scenario, 
        scheduledEvents,
        investmentMode,
        flexibleInvestmentPercent,
        investments
      }
    );
  }, [categories, debts, ynabConfig, convertCurrency, displayCurrency, 
      scenario, scheduledEvents, investmentMode, flexibleInvestmentPercent, investments]);
  
  const projectionStats = useMemo(() => {
    return ProjectionEngine.getProjectionStats(cashflowProjection);
  }, [cashflowProjection]);

  // Comparación de escenarios
  const scenarioComparison = useMemo(() => {
    return ProjectionEngine.compareScenarios(
      categories,
      debts,
      ynabConfig,
      convertCurrency,
      displayCurrency,
      scheduledEvents,
      { investmentMode, flexibleInvestmentPercent, investments }
    );
  }, [categories, debts, ynabConfig, convertCurrency, displayCurrency, 
      scheduledEvents, investmentMode, flexibleInvestmentPercent, investments]);

  // ✅ M36 Fase 5: Comparación de modos de inversión
  const investmentModeComparison = useMemo(() => {
    return ProjectionEngine.compareInvestmentModes(
      categories,
      debts,
      ynabConfig,
      convertCurrency,
      displayCurrency,
      investments,
      scheduledEvents
    );
  }, [categories, debts, ynabConfig, convertCurrency, displayCurrency, investments, scheduledEvents]);

  // Funciones para manejar eventos programados
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
    // Proyección principal
    cashflowProjection,
    projectionStats,
    
    // Escenarios
    scenario,
    setScenario,
    scenarioComparison,
    
    // Eventos programados
    scheduledEvents,
    addScheduledEvent,
    updateScheduledEvent,
    deleteScheduledEvent,
    toggleScheduledEvent,
    
    // ✅ M36 Fase 5: Inversión flexible
    investmentMode,
    setInvestmentMode,
    flexibleInvestmentPercent,
    setFlexibleInvestmentPercent,
    investmentModeComparison
  };
}