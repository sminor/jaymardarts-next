import React, { useState, useRef, useEffect } from 'react';
import Button from '@/components/Button';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

export interface TableOfContentsItem {
    id: string;
    title: string;
    content: React.ReactNode;
}

interface TOCModalProps {
    items: TableOfContentsItem[];
    scrollContainerRef: React.RefObject<HTMLDivElement>;
}

const TOCModal: React.FC<TOCModalProps> = ({ items, scrollContainerRef }) => {
    const [currentTOCIndex, setCurrentTOCIndex] = useState<number | null>(null);
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
        <div ref={scrollContainerRef}>
            {/* Table of Contents */}
            <div>
                <ul>
                    {items.map((toc, index) => (
                        <li key={toc.id}>
                            <button
                                className={`text-[var(--text-link)] ${currentTOCIndex === index ? "font-bold underline" : ""}`}
                                onClick={() => setCurrentTOCIndex(index)}
                            >
                                {toc.title}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Display selected TOC item */}
            {currentTOCIndex !== null && (
                <><hr />
                <div key={items[currentTOCIndex].id} ref={(el) => { tocRefs.current[items[currentTOCIndex].id] = el || null; }}>
                    <h3 id={items[currentTOCIndex].id} tabIndex={-1}>{items[currentTOCIndex].title}</h3>
                    <div>{items[currentTOCIndex].content}</div>
                </div>
                </>
            )}

            {/* Navigation Buttons */}
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
