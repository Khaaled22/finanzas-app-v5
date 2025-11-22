// src/hooks/useProjection.js
import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ProjectionEngine } from '../domain/engines/ProjectionEngine';

export function useProjection() {
  const { categories, debts, ynabConfig } = useApp();
  
  const cashflowProjection = useMemo(() => {
    return ProjectionEngine.projectCashflow(categories, debts, ynabConfig);
  }, [categories, debts, ynabConfig]);
  
  const projectionStats = useMemo(() => {
    return ProjectionEngine.getProjectionStats(cashflowProjection);
  }, [cashflowProjection]);
  
  return {
    cashflowProjection,
    projectionStats
  };
}