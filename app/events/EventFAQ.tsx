import React, { useState, useRef, useEffect } from 'react';
import Button from '@/components/Button';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

const EventsFAQ = () => {
    const faqs = [
        { 
            id: "signup-times", 
            question: "What are the sign-up times?", 
            answer: (
                <>
                <p>{`Sign-up times vary by event. Be sure to check each event's details for specific times, and please arrive early, as we cannot accommodate late sign-ups.`}</p>
                </>
            )
        },
        { 
            id: "event-start-time", 
            question: "What time does the event start?", 
            answer: (
                <>
                <p>{`We aim to start the first match 30 minutes after sign-ups close. Start times can vary depending on the number of participants, so please be patient as we set up the matches.`}</p>
                </>
            )
        },
        { 
            id: "how-to-register", 
            question: "How do I register for events?", 
            answer: (
                <>
                <p>{`To register for an event, simply show up at the event location, give your name to the tournament operator, and pay your entry fee. Please note: We accept cash only.`}</p>
                </>
            )
        },
        { 
            id: "age-restrictions", 
            question: "Are there age restrictions for tournaments?", 
            answer: (
                <>
                <p>{`We do not impose age restrictions for our tournaments. However, please check with the event venue directly, as many venues have age limits.`}</p>
                </>
            )
        },
        { 
            id: "beginners-play", 
            question: "Can beginners play in tournaments?", 
            answer: (
                <>
                <p>{`Absolutely! We welcome players of all skill levels. Tournaments are a great way to learn, have fun, and meet fellow dart enthusiasts.`}</p>
                </>
            )
        },
        { 
            id: "what-to-bring", 
            question: "What should I bring to the event?", 
            answer: (
                <>
                <p>{`Just bring your darts (if you have them), some cash for entry and board fees, and a positive attitude! Everything else you need will be provided at the event.`}</p>
                </>
            )
        },
        { 
            id: "cost-to-play", 
            question: "How much does it cost to play?", 
            answer: (
                <>
                <p>{`Entry fees vary by event. Most events have a $10 per person entry fee. Depending on how many games you play, board fees will vary. Typically, players should budget around $25 for the entry fee and board fees combined. Check the event details for specific costs.`}</p>
                </>
            )
        },
        { 
            id: "bring-own-darts", 
            question: "Do I need to bring my own darts?", 
            answer: (
                <>
                <p>{`You're welcome to bring your own soft-tip darts (under 20 grams). If you don't have your own, no worries! We provide house darts free of charge.`}</p>
                </>
            )
        },
        { 
            id: "no-partner", 
            question: "What if I don't have a partner?", 
            answer: (
                <>
                <p>{`Not a problem! Most of our events allow individual sign-ups, and we'll pair you with a partner. Many events use a draw format, where lower-rated players are paired with higher-rated players to keep things fair and fun.`}</p>
                <p>{`For "Bring" events, you'll need to bring your own partner, and the team must meet the event's rating cap. For example, in a "20-point bring," the combined rating of both partners cannot exceed 20 points. Check each event's details for specific rating caps.`}</p>
                </>
            )
        },
        { 
            id: "tournament-types", 
            question: "What types of tournaments do you offer?", 
            answer: (
                <>
                <ul>
                    <li>{`A/B Draw: Players are split into two skill groups, with one player from each group forming a team.`}</li>
                    <li>{`Blind Draw: Players are randomly paired with a partner.`}</li>
                    <li>{`Low Player Pick: Lower-rated players get to choose their partners.`}</li>
                    <li>{`Ladies Pick: Ladies have the opportunity to select their partners.`}</li>
                    <li>{`Partner Brings: You bring your own partner, subject to any rating caps for the event.`}</li>
                </ul>
                </>
            )
        },
        { 
            id: "game-types", 
            question: "What are the common game types played?", 
            answer: (
                <>
                <ul>
                    <li>{`Cricket: A strategy game focusing on hitting specific numbers (15-20 and the bullseye) to score points.`}</li>
                    <li>{`x01 Games (e.g., 301, 501): Players start with a set score (e.g., 301 or 501) and work down to zero. In soft-tip tournaments, you typically do not need to double out. If a specific event requires a double or "master out," this will be noted in the event details.`}</li>
                </ul>
                </>
            )
        },
        { 
            id: "player-ratings", 
            question: "How are player ratings handled?", 
            answer: (
                <>
                <p>{`New players usually play a few warm-up games to establish an initial rating. If you've used the Bullshooter app or played in other leagues, we can often use that data as a starting point. Our tournament software tracks performance over time to ensure ratings remain accurate and fair.`}</p>
                </>
            )
        },
        { 
            id: "handicap", 
            question: "What is a handicap, and how does it work?", 
            answer: (
                <>
                <p>{`A handicap helps level the playing field by giving lower-rated players a slight advantage. Depending on the event, the handicap might adjust the starting score in x01 games or modify scoring rules in Cricket. Check event details for specific handicap information.`}</p>
                </>
            )
        },
        { 
            id: "rating-cap", 
            question: "How does the rating cap work in 'Bring' events?", 
            answer: (
                <>
                <p>{`For "Bring" events, a rating cap sets the maximum combined rating for a team. For example, in a "20-point bring," the total of both players' ratings cannot exceed 20. This keeps the competition balanced and fair.`}</p>
                </>
            )
        }
    ];

    const [currentFAQIndex, setCurrentFAQIndex] = useState<number | null>(null);
    const faqRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const modalContentRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (currentFAQIndex !== null) {
            const selectedFAQ = faqs[currentFAQIndex];

            setTimeout(() => {
                const targetElement = faqRefs.current[selectedFAQ.id];
                if (targetElement && modalContentRef.current) {
                    targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            }, 100); 
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentFAQIndex]);

    return (
        <div ref={modalContentRef} className="modal-content p-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-[var(--text-highlight)]">Event FAQs</h2>

            <div className="mb-4">
                <ul>
                    {faqs.map((faq, index) => (
                        <li key={faq.id}>
                            <button
                                className={`text-left text-[var(--text-link)] ${currentFAQIndex === index ? "font-bold underline" : ""}`}
                                onClick={() => setCurrentFAQIndex(index)}
                            >
                                {faq.question}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {currentFAQIndex !== null && (
                <div key={faqs[currentFAQIndex].id} ref={(el) => { faqRefs.current[faqs[currentFAQIndex].id] = el || null; }} className="mb-4">
                    <h3 id={faqs[currentFAQIndex].id} className="text-lg font-medium underline mb-2">{faqs[currentFAQIndex].question}</h3>
                    <div>{faqs[currentFAQIndex].answer}</div>
                </div>
            )}

            {currentFAQIndex !== null && (
                <div className="flex justify-center gap-4 mt-4">
                    <Button
                        onClick={() => setCurrentFAQIndex(Math.max(currentFAQIndex - 1, 0))}
                        className="p-2 rounded w-10 h-10 flex items-center justify-center"
                        disabled={currentFAQIndex === 0}
                    >
                        <FaArrowLeft />
                    </Button>

                    <Button
                        onClick={() => setCurrentFAQIndex(Math.min(currentFAQIndex + 1, faqs.length - 1))}
                        className="p-2 rounded w-10 h-10 flex items-center justify-center"
                        disabled={currentFAQIndex === faqs.length - 1}
                    >
                        <FaArrowRight />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default EventsFAQ;
