import { useCallback, useEffect, useState } from 'react';
import { aiEngine } from './engine.js';
import { runTask as runRegisteredTask } from './tasks.js';

export function useAI() {
  const [snapshot, setSnapshot] = useState(aiEngine.state);
  useEffect(() => aiEngine.subscribe(setSnapshot), []);
  const load = useCallback((modelId) => aiEngine.load(modelId), []);
  const enable = useCallback((modelId) => aiEngine.enable(modelId), []);
  const disable = useCallback(() => aiEngine.disable(), []);
  const selectModel = useCallback((modelId) => aiEngine.selectModel(modelId), []);
  const clearCache = useCallback(() => aiEngine.clearCache(), []);
  const runTask = useCallback((id, input, ctx = {}) => runRegisteredTask(id, input, ctx), []);
  return {
    ...snapshot,
    model: aiEngine.selectedModel,
    ready: snapshot.status === 'ready',
    load,
    enable,
    disable,
    selectModel,
    clearCache,
    runTask,
  };
}
