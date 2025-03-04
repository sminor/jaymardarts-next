import React, { ReactNode, useEffect, useRef } from 'react';
import Button from '@/components/Button';
import { FaTimes } from 'react-icons/fa';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: ReactNode;
    title?: string;
    className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, content, title, className = '' }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'; // Prevent scrolling of background when modal is open.
        } else {
            document.body.style.overflow = 'auto'; // Re-enable scrolling when the modal closes.
        }

        return () => {
            document.body.style.overflow = 'auto'; // Ensure overflow is re-enabled when component unmounts.
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center">
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 bg-black/70" />

            {/* Modal Content */}
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                className={`relative z-50 w-full max-w-screen-xl ${className} p-6 rounded-lg shadow-xl bg-[var(--modal-background)] bg-opacity-95 mx-4 mt-4 max-h-[90vh] overflow-y-auto prose prose-invert`}
            >
                {/* Close Button */}
                <Button
                    onClick={onClose}
                    className="w-8 h-8 absolute top-2 right-2"
                >
                    <FaTimes size={16} />
                </Button>
                {/* Title */}
                {title && <h2 className="mb-4 text-[var(--text-highlight)]">{title}</h2>}

                {/* Render dynamic content */}
                <div className="mt-4">{content}</div>
            </div>
        </div>
    );
};

export default Modal;
