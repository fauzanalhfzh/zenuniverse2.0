import { createStore, type StoreApi } from 'zustand/vanilla';

export interface StepOutcome {
    correct: boolean;
    feedback: string;
    consumeHeart: boolean;
    xpAwarded: number;
}

export interface LessonState {
    stepIndex: number;
    outcomes: Record<string, StepOutcome>;
    completed: boolean;
    pending: boolean;
    xpEarned: number;
    goTo: (index: number) => void;
    next: (totalSteps: number) => void;
    previous: () => void;
    recordOutcome: (stepId: string, outcome: StepOutcome) => void;
    setCompleted: (completed: boolean) => void;
    setPending: (pending: boolean) => void;
    reset: () => void;
}

export function createLessonStore(): StoreApi<LessonState> {
    return createStore<LessonState>()((set, get) => ({
        stepIndex: 0,
        outcomes: {},
        completed: false,
        pending: false,
        xpEarned: 0,
        goTo: (index) => set({ stepIndex: Math.max(0, index) }),
        next: (totalSteps) =>
            set({ stepIndex: Math.min(totalSteps - 1, get().stepIndex + 1) }),
        previous: () => set({ stepIndex: Math.max(0, get().stepIndex - 1) }),
        recordOutcome: (stepId, outcome) =>
            set((state) => ({
                outcomes: { ...state.outcomes, [stepId]: outcome },
                xpEarned: state.xpEarned + outcome.xpAwarded,
            })),
        setCompleted: (completed) => set({ completed }),
        setPending: (pending) => set({ pending }),
        reset: () =>
            set({
                stepIndex: 0,
                outcomes: {},
                completed: false,
                pending: false,
                xpEarned: 0,
            }),
    }));
}

export function stepProgress(stepIndex: number, totalSteps: number): number {
    if (totalSteps <= 0) {
        return 0;
    }

    return Math.round((Math.min(stepIndex + 1, totalSteps) / totalSteps) * 100);
}
