// components/ModalTOC.tsx
import React, { useState, useRef, useEffect } from 'react';
import Button from '@/components/Button';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

export interface TOCItem {
    id: string;
    title: string;
    content: React.ReactNode;
}

interface TOCModalProps {
    items: TOCItem[];
    scrollContainerRef: React.RefObject<HTMLDivElement>;
}

const TOCModal: React.FC<TOCModalProps> = ({ items, scrollContainerRef }) => {
    const [currentTOCIndex, setCurrentTOCIndex] = useState<number>(0);
    const tocRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    useEffect(() => {
        if (currentTOCIndex !== null) {
            const selectedTOC = items[currentTOCIndex];

            setTimeout(() => {
                if (scrollContainerRef.current) {
                    const targetElement = tocRefs.current[selectedTOC.id];
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
                        targetElement.focus();
                    }
                }
            }, 100);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTOCIndex]);

    return (
        <div ref={scrollContainerRef} className="p-4 max-h-[80vh] overflow-y-auto">

            <div className="mb-4">
                <ul>
                    {items.map((toc, index) => (
                        <li key={toc.id}>
                            <button
                                className={`text-left text-[var(--text-link)] ${currentTOCIndex === index ? "font-bold underline" : ""}`}
                                onClick={() => setCurrentTOCIndex(index)}
                            >
                                {toc.title}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {currentTOCIndex !== null && (
                <div key={items[currentTOCIndex].id} ref={(el) => { tocRefs.current[items[currentTOCIndex].id] = el || null; }} className="mb-4">
                    <h3 id={items[currentTOCIndex].id} tabIndex={-1} className="text-lg font-medium underline mb-2">{items[currentTOCIndex].title}</h3>
                    <div>{items[currentTOCIndex].content}</div>
                </div>
            )}

            {currentTOCIndex !== null && (
                <div className="flex justify-center gap-4 mt-4">
                    <Button
                        onClick={() => setCurrentTOCIndex(Math.max(currentTOCIndex - 1, 0))}
                        className="p-2 rounded w-10 h-10 flex items-center justify-center"
                        disabled={currentTOCIndex === 0}
                    >
                        <FaArrowLeft />
                    </Button>

                    <Button
                        onClick={() => setCurrentTOCIndex(Math.min(currentTOCIndex + 1, items.length - 1))}
                        className="p-2 rounded w-10 h-10 flex items-center justify-center"
                        disabled={currentTOCIndex === items.length - 1}
                    >
                        <FaArrowRight />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default TOCModal;
