import { create } from "zustand";

const useTestStore = create((set, get) => ({
    attemptId: null,
    questions: [],
    answers: [],
    isSaving: false,
    lastSavedAt: null,
    score: null,
    testResult: null,

    initTestSession: (attemptId, questionsData) => {
        set({
            attemptId,
            questions: questionsData,
            answers: [],
            isSaving: false,
            lastSavedAt: null,
            score: null,
            testResult: null,
        });
    },
    selectOption: (questionId, optionId) => {
        const currentAnswers = get().answers;
        const existingAnswerIndex = currentAnswers.findIndex(
            (ans) => ans.question_id === questionId
        );
        let updatedAnswers = [...currentAnswers];
        if (existingAnswerIndex !== -1) {
            updatedAnswers[existingAnswerIndex] = {
                ...updatedAnswers[existingAnswerIndex],
                selected_option_id: optionId,
            };
        } else {
            updatedAnswers.push({
                question_id: questionId,
                selected_option_id: optionId,
            });
        }
        set({ answers: updatedAnswers });
    },
    setAnswers: (answers) => set({ answers }),
    setSavingStatus: (status) => set({ isSaving: status }),
    markSavedSuccess: () => set({
        isSaving: false,
        lastSavedAt: new Date().toLocaleTimeString()
    }),
    setTestResult: (score, resultData) => {
        set({
            score,
            testResult: resultData,
        });
    },
    clearTestSession: () => {
        set({
            attemptId: null,
            questions: [],
            answers: [],
            isSaving: false,
            lastSavedAt: null,
            score: null,
            testResult: null,
        });
    },
    getSelectedOption: (questionId) => {
        const found = get().answers.find((ans) => ans.question_id === questionId);
        return found ? found.selected_option_id : null;
    },
    getCompletedCount: () => {
        return get().answers.length;
    }
}));

export default useTestStore;