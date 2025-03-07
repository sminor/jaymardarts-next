import React, { useState, useRef, useEffect } from 'react';
import Button from '@/components/Button';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

export interface Content {
    id: string;
    title: string;
    content: React.ReactNode;
}

export const leagueInfo: Content[] = [
    {
        id: "league-structure",
        title: "League Structure & Format",
        content: (
            <>
                <p>We offer two types of leagues:</p>
                <ul>
                    <li><strong>Open League:</strong> No cap on player ratings.</li>
                    <li><strong>Capped League:</strong> Players must meet rating restrictions.</li>
                </ul>
                <p><strong>League Format:</strong></p>
                <ul>
                    <li>Each team consists of <strong>2 players</strong>.</li>
                    <li>Games include <strong>501 (701 in higher divisions) and Cricket</strong>.</li>
                    <li>The season lasts <strong>15 weeks</strong>, followed by playoffs and finals.</li>
                    <li><strong>Finals take place in Reno.</strong></li>
                </ul>
            </>
        )
    },
    {
        id: "match-details",
        title: "Match Information",
        content: (
            <>
                <p><strong>Match Days:</strong> Varies by flight.</p>
                <p><strong>Match Duration:</strong> Typically <strong>2 hours</strong>.</p>
                <p><strong>Missed Matches & Substitutes:</strong></p>
                <ul>
                    <li>A substitute may play if they are rated equal or lower, but <strong>all substitutes must be approved</strong>.</li>
                    <li>Matches can be rescheduled if necessary, but <strong>all reschedules require approval</strong>. Contact us to request a reschedule.</li>
                </ul>
            </>
        )
    },
    {
        id: "fees-payments",
        title: "Fees & Payments",
        content: (
            <>
                <p><strong>League Fees (Due at Registration):</strong></p>
                <ul>
                    <li><strong>Open League:</strong> $50 per person</li>
                    <li><strong>Capped League:</strong> $25 per person</li>
                </ul>
                <p><strong>NDA Sanction Fee:</strong> $10 per person per year (only paid once per calendar year).</p>
                <p><strong>Weekly Board Fees:</strong> $17 per person per match (paid in cash at the dartboard).</p>
                <p><strong>Accepted Payment Methods:</strong></p>
                <ul>
                    <li><strong>Venmo & PayPal:</strong> Accepted for League Fees and NDA Sanctioning.</li>
                    <li><strong>Cash Only:</strong> Required for weekly board fees.</li>
                </ul>
            </>
        )
    },
    {
        id: "eligibility-rules",
        title: "Player Eligibility & League Rules",
        content: (
            <>
                <p><strong>Skill Levels:</strong> No restrictions! We have divisions and flights for all skill levels.</p>
                <p><strong>Equipment Rules:</strong> Matches follow <strong>Action Dart League (ADL) Rules</strong>. See full rules here:</p>
                <p>
                    <a href="http://actiondartleague.com/AutoRecovery_save_of_ADL_Rules_and_Guidelines-Player_Handbook-NEW-Updated.pdf" className="text-[var(--text-link))] underline" target="_blank" rel="noopener noreferrer">
                        ADL Player Handbook
                    </a>
                </p>
            </>
        )
    },
    {
        id: "signup",
        title: "How to Sign Up",
        content: (
            <>
                <p>Players can sign up using the <strong>sign-up form on this website</strong>.</p>
                <p>All fees are <strong>due at signup</strong>. Failure to pay may result in removal from the league.</p>
            </>
        )
    },
    {
        id: "contact",
        title: "Need Help or Have Questions?",
        content: (
            <p>If you have any questions, need approval for a substitute, or need to reschedule a match, please <a href="mailto:jaymardarts@gmail.com" className="text-[var(--text-link))] underline">contact us</a> for assistance.</p>
        )
    }
];



interface LeagueInfoProps {
    items: Content[];
}

// Table of Contents Component
export const LeagueInfoContent: React.FC<LeagueInfoProps> = ({ items }) => {
    const [currentTOCIndex, setCurrentTOCIndex] = useState<number | null>(null);
    const tocRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    useEffect(() => {
        if (currentTOCIndex !== null) {
            const selectedTOC = items[currentTOCIndex];

            setTimeout(() => {
                const targetElement = tocRefs.current[selectedTOC.id];
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
                    targetElement.focus();
                }
            }, 100);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTOCIndex]);

    return (
        <div>
            {/* Table of Contents */}
            <div>
                <ul>
                    {items.map((toc, index) => (
                        <li key={toc.id}>
                            <button
                                className={`text-[var(--text-link)] text-left ${currentTOCIndex === index ? "font-bold underline" : ""}`}
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
