import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface ConfirmModalProps {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
    isDestructive?: boolean;
}

export default function ConfirmModal({
    title,
    message,
    confirmLabel = "确定",
    cancelLabel = "取消",
    onConfirm,
    onCancel,
    isDestructive = true,
}: ConfirmModalProps) {
    const [visible, setVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));
    }, []);

    const handleAnimatedClose = (callback: () => void) => {
        setVisible(false);
        setTimeout(callback, 200);
    };

    const handleConfirm = async () => {
        try {
            setIsSubmitting(true);
            await onConfirm();
            handleAnimatedClose(() => { }); // Optional: parent unmounts it anyway
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"
                }`}
            onClick={(e) => {
                if (e.target === e.currentTarget && !isSubmitting) {
                    handleAnimatedClose(onCancel);
                }
            }}
        >
            <div
                className={`bg-bg-elevated rounded-xl w-full max-w-sm mx-4 overflow-hidden transition-all duration-200 ${visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
                    }`}
                style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                        {title}
                    </h3>
                    <p className="text-text-secondary text-sm leading-relaxed">
                        {message}
                    </p>
                </div>

                <div className="px-6 py-4 border-t border-border flex justify-end gap-3 bg-bg-surface/50">
                    <button
                        onClick={() => !isSubmitting && handleAnimatedClose(onCancel)}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded-md transition-colors disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className={`px-4 py-2 text-sm text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-2 ${isDestructive
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-accent hover:bg-accent-hover"
                            }`}
                    >
                        {isSubmitting ? (
                            <svg
                                className="animate-spin h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                        ) : null}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
