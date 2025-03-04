// app/events/codeOfConductContent.tsx
import React from 'react';
import { InfoItem } from '@/components/InfoModal';

export const codeOfConductInfo: InfoItem[] = [
    {
        id: 'code-of-conduct-info',
        content: (
            <div>
                <p>
                    At Jaymar Darts, we are committed to fostering a welcoming,
                    inclusive, and enjoyable environment for all players. Our
                    Code of Conduct sets the expectations for behavior,
                    sportsmanship, and respect at all our events.
                </p>

                <h3>Respect and Inclusion</h3>
                <p>
                    We expect all participants to treat each other with respect,
                    regardless of skill level, gender, race, religion, or any
                    other personal characteristic. Discriminatory, harassing, or
                    offensive behavior will not be tolerated. Our tournament
                    operators are dedicated volunteers—please show them the
                    same respect you would expect in return.
                </p>

                <h3>Sportsmanship and Fair Play</h3>
                <p>
                    Good sportsmanship is fundamental to our community. Play by
                    the rules, demonstrate grace in both victory and defeat, and
                    always show respect to your teammates and opponents.
                    Cheating or any attempt to gain an unfair advantage is
                    strictly prohibited and may result in disqualification.
                </p>

                <h3>Rule Compliance</h3>
                <p>
                    All players are responsible for understanding and adhering to
                    the official rules of play. If you have any questions,
                    please ask a tournament operator. Our tournament operators
                    will make decisions in the spirit of fair play, and their
                    decisions are final, intended to keep the tournament fair
                    and fun for everyone.
                </p>

                <h3>Conflict Resolution</h3>
                <p>
                    If any concerns or issues arise during the event, please
                    bring them to the attention of a tournament operator. We
                    are here to help resolve matters quickly and fairly to
                    ensure the best experience for all.
                </p>

                <h3>Enjoy the Game</h3>
                <p>
                    Most importantly, remember that we are all here to have fun
                    and enjoy the game of darts. A positive attitude and good
                    sportsmanship help create a great experience for everyone!
                </p>

                <p>
                    By participating in Jaymar Darts events, you agree to abide
                    by this Code of Conduct. We appreciate your cooperation in
                    making our tournaments safe, respectful, and enjoyable for
                    all.
                </p>
            </div>
        ),
    },
];
