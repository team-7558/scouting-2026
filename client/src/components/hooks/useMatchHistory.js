import { useCallback, useRef, useState } from "react";

/**
 * useMatchHistory provides undo/redo capability for a state object.
 */
export const useMatchHistory = (initialState) => {
    const [historyState, setHistoryState] = useState({
        history: [{ state: initialState, message: "Initial State" }],
        index: 0,
    });

    const isUndoingRef = useRef(false);

    const state = historyState.history[historyState.index].state;
    const lastUndoMessage = historyState.history[historyState.index > 0 ? historyState.index : 0]?.message;
    const redoMessage = historyState.history[historyState.index + 1]?.message;

    const setState = useCallback((newStateOrFn, undoMessage) => {
        setHistoryState(prev => {
            const currentState = prev.history[prev.index].state;
            const newState = typeof newStateOrFn === "function" ? newStateOrFn(currentState) : newStateOrFn;

            if (newState === currentState) return prev;

            if (undoMessage) {
                const newHistory = prev.history.slice(0, prev.index + 1);
                return {
                    history: [...newHistory, { state: newState, message: undoMessage }],
                    index: newHistory.length
                };
            } else {
                const newHistory = [...prev.history];
                newHistory[prev.index] = { ...newHistory[prev.index], state: newState };
                return { ...prev, history: newHistory };
            }
        });
    }, []);

    const undo = useCallback(() => {
        isUndoingRef.current = true;
        setHistoryState(prev => {
            if (prev.index === 0) return prev;
            return { ...prev, index: prev.index - 1 };
        });
    }, []);

    const redo = useCallback(() => {
        setHistoryState(prev => {
            if (prev.index >= prev.history.length - 1) return prev;
            return { ...prev, index: prev.index + 1 };
        });
    }, []);

    const reset = useCallback(() => {
        setHistoryState({
            history: [{ state: initialState, message: "Initial State" }],
            index: 0
        });
    }, [initialState]);

    const canUndo = historyState.index > 0;
    const canRedo = historyState.index < historyState.history.length - 1;

    return {
        state,
        setState,
        undo,
        redo,
        canUndo,
        canRedo,
        reset,
        lastUndoMessage,
        redoMessage,
        isUndoingRef
    };
};
