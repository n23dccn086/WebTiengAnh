import { create } from "zustand";

const useTestStore = create((set, get) => ({
    attemptId: null,          // ID của phiên kiểm tra hiện tại từ Backend
    questions: [],           // Danh sách câu hỏi (đã giấu is_correct và explanation)
    answers: [],             // Mảng lưu nháp câu trả lời dạng: [{ question_id, selected_option_id }]
    isSaving: false,         // Trạng thái hiển thị khi đang gọi API Auto-save (đang lưu...)
    lastSavedAt: null,       // Thời gian lưu nháp thành công gần nhất
    score: null,             // Điểm số nhận về sau khi nộp bài (%)
    testResult: null,        // Chi tiết kết quả trả về sau khi submit (đáp án đúng/sai, giải thích)


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
            // Nếu là câu hỏi mới làm lần đầu -> Thêm mới vào mảng nháp
            updatedAnswers.push({
                question_id: questionId,
                selected_option_id: optionId,
            });
        }

        set({ answers: updatedAnswers });
    },
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