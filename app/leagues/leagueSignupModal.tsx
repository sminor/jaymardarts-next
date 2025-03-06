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
    const [selectedLeague, setSelectedLeague] = useState<string>('');
    const [selectedPreference, setSelectedPreference] = useState<string>('');
    const [isTermsChecked, setIsTermsChecked] = useState(false);
    const [captainHasPaidNDA, setCaptainHasPaidNDA] = useState(false);
    const [teammateHasPaidNDA, setTeammateHasPaidNDA] = useState(false);
    const [totalDue, setTotalDue] = useState(0);
    const [captainLeagueCost, setCaptainLeagueCost] = useState(0);
    const [teammateLeagueCost, setTeammateLeagueCost] = useState(0);
    const [captainEmail, setCaptainEmail] = useState('');
    const [teammateEmail, setTeammateEmail] = useState('');
    const [captainPhoneNumber, setCaptainPhoneNumber] = useState('');
    const [teammatePhoneNumber, setTeammatePhoneNumber] = useState('');
    const [emailError, setEmailError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [teamName, setTeamName] = useState('');
    const [captainName, setCaptainName] = useState('');
    const [captainADLNumber, setCaptainADLNumber] = useState('');
    const [teammateName, setTeammateName] = useState('');
    const [teammateADLNumber, setTeammateADLNumber] = useState('');
    const [homeLocation1, setHomeLocation1] = useState('');
    const [homeLocation2, setHomeLocation2] = useState('');
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [paymentPreference, setSelectedPaymentPreference] = useState<string>('');


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
        if (!selectedLeague) {
            setTotalDue(0);
            setCaptainLeagueCost(0);
            setTeammateLeagueCost(0);
            return;
        }
    
        const league = leagues.find((l) => l.name === selectedLeague);
        const captainNDAFee = captainHasPaidNDA ? 0 : NDA_FEE;
        const teammateNDAFee = teammateHasPaidNDA ? 0 : NDA_FEE;
    
        if (!league) {
            setTotalDue(captainNDAFee + teammateNDAFee);
            setCaptainLeagueCost(0);
            setTeammateLeagueCost(0);
            return;
        }
    
        setCaptainLeagueCost(league.cost_per_player);
        setTeammateLeagueCost(league.cost_per_player);
        setTotalDue(league.cost_per_player * 2 + captainNDAFee + teammateNDAFee);
    }, [selectedLeague, captainHasPaidNDA, teammateHasPaidNDA, leagues]);
    
    

    const handleCaptainEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCaptainEmail(value);
        if (value && !isValidEmail(value)) {
            setEmailError('Invalid email format');
        } else {
            setEmailError('');
        }
    };

    const handleTeammateEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setTeammateEmail(value);
        if (value && !isValidEmail(value)) {
            setEmailError('Invalid email format');
        } else {
            setEmailError('');
        }
    };

    const handleCaptainPhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const formatted = formatPhoneNumber(value);
        setCaptainPhoneNumber(formatted);
        if (formatted.length !== 14 && formatted.length !== 10 && formatted.length !== 0) {
            setPhoneError('Invalid phone number');
        } else {
            setPhoneError('');
        }
    };

    const handleTeammatePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const formatted = formatPhoneNumber(value);
        setTeammatePhoneNumber(formatted);
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

        const formData: SignupFormData = {
            team_name: teamName,
            captain_name: captainName,
            captain_adl_number: captainADLNumber,
            captain_email: captainEmail,
            captain_phone_number: captainPhoneNumber,
            captain_paid_nda: captainHasPaidNDA,
            teammate_name: teammateName,
            teammate_adl_number: teammateADLNumber,
            teammate_email: teammateEmail,
            teammate_phone_number: teammatePhoneNumber,
            teammate_paid_nda: teammateHasPaidNDA,
            league_name: selectedLeague,
            home_location_1: homeLocation1,
            home_location_2: homeLocation2,
            play_preference: selectedPreference,
            total_fees_due: totalDue,
            captain_league_cost: captainLeagueCost,
            teammate_league_cost: teammateLeagueCost,
            payment_method: paymentPreference
        };

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
            alert(`Your signup was successful! You will now be redirected to complete your payment of $${totalDue.toFixed(2)}. Click "OK" to continue.`);
            
            // Encode teamName to ensure it is safe for URLs
            const encodedTeamName = encodeURIComponent(`League Signup: ${teamName}`);

            // Redirect to payment URL based on selection
            if (paymentPreference === 'Venmo') {
                const venmoUrl = `https://venmo.com/jay-phillips-36?txn=pay&amount=${totalDue.toFixed(2)}&note=${encodedTeamName}`;
                window.open(venmoUrl, '_blank');
            } else if (paymentPreference === 'Paypal') {
                const paypalUrl = `https://paypal.me/jayphillips1528/${totalDue.toFixed(2)}?currencyCode=USD&note=${encodedTeamName}`;
                window.open(paypalUrl, '_blank'); // Opens PayPal in a new tab
            }
            
        } catch (err) {
            console.error('Error submitting form:', err);
            setSubmissionError('There was an error submitting your form. Please try again.');
        }
    };



    return (
        <div className="flex justify-center">
            <form className="space-y-4 w-full max-w-lg md:max-w-2xl" onSubmit={handleSubmit}>
                {/* Informational Text */}
                <div className="mb-6 p-4 bg-[var(--card-background)] rounded-md text-sm">
                    <p className="mt-0">Sign-ups close on <strong className="underline">March 26, 2025</strong>. </p>
                    <p>League play begins the week of April 6th, 2025.</p>
                    <p>League Finals will be held at The Nugget, August 21-24th, 2025.</p>
                    <p className="mt-4 mb-0">Please fill out the form completely. If you do not have an ADL number, use N/A.</p>
                </div>

                {/* Team Information */}
                <div>
                    <label htmlFor="teamName" className="block text-sm font-medium">Team Name</label>
                    <input
                        type="text"
                        id="teamName"
                        required
                        className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                    />
                </div>

                {/* Captain Information */}
                <h3 className='font-bold'>Captain Information</h3>
                <div>
                    <label htmlFor="captainName" className="block text-sm font-medium">Captain Name</label>
                    <input
                        type="text"
                        id="captainName"
                        required
                        className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
                        value={captainName}
                        onChange={(e) => setCaptainName(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="captainADLNumber" className="block text-sm font-medium">Captain ADL Number</label>
                    <input
                        type="text"
                        id="captainADLNumber"
                        required
                        className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
                        value={captainADLNumber}
                        onChange={(e) => setCaptainADLNumber(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="captainEmail" className="block text-sm font-medium">Captain Email</label>
                    <input
                        type="email"
                        id="captainEmail"
                        value={captainEmail}
                        onChange={handleCaptainEmailChange}
                        required
                        className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
                    />
                    {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
                </div>
                <div>
                    <label htmlFor="captainPhoneNumber" className="block text-sm font-medium">Captain Phone Number</label>
                    <input
                        type="tel"
                        id="captainPhoneNumber"
                        value={captainPhoneNumber}
                        onChange={handleCaptainPhoneNumberChange}
                        required
                        className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
                    />
                    {phoneError && <p className="text-red-500 text-sm">{phoneError}</p>}
                </div>
                <div>
                    <input
                        type="checkbox"
                        id="captainPaidNDA"
                        checked={captainHasPaidNDA}
                        onChange={(e) => setCaptainHasPaidNDA(e.target.checked)}
                        className="mr-2 appearance-none h-5 w-5 border-2 border-[var(--select-border)] rounded-md checked:bg-[var(--checkbox-checkmark)] focus:outline-none"
                    />
                    <label htmlFor="captainPaidNDA">Captain has paid the yearly NDA sanction fee.</label>
                </div>

                {/* Teammate Information */}
                <h3 className='font-bold'>Teammate Information</h3>
                <div>
                    <label htmlFor="teammateName" className="block text-sm font-medium">Teammate Name</label>
                    <input
                        type="text"
                        id="teammateName"
                        required
                        className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
                        value={teammateName}
                        onChange={(e) => setTeammateName(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="teammateADLNumber" className="block text-sm font-medium">Teammate ADL Number</label>
                    <input
                        type="text"
                        id="teammateADLNumber"
                        required
                        className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
                        value={teammateADLNumber}
                        onChange={(e) => setTeammateADLNumber(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="teammateEmail" className="block text-sm font-medium">Teammate Email</label>
                    <input
                        type="email"
                        id="teammateEmail"
                        value={teammateEmail}
                        onChange={handleTeammateEmailChange}
                        required
                        className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
                    />
                    {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
                </div>
                <div>
                    <label htmlFor="teammatePhoneNumber" className="block text-sm font-medium">Teammate Phone Number</label>
                    <input
                        type="tel"
                        id="teammatePhoneNumber"
                        value={teammatePhoneNumber}
                        onChange={handleTeammatePhoneNumberChange}
                        required
                        className="mt-1 p-2 w-full border-2 border-[var(--select-border)] rounded-md bg-[var(--select-background)] text-[var(--select-text)] focus:outline-none"
                    />
                    {phoneError && <p className="text-red-500 text-sm">{phoneError}</p>}
                </div>
                <div>
                    <input
                        type="checkbox"
                        id="teammatePaidNDA"
                        checked={teammateHasPaidNDA}
                        onChange={(e) => setTeammateHasPaidNDA(e.target.checked)}
                        className="mr-2 appearance-none h-5 w-5 border-2 border-[var(--select-border)] rounded-md checked:bg-[var(--checkbox-checkmark)] focus:outline-none"
                    />
                    <label htmlFor="teammatePaidNDA">Teammate has paid the yearly NDA sanction fee.</label>
                </div>

                {/* League Selection */}
                <h3 className='font-bold'>League Selection</h3>
                <div>
                    <label htmlFor="league" className="block text-sm font-medium">What league are you playing in?</label>
                    <select
                        id="league"
                        value={selectedLeague}
                        onChange={(e) => setSelectedLeague(e.target.value)}
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
                    <label htmlFor="homeLocation1" className="block text-sm font-medium">Home Location 1st Choice</label>
                    <select
                        id="homeLocation1"
                        value={homeLocation1}
                        onChange={(e) => setHomeLocation1(e.target.value)}
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
                    <label htmlFor="homeLocation2" className="block text-sm font-medium">Home Location 2nd Choice</label>
                    <select
                        id="homeLocation2"
                        value={homeLocation2}
                        onChange={(e) => setHomeLocation2(e.target.value)}
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
                                name="playPreference"
                                value="Remote"
                                required
                                className="mr-2 appearance-none h-5 w-5 border-2 border-[var(--select-border)] rounded-full checked:bg-[var(--checkbox-checkmark)] focus:outline-none"
                                onChange={() => setSelectedPreference('Remote')}
                                checked={selectedPreference === 'Remote'}
                            />
                            <label htmlFor="remote">Remote</label>
                        </div>
                        <div>
                            <input
                                type="radio"
                                id="inPerson"
                                name="playPreference"
                                value="In-person"
                                required
                                className="mr-2 appearance-none h-5 w-5 border-2 border-[var(--select-border)] rounded-full checked:bg-[var(--checkbox-checkmark)] focus:outline-none"
                                onChange={() => setSelectedPreference('In-person')}
                                checked={selectedPreference === 'In-person'}
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
                        <li>Captain League Fee: <strong>${captainLeagueCost.toFixed(2)}</strong></li>
                        <li>Teammate League Fee: <strong>${teammateLeagueCost.toFixed(2)}</strong></li>
                        {!captainHasPaidNDA && <li>Captain NDA Sanctioning Fee: <strong>${NDA_FEE.toFixed(2)}</strong></li>}
                        {!teammateHasPaidNDA && <li>Teammate NDA Sanctioning Fee: <strong>${NDA_FEE.toFixed(2)}</strong></li>}
                    </ul>

                    <p className="mt-2">Fees Due:</p>
                    <ul className="list-disc list-inside">
                        <li>Total: <strong>${totalDue.toFixed(2)}</strong></li>
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
                <h3 className='font-bold'>Payment Preference</h3>
                <div>
                    <label className="block text-sm font-medium">How would you prefer to pay?</label>
                    <div className="mt-1 flex gap-4">
                        <div>
                            <input
                                type="radio"
                                id="venmo"
                                name="paymentPreference"
                                value="Venmo"
                                required
                                className="mr-2 appearance-none h-5 w-5 border-2 border-[var(--select-border)] rounded-full checked:bg-[var(--checkbox-checkmark)] focus:outline-none"
                                onChange={() => setSelectedPaymentPreference('Venmo')}
                                checked={paymentPreference === 'Venmo'}
                            />
                            <label htmlFor="venmo">Venmo</label>
                        </div>
                        <div>
                            <input
                                type="radio"
                                id="paypal"
                                name="paymentPreference"
                                value="Paypal"
                                required
                                className="mr-2 appearance-none h-5 w-5 border-2 border-[var(--select-border)] rounded-full checked:bg-[var(--checkbox-checkmark)] focus:outline-none"
                                onChange={() => setSelectedPaymentPreference('Paypal')}
                                checked={paymentPreference === 'Paypal'}
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
