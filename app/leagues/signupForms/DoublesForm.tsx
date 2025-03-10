// app/leagues/signupForms/DoublesForm.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { calculateFees, isValidEmail, formatPhoneNumber, isValidPhoneNumber } from '@/utils/formHelpers';

interface SignupSettings {
  id: string;
  name: string;
  signup_start: string;
  signup_close: string;
  league_info: string | null;
  form_type: string;
}

interface LeagueDetails {
  id: string;
  name: string;
  cost_per_player: number;
  sanction_fee: number;
  cap_details: string;
  day_of_week: string;
  start_time: string;
  signup_settings_id: string | null;
}

interface Location {
  id: number;
  name: string;
  league: boolean;
}

interface DoublesFormData {
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
  signup_settings_id: string;
}

interface DoublesFormProps {
  signup: SignupSettings;
  leagueDetails: LeagueDetails[];
}

const DoublesForm: React.FC<DoublesFormProps> = ({ signup, leagueDetails }) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [formData, setFormData] = useState<DoublesFormData>({
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
    play_preference: 'Either',
    total_fees_due: 0,
    captain_league_cost: 0,
    teammate_league_cost: 0,
    payment_method: '',
    signup_settings_id: signup.id,
  });
  const [isTermsChecked, setIsTermsChecked] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [captainEmailError, setCaptainEmailError] = useState('');
  const [teammateEmailError, setTeammateEmailError] = useState('');
  const [captainPhoneError, setCaptainPhoneError] = useState('');
  const [teammatePhoneError, setTeammatePhoneError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, league')
        .eq('league', true)
        .order('name', { ascending: true });
      if (error) console.error('Error fetching locations:', error);
      else setLocations(data as Location[]);
    };
    fetchLocations();
  }, []);

  useEffect(() => {
    if (!formData.league_name) {
      setFormData((prev) => ({
        ...prev,
        total_fees_due: 0,
        captain_league_cost: 0,
        teammate_league_cost: 0,
      }));
      return;
    }
    const fees = calculateFees(
      formData.league_name,
      { captain: formData.captain_paid_nda, teammate: formData.teammate_paid_nda },
      leagueDetails
    );
    setFormData((prev) => ({
      ...prev,
      total_fees_due: fees.total_fees_due,
      captain_league_cost: fees.captain_league_cost || 0,
      teammate_league_cost: fees.teammate_league_cost || 0,
    }));
  }, [formData.league_name, formData.captain_paid_nda, formData.teammate_paid_nda, leagueDetails]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value, type, checked, name } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [type === 'radio' ? name : id]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'captain_email' | 'teammate_email') => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'captain_email') {
      setCaptainEmailError(value && !isValidEmail(value) ? 'Invalid email format' : '');
    } else {
      setTeammateEmailError(value && !isValidEmail(value) ? 'Invalid email format' : '');
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'captain_phone_number' | 'teammate_phone_number') => {
    const value = e.target.value;
    const formatted = formatPhoneNumber(value);
    setFormData((prev) => ({ ...prev, [field]: formatted }));
    if (field === 'captain_phone_number') {
      setCaptainPhoneError(!isValidPhoneNumber(formatted) && formatted.length > 0 ? 'Phone number must be 10 digits' : '');
    } else {
      setTeammatePhoneError(!isValidPhoneNumber(formatted) && formatted.length > 0 ? 'Phone number must be 10 digits' : '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);
    setIsSubmitting(true);

    if (captainEmailError || teammateEmailError || !isValidPhoneNumber(formData.captain_phone_number) || !isValidPhoneNumber(formData.teammate_phone_number)) {
      setSubmissionError('Please correct any email or phone number errors.');
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from('league_signups').insert([formData]);
    if (error) {
      console.error('Submission error:', error.message);
      setSubmissionError('There was an error submitting your form. Please try again.');
      setIsSubmitting(false);
      return;
    }

    setIsSubmitted(true);

    setTimeout(() => {
      const encodedTeamName = encodeURIComponent(`League Signup: ${formData.team_name}`);
      const paymentUrl =
        formData.payment_method === 'Venmo'
          ? `https://venmo.com/jay-phillips-36?txn=pay&amount=${formData.total_fees_due.toFixed(2)}&note=${encodedTeamName}`
          : `https://paypal.me/jayphillips1528/${formData.total_fees_due.toFixed(2)}?currencyCode=USD&note=${encodedTeamName}`;
      window.open(paymentUrl, '_blank');
    }, 3000);
  };

  return (
    <div className="flex justify-center">
      {isSubmitted ? (
        <div className="space-y-4 w-full md:max-w-2xl text-center">
          <h3 className="text-[var(--text-highlight)]">Signup Submitted Successfully!</h3>
          <p>
            Redirecting to {formData.payment_method} in 3 seconds to complete your payment of{' '}
            <strong>${formData.total_fees_due.toFixed(2)}</strong>.
          </p>
          <p>
            Not redirected?{' '}
            <a
              href={
                formData.payment_method === 'Venmo'
                  ? `https://venmo.com/jay-phillips-36?txn=pay&amount=${formData.total_fees_due.toFixed(2)}&note=${encodeURIComponent(`League Signup: ${formData.team_name}`)}`
                  : `https://paypal.me/jayphillips1528/${formData.total_fees_due.toFixed(2)}?currencyCode=USD&note=${encodeURIComponent(`League Signup: ${formData.team_name}`)}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--text-highlight)] underline"
            >
              Click here
            </a>.
          </p>
          <p>It is safe to close this window after submitting payment.</p>
          <div className="flex justify-center mb-4">
            <svg
              className="animate-spin h-5 w-5 text-[var(--text-highlight)]"
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
          </div>
        </div>
      ) : (
        <form className="space-y-4 w-full md:max-w-2xl" onSubmit={handleSubmit}>
          <div className="mb-6 p-4 bg-[var(--card-background)] rounded-md text-sm">
            <h3 className="text-[var(--text-highlight)] mb-2">{signup.name}</h3>
            <div dangerouslySetInnerHTML={{ __html: signup.league_info || '' }} />
          </div>

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

          <h3 className="font-bold">Captain Information</h3>
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
            {captainEmailError && <p className="text-red-500 text-sm">{captainEmailError}</p>}
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
            {captainPhoneError && <p className="text-red-500 text-sm">{captainPhoneError}</p>}
          </div>
          <div className="items-center flex">
            <input
              type="checkbox"
              id="captain_paid_nda"
              checked={formData.captain_paid_nda}
              onChange={handleInputChange}
              className="mr-2 appearance-none h-5 w-5 border-2 border-[var(--select-border)] rounded-sm checked:bg-[var(--checkbox-checkmark)] focus:outline-none"
            />
            <label htmlFor="captain_paid_nda">Captain has paid the yearly NDA sanction fee.</label>
          </div>

          <h3 className="font-bold">Teammate Information</h3>
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
            {teammateEmailError && <p className="text-red-500 text-sm">{teammateEmailError}</p>}
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
            {teammatePhoneError && <p className="text-red-500 text-sm">{teammatePhoneError}</p>}
          </div>
          <div className="items-center flex">
            <input
              type="checkbox"
              id="teammate_paid_nda"
              checked={formData.teammate_paid_nda}
              onChange={handleInputChange}
              className="mr-2 appearance-none h-5 w-5 border-2 border-[var(--select-border)] rounded-sm checked:bg-[var(--checkbox-checkmark)] focus:outline-none"
            />
            <label htmlFor="teammate_paid_nda">Teammate has paid the yearly NDA sanction fee.</label>
          </div>

          <h3 className="font-bold">League Selection</h3>
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
              {leagueDetails.map((league) => (
                <option key={league.id} value={league.name}>
                  {league.name} - {league.cap_details} {league.day_of_week} {league.start_time}
                </option>
              ))}
            </select>
          </div>

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
              {locations.map((location) => (
                <option key={location.id} value={location.name}>
                  {location.name}
                </option>
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
              {locations
                .filter((location) => location.name !== formData.home_location_1)
                .map((location) => (
                  <option key={location.id} value={location.name}>
                    {location.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">I prefer to play</label>
            <div className="mt-1 flex gap-8">
              <div className="items-center flex">
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
              <div className="items-center flex">
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
              <div className="items-center flex">
                <input
                  type="radio"
                  id="either"
                  name="play_preference"
                  value="Either"
                  required
                  className="mr-2 appearance-none h-5 w-5 border-2 border-[var(--select-border)] rounded-full checked:bg-[var(--checkbox-checkmark)] focus:outline-none"
                  onChange={handleInputChange}
                  checked={formData.play_preference === 'Either'}
                />
                <label htmlFor="either">Either</label>
              </div>
            </div>
          </div>

          <div className="mb-6 p-4 bg-[var(--card-background)] rounded-md text-sm">
            <p>I understand that I will have to pay upon completion of this form.</p>
            <p className="mt-2">Sign Up Fees:</p>
            <ul className="list-disc list-inside">
              <li>Captain League Fee: <strong>${formData.captain_league_cost.toFixed(2)}</strong></li>
              <li>Teammate League Fee: <strong>${formData.teammate_league_cost.toFixed(2)}</strong></li>
              {!formData.captain_paid_nda && (
                <li>Captain NDA Sanctioning Fee: <strong>${leagueDetails.find((l) => l.name === formData.league_name)?.sanction_fee.toFixed(2) || '0.00'}</strong></li>
              )}
              {!formData.teammate_paid_nda && (
                <li>Teammate NDA Sanctioning Fee: <strong>${leagueDetails.find((l) => l.name === formData.league_name)?.sanction_fee.toFixed(2) || '0.00'}</strong></li>
              )}
            </ul>
            <p className="mt-2">Fees Due:</p>
            <ul className="list-disc list-inside">
              <li>Total: <strong>${formData.total_fees_due.toFixed(2)}</strong></li>
            </ul>
            <hr />
            <p>This league is ADL, NDA, and NADO sanctioned.</p>
            <p>I understand that I must abide by the <a href="http://actiondartleague.com/AutoRecovery_save_of_ADL_Rules_and_Guidelines-Player_Handbook-NEW-Updated.pdf" target="_blank" rel="noreferrer">league rules</a>, and failure to do so may result in disqualification for the season and future leagues.</p>
            <p>I am aware that this is a 15-week league.</p>
            <p>If a match needs to be rescheduled or a substitute player must play, it is the team/player's responsibility to contact JayMar for approval as soon as reasonably possible.</p>
            <p>It is the team/player's responsibility to find a suitable substitute player.</p>
            <p className="mb-2">NO REFUNDS AFTER SIGN-UPS CLOSE</p>
            <p className="mt-4 mb-0 text-[var(--text-highlight)]"><span className="font-bold">Entire team fees are due at the time of sign-up. Please pay the full amount for both players.</span></p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="terms"
              required
              className="mr-2 appearance-none h-5 w-5 border-2 border-[var(--select-border)] rounded-sm checked:bg-[var(--checkbox-checkmark)] focus:outline-none"
              checked={isTermsChecked}
              onChange={() => setIsTermsChecked(!isTermsChecked)}
            />
            <label htmlFor="terms" className="text-sm font-medium">I agree to the terms provided above</label>
          </div>

          <h3 className="font-bold">Payment Method</h3>
          <div>
            <div className="mt-1 flex gap-8">
              <div className="items-center flex">
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
              <div className="items-center flex">
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

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full p-2 text-white bg-[var(--button-background)] rounded-md ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Submit
          </button>
          {submissionError && <div className="text-red-500 text-center mb-4">{submissionError}</div>}
        </form>
      )}
    </div>
  );
};

export default DoublesForm;