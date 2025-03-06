'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';

interface Location {
    id: number;
    name: string;
    league: boolean;
}

interface League {
    id: string;
    name: string;
    cap_details: string;
    day_of_week: string;
    start_time: string;
    league_full: boolean;
    order: number;
    cost_per_player: number;
}

interface SignupFormData {
    team_name: string;
    captain_name: string;
    captain_adl_number: string;
    captain_email: string;
    captain_phone_number: string;
    captain_paid_nda: boolean;
    teammate_name: string;
    teammate_adl_number: string;
    teammate_email: string;
    teammate_phone_number: string;
    teammate_paid_nda: boolean;
    league_name: string;
    home_location_1: string;
    home_location_2: string;
    play_preference: string;
    total_fees_due: number;
    captain_league_cost: number;
    teammate_league_cost: number;
    payment_method: string;
}

// Helper function to validate email format
const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Helper function to format phone numbers
const formatPhoneNumber = (phoneNumber: string): string => {
    const cleaned = ('' + phoneNumber).replace(/\D/g, '');
    let formatted = cleaned;

    if (cleaned.length === 11 && cleaned.startsWith('1')) {
        formatted = cleaned.substring(1); // Remove the leading '1'
    }

    if (formatted.length !== 10) {
        return cleaned;
    }
    const match = formatted.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return formatted;
};

const NDA_FEE = 10;

const LeagueSignupForm: React.FC<{ closeModal: () => void }> = ({ closeModal }) => {
    const [locations, setLocations] = useState<Location[]>([]);
    const [leagues, setLeagues] = useState<League[]>([]);
    const [formData, setFormData] = useState<SignupFormData>({
        team_name: '',
        captain_name: '',
        captain_adl_number: '',
        captain_email: '',
        captain_phone_number: '',
        captain_paid_nda: false,
        teammate_name: '',
        teammate_adl_number: '',
        teammate_email: '',
        teammate_phone_number: '',
        teammate_paid_nda: false,
        league_name: '',
        home_location_1: '',
        home_location_2: '',
        play_preference: '',
        total_fees_due: 0,
        captain_league_cost: 0,
        teammate_league_cost: 0,
        payment_method: ''
    });
    const [isTermsChecked, setIsTermsChecked] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [emailError, setEmailError] = useState('');
    const [phoneError, setPhoneError] = useState('');


    useEffect(() => {
        const fetchLeagues = async () => {
            try {
                const { data, error } = await supabase
                    .from('leagues')
                    .select('id, name, cap_details, day_of_week, start_time, league_full, "order", cost_per_player')
                    .order('order', { ascending: true });

                if (error) throw error;
                if (data) setLeagues(data as League[]);
            } catch (error) {
                console.error('Error fetching leagues:', error);
            }
        };
        const fetchLocations = async () => {
            try {
                const { data, error } = await supabase
                    .from('locations')
                    .select('id, name, league')
                    .eq('league', true);

                if (error) throw error;
                if (data) setLocations(data as Location[]);
            } catch (error) {
                console.error('Error fetching locations:', error);
            }
        };


        fetchLeagues();
        fetchLocations();


    }, []);

    useEffect(() => {
        if (!formData.league_name) {
            setFormData((prev) => ({
                ...prev,
                total_fees_due: 0,
                captain_league_cost: 0,
                teammate_league_cost: 0
            }));
            return;
        }

        const league = leagues.find((l) => l.name === formData.league_name);
        const captainNDAFee = formData.captain_paid_nda ? 0 : NDA_FEE;
        const teammateNDAFee = formData.teammate_paid_nda ? 0 : NDA_FEE;

        if (!league) {
            setFormData((prev) => ({
                ...prev,
                total_fees_due: captainNDAFee + teammateNDAFee,
                captain_league_cost: 0,
                teammate_league_cost: 0
            }));
            return;
        }

        setFormData((prev) => ({
            ...prev,
            captain_league_cost: league.cost_per_player,
            teammate_league_cost: league.cost_per_player,
            total_fees_due: league.cost_per_player * 2 + captainNDAFee + teammateNDAFee
        }));
    }, [formData.league_name, formData.captain_paid_nda, formData.teammate_paid_nda, leagues]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value, type, checked, name } = e.target as HTMLInputElement;
        setFormData((prev) => ({
            ...prev,
            [type === 'radio' ? name : id]: type === 'checkbox' ? checked : value
        }));
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'captain_email' | 'teammate_email') => {
        const value = e.target.value;
        setFormData((prev) => ({
            ...prev,
            [field]: value
        }));
        if (value && !isValidEmail(value)) {
            setEmailError('Invalid email format');
        } else {
            setEmailError('');
        }
    };

    const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'captain_phone_number' | 'teammate_phone_number') => {
        const value = e.target.value;
        const formatted = formatPhoneNumber(value);
        setFormData((prev) => ({
            ...prev,
            [field]: formatted
        }));
        if (formatted.length !== 14 && formatted.length !== 10 && formatted.length !== 0) {
            setPhoneError('Invalid phone number');
        } else {
            setPhoneError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmissionError(null);

        // Validate email and phone number formats
        if (emailError || phoneError) {
            setSubmissionError('Please correct any email or phone number errors.');
            return;
        }

        try {
            const { error } = await supabase
                .from('league_signups')
                .insert([formData])
                .select()
                .single();

            if (error) {
                throw error;
            }

            // Close the modal before redirecting
            closeModal();

            // Show success message (user must acknowledge before continuing)
            alert(`Your signup was successful! You will now be redirected to complete your payment of $${formData.total_fees_due.toFixed(2)}. Click "OK" to continue.`);
            
            // Encode teamName to ensure it is safe for URLs
            const encodedTeamName = encodeURIComponent(`League Signup: ${formData.team_name}`);

            // Redirect to payment URL based on selection
            if (formData.payment_method === 'Venmo') {
                const venmoUrl = `https://venmo.com/jay-phillips-36?txn=pay&amount=${formData.total_fees_due.toFixed(2)}&note=${encodedTeamName}`;
                window.open(venmoUrl, '_blank');
            } else if (formData.payment_method === 'Paypal') {
                const paypalUrl = `https://paypal.me/jayphillips1528/${formData.total_fees_due.toFixed(2)}?currencyCode=USD&note=${encodedTeamName}`;
                window.open(paypalUrl, '_blank'); // Opens PayPal in a new tab
            }
            
        } catch (err) {
            if (err instanceof Error) {
                console.error('Error submitting form:', err.message);
            } else {
                console.error('Error submitting form:', err);
            }
            setSubmissionError('There was an error submitting your form. Please try again.');
        }
    };



    return (
        <div className="flex justify-center">
            <form className="space-y-4 w-full md:max-w-2xl" onSubmit={handleSubmit}>
                {/* Informational Text */}
                <div className="mb-6 p-4 bg-[var(--card-background)] rounded-md text-sm">
                    <p className="mt-0">Sign-ups close on <strong className="underline">March 26, 2025</strong>. </p>
                    <p>League play begins the week of April 6th, 2025.</p>
                    <p>League Finals will be held at The Nugget, August 21-24th, 2025.</p>
                    <p className="mt-4 mb-0">Please fill out the form completely. If you do not have an ADL number, use N/A.</p>
                </div>

                {/* Team Information */}
                <div>
                    <label htmlFor="team_name" className="block text-sm font-medium">Team Name</label>
                    <input
                        type="text"
                        id="team_name"
                        required
                        className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
                        value={formData.team_name}
                        onChange={handleInputChange}
                    />
                </div>

                {/* Captain Information */}
                <h3 className='font-bold'>Captain Information</h3>
                <div>
                    <label htmlFor="captain_name" className="block text-sm font-medium">Captain Name</label>
                    <input
                        type="text"
                        id="captain_name"
                        required
                        className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
                        value={formData.captain_name}
                        onChange={handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="captain_adl_number" className="block text-sm font-medium">Captain ADL Number</label>
                    <input
                        type="text"
                        id="captain_adl_number"
                        required
                        className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
                        value={formData.captain_adl_number}
                        onChange={handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="captain_email" className="block text-sm font-medium">Captain Email</label>
                    <input
                        type="email"
                        id="captain_email"
                        value={formData.captain_email}
                        onChange={(e) => handleEmailChange(e, 'captain_email')}
                        required
                        className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
                    />
                    {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
                </div>
                <div>
                    <label htmlFor="captain_phone_number" className="block text-sm font-medium">Captain Phone Number</label>
                    <input
                        type="tel"
                        id="captain_phone_number"
                        value={formData.captain_phone_number}
                        onChange={(e) => handlePhoneNumberChange(e, 'captain_phone_number')}
                        required
                        className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
                    />
                    {phoneError && <p className="text-red-500 text-sm">{phoneError}</p>}
                </div>
                <div>
                    <input
                        type="checkbox"
                        id="captain_paid_nda"
                        checked={formData.captain_paid_nda}
                        onChange={handleInputChange}
                        className="mr-2 appearance-none h-5 w-5 border-2 border-[var(--select-border)] rounded-md checked:bg-[var(--checkbox-checkmark)] focus:outline-none"
                    />
                    <label htmlFor="captain_paid_nda">Captain has paid the yearly NDA sanction fee.</label>
                </div>

                {/* Teammate Information */}
                <h3 className='font-bold'>Teammate Information</h3>
                <div>
                    <label htmlFor="teammate_name" className="block text-sm font-medium">Teammate Name</label>
                    <input
                        type="text"
                        id="teammate_name"
                        required
                        className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
                        value={formData.teammate_name}
                        onChange={handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="teammate_adl_number" className="block text-sm font-medium">Teammate ADL Number</label>
                    <input
                        type="text"
                        id="teammate_adl_number"
                        required
                        className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
                        value={formData.teammate_adl_number}
                        onChange={handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="teammate_email" className="block text-sm font-medium">Teammate Email</label>
                    <input
                        type="email"
                        id="teammate_email"
                        value={formData.teammate_email}
                        onChange={(e) => handleEmailChange(e, 'teammate_email')}
                        required
                        className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
                    />
                    {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
                </div>
                <div>
                    <label htmlFor="teammate_phone_number" className="block text-sm font-medium">Teammate Phone Number</label>
                    <input
                        type="tel"
                        id="teammate_phone_number"
                        value={formData.teammate_phone_number}
                        onChange={(e) => handlePhoneNumberChange(e, 'teammate_phone_number')}
                        required
                        className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
                    />
                    {phoneError && <p className="text-red-500 text-sm">{phoneError}</p>}
                </div>
                <div>
                    <input
                        type="checkbox"
                        id="teammate_paid_nda"
                        checked={formData.teammate_paid_nda}
                        onChange={handleInputChange}
                        className="mr-2 appearance-none h-5 w-5 border-2 border-[var(--select-border)] rounded-md checked:bg-[var(--checkbox-checkmark)] focus:outline-none"
                    />
                    <label htmlFor="teammate_paid_nda">Teammate has paid the yearly NDA sanction fee.</label>
                </div>

                {/* League Selection */}
                <h3 className='font-bold'>League Selection</h3>
                <div>
                    <label htmlFor="league_name" className="block text-sm font-medium">What league are you playing in?</label>
                    <select
                        id="league_name"
                        value={formData.league_name}
                        onChange={handleInputChange}
                        required
                        className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
                    >
                        <option value="">Select a league</option>
                        {leagues.map((league) => (
                            <option key={league.id} value={league.name}>
                                {league.name} - {league.cap_details} {league.day_of_week} {league.start_time}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Home Location Selection */}
                <div>
                    <label htmlFor="home_location_1" className="block text-sm font-medium">Home Location 1st Choice</label>
                    <select
                        id="home_location_1"
                        value={formData.home_location_1}
                        onChange={handleInputChange}
                        required
                        className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
                    >
                        <option value="">Select a location</option>
                        {locations.map(location => (
                            <option key={location.id} value={location.name}>{location.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="home_location_2" className="block text-sm font-medium">Home Location 2nd Choice</label>
                    <select
                        id="home_location_2"
                        value={formData.home_location_2}
                        onChange={handleInputChange}
                        required
                        className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
                    >
                        <option value="">Select a location</option>
                        {locations.map(location => (
                            <option key={location.id} value={location.name}>{location.name}</option>
                        ))}
                    </select>
                </div>

                {/* Play Preference */}
                <div>
                    <label className="block text-sm font-medium">I prefer to play</label>
                    <div className="mt-1 flex gap-4">
                        <div>
                            <input
                                type="radio"
                                id="remote"
                                name="play_preference"
                                value="Remote"
                                required
                                className="mr-2 appearance-none h-5 w-5 border-2 border-[var(--select-border)] rounded-full checked:bg-[var(--checkbox-checkmark)] focus:outline-none"
                                onChange={handleInputChange}
                                checked={formData.play_preference === 'Remote'}
                            />
                            <label htmlFor="remote">Remote</label>
                        </div>
                        <div>
                            <input
                                type="radio"
                                id="inPerson"
                                name="play_preference"
                                value="In-person"
                                required
                                className="mr-2 appearance-none h-5 w-5 border-2 border-[var(--select-border)] rounded-full checked:bg-[var(--checkbox-checkmark)] focus:outline-none"
                                onChange={handleInputChange}
                                checked={formData.play_preference === 'In-person'}
                            />
                            <label htmlFor="inPerson">In-person</label>
                        </div>
                    </div>
                </div>


                {/* Payment Information */}
                <div className="mb-6 p-4 bg-[var(--card-background)] rounded-md text-sm">
                    <p>I understand that I will have to pay upon completion of this form.</p>
                    <p className='mt-2'>Sign Up Fees:</p>
                    <ul className="list-disc list-inside">
                        <li>Captain League Fee: <strong>${formData.captain_league_cost.toFixed(2)}</strong></li>
                        <li>Teammate League Fee: <strong>${formData.teammate_league_cost.toFixed(2)}</strong></li>
                        {!formData.captain_paid_nda && <li>Captain NDA Sanctioning Fee: <strong>${NDA_FEE.toFixed(2)}</strong></li>}
                        {!formData.teammate_paid_nda && <li>Teammate NDA Sanctioning Fee: <strong>${NDA_FEE.toFixed(2)}</strong></li>}
                    </ul>

                    <p className="mt-2">Fees Due:</p>
                    <ul className="list-disc list-inside">
                        <li>Total: <strong>${formData.total_fees_due.toFixed(2)}</strong></li>
                    </ul>
                    <hr />
                    <p>This league is ADL, NDA, and NADO sanctioned.</p>
                    <p>I understand that I must abide by the <a href='http://actiondartleague.com/AutoRecovery_save_of_ADL_Rules_and_Guidelines-Player_Handbook-NEW-Updated.pdf' target='_blank' rel='noreferrer'>league rules</a>, and failure to do so may result in disqualification for the season and future leagues.</p>
                    <p>I am aware that this is a 15-week league.</p>
                    <p>If a match needs to be rescheduled or a substitute player must play, it is the team/player&apos;s responsibility to contact JayMar for approval as soon as reasonably possible.</p>
                    <p>It is the team/player&apos;s responsibility to find a suitable substitute player.</p>
                    <p className="mb-2">NO REFUNDS AFTER SIGN-UPS CLOSE</p>
                    <p className="mt-4 mb-0 text-[var(--text-highlight)]"><span className="font-bold">Entire team fees are due at the time of sign-up. Please pay the full amount for both players.</span></p>
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-center">
                    <input type="checkbox" id="terms" required className="mr-2 appearance-none h-5 w-5 border-2 border-[var(--select-border)] rounded-md checked:bg-[var(--checkbox-checkmark)] focus:outline-none" checked={isTermsChecked} onChange={() => setIsTermsChecked(!isTermsChecked)} />
                    <label htmlFor="terms" className="text-sm font-medium">I agree to the terms provided above</label>
                </div>

                {/* Payment Preference */}
                <h3 className='font-bold'>Payment Method</h3>
                <div>
                    <label className="block text-sm font-medium"></label>
                    <div className="mt-1 flex gap-4">
                        <div>
                            <input
                                type="radio"
                                id="venmo"
                                name="payment_method"
                                value="Venmo"
                                required
                                className="mr-2 appearance-none h-5 w-5 border-2 border-[var(--select-border)] rounded-full checked:bg-[var(--checkbox-checkmark)] focus:outline-none"
                                onChange={handleInputChange}
                                checked={formData.payment_method === 'Venmo'}
                            />
                            <label htmlFor="venmo">Venmo</label>
                        </div>
                        <div>
                            <input
                                type="radio"
                                id="paypal"
                                name="payment_method"
                                value="Paypal"
                                required
                                className="mr-2 appearance-none h-5 w-5 border-2 border-[var(--select-border)] rounded-full checked:bg-[var(--checkbox-checkmark)] focus:outline-none"
                                onChange={handleInputChange}
                                checked={formData.payment_method === 'Paypal'}
                            />
                            <label htmlFor="paypal">Paypal</label>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button type="submit" className="w-full p-2 text-white bg-[var(--button-background)] rounded-md">Submit</button>

                {submissionError && (
                    <div className="text-red-500 text-center mb-4">
                        {submissionError}
                    </div>
                )}
            </form>
        </div>
    );
};

export default LeagueSignupForm;
