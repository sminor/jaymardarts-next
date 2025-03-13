'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import Button from '@/components/Button';
import { Tournament, Location } from './types';

const TournamentDetails: React.FC<{ tournament: Tournament; onUpdate: (updatedTournament: Tournament) => void }> = ({ tournament, onUpdate }) => {
  const [formData, setFormData] = useState({
    ...tournament,
    tournament_code: tournament.tournament_code || '',
    entry_fee: tournament.entry_fee ?? 10,
    bar_contribution: tournament.bar_contribution ?? 6,
    usage_fee: tournament.usage_fee ?? 1,
    bonus_money: tournament.bonus_money ?? 0,
    payout_spots: tournament.payout_spots ?? 3,
  });
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    setFormData({
      ...tournament,
      tournament_code: tournament.tournament_code || '',
      entry_fee: tournament.entry_fee ?? 10,
      bar_contribution: tournament.bar_contribution ?? 6,
      usage_fee: tournament.usage_fee ?? 1,
      bonus_money: tournament.bonus_money ?? 0,
      payout_spots: tournament.payout_spots ?? 3,
    });
  }, [tournament]);

  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await supabase.from('locations').select('id, name');
      if (error) {
        console.error('Error fetching locations:', error.message);
        setLocations([]);
      } else {
        setLocations(data || []);
      }
    };
    fetchLocations();
  }, []);

  const getOrdinalSuffix = (num: number): string => {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const remainder = num % 100;
    const relevant = remainder % 10;
    return remainder > 10 && remainder < 20 ? 'th' : suffixes[relevant] || 'th';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: name === 'payout_spots' ? parseInt(value, 10) : name === 'entry_fee' || name === 'bar_contribution' || name === 'usage_fee' || name === 'bonus_money' ? parseFloat(value) : value,
      };
      if (name === 'tournament_type' && !value.trim()) {
        setError('Tournament Type is required.');
      } else if (name === 'location' && !value.trim()) {
        setError('Location is required.');
      } else {
        setError(null);
      }
      return updated;
    });
  };

  const handleSave = async () => {
    if (!formData.tournament_type || !formData.tournament_type.trim()) {
      setError('Tournament Type is required.');
      return;
    }
    if (!formData.location || !formData.location.trim()) {
      setError('Location is required.');
      return;
    }
    const { data, error } = await supabase
      .from('tournaments')
      .update(formData)
      .eq('id', tournament.id)
      .select()
      .single();
    if (error) {
      console.error('Error updating tournament:', error.message);
      setError('Failed to save changes.');
    } else {
      onUpdate(data);
      setError(null);
    }
  };

  const entryFee = formData.entry_fee;
  const barContribution = formData.bar_contribution;
  const usageFee = formData.usage_fee;
  const bonusMoney = formData.bonus_money;
  const payoutSpots = formData.payout_spots;

  const totalEntryFees = tournament.players.length * entryFee;
  const totalCollectedFees = tournament.players.filter((p) => p.paid).length * entryFee;
  const totalBarFees = tournament.players.length * barContribution;
  const totalUsageFees = tournament.players.length * usageFee;
  const totalPrizePool = totalEntryFees + totalBarFees + bonusMoney - totalUsageFees;

  const entryFeesDisplay = totalCollectedFees === totalEntryFees ? (
    <span className="text-green-500">${totalEntryFees.toFixed(2)}</span>
  ) : (
    <span className="text-red-500">${totalEntryFees.toFixed(2)} (${totalCollectedFees.toFixed(2)})</span>
  );

  const calculatePayouts = () => {
    if (totalPrizePool === 0) {
      return new Array(payoutSpots).fill(0);
    }

    const spots = Math.max(payoutSpots, 1);
    let remainingPool = totalPrizePool;
    let payouts: number[] = [];
    const minPayout = entryFee * 2;

    payouts = new Array(spots).fill(minPayout);
    remainingPool -= minPayout * spots;

    const goldenRatio = 1.618;
    let sumOfRatios = 0;
    const ratioList: number[] = [];

    for (let i = 0; i < spots; i++) {
      const ratio = Math.pow(1 / goldenRatio, i);
      ratioList.push(ratio);
      sumOfRatios += ratio;
    }

    const adjustedRatios = ratioList.map(r => r / sumOfRatios);
    const extraPool = remainingPool;

    for (let i = 0; i < spots; i++) {
      const additionalAmount = Math.round((extraPool * adjustedRatios[i]) / 10) * 10;
      payouts[i] += additionalAmount;
      remainingPool -= additionalAmount;
    }

    for (let i = 4; i < spots; i += 2) {
      if (i + 1 < spots) {
        const maxPayout = Math.max(payouts[i], payouts[i + 1]);
        const roundedMaxPayout = Math.round(maxPayout / 10) * 10;
        payouts[i] = roundedMaxPayout;
        payouts[i + 1] = roundedMaxPayout;
      }
    }

    if (remainingPool > 0) {
      payouts[0] += Math.round(remainingPool / 10) * 10;
    }

    const totalPayouts = payouts.reduce((sum, payout) => sum + payout, 0);
    let discrepancy = totalPayouts - totalPrizePool;

    let index = 0;
    while (discrepancy > 0) {
      payouts[index] -= 10;
      discrepancy -= 10;
      index = (index + 1) % spots;
    }

    return payouts;
  };

  const roundedPayouts = calculatePayouts();

  // Rest of the JSX remains unchanged
  return (
    <section className="p-4">
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      <div className="tournament-details mt-4 bg-[var(--card-background)] p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="overflow-auto">
          <h3 className="text-md font-bold text-[var(--card-title)] mb-2">Settings</h3>
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border-b border-[var(--card-highlight)] last:border-b-0">
                <td className="text-[var(--card-text)] align-middle">
                  <div className="h-[59px] flex items-center">Tournament Name:</div>
                </td>
                <td className="align-middle">
                  <div className="h-[59px] flex items-center">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="p-2 h-[42px] w-full border-1 border-[var(--form-border)] rounded-md bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                    />
                  </div>
                </td>
              </tr>
              <tr className="border-b border-[var(--card-highlight)] last:border-b-0">
                <td className="text-[var(--card-text)] align-middle">
                  <div className="h-[59px] flex items-center">Date:</div>
                </td>
                <td className="align-middle">
                  <div className="h-[59px] flex items-center">
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="p-2 h-[42px] w-full border-1 border-[var(--form-border)] rounded-md bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                    />
                  </div>
                </td>
              </tr>
              <tr className="border-b border-[var(--card-highlight)] last:border-b-0">
                <td className="text-[var(--card-text)] align-middle">
                  <div className="h-[59px] flex items-center">Location:</div>
                </td>
                <td className="align-middle">
                  <div className="h-[59px] flex items-center">
                    <select
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                      className="p-2 h-[42px] w-full border-1 border-[var(--form-border)] rounded-md bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                    >
                      <option value="">Select a location</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.name}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-[var(--card-highlight)] last:border-b-0">
                <td className="text-[var(--card-text)] align-middle">
                  <div className="h-[59px] flex items-center">Tournament Type:</div>
                </td>
                <td className="align-middle">
                  <div className="h-[59px] flex items-center">
                    <select
                      name="tournament_type"
                      value={formData.tournament_type || ''}
                      onChange={handleInputChange}
                      required
                      className="p-2 h-[42px] w-full border-1 border-[var(--form-border)] rounded-md bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                    >
                      <option value="">Select a type</option>
                      <option value="A/B Draw">A/B Draw</option>
                      <option value="Blind Draw">Blind Draw</option>
                      <option value="Partner Bring">Partner Bring</option>
                    </select>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-[var(--card-highlight)] last:border-b-0">
                <td className="text-[var(--card-text)] align-middle">
                  <div className="h-[59px] flex items-center">Tournament Code:</div>
                </td>
                <td className="align-middle">
                  <div className="h-[59px] flex items-center">
                    <input
                      type="text"
                      name="tournament_code"
                      value={formData.tournament_code || ''}
                      onChange={handleInputChange}
                      className="p-2 h-[42px] w-full border-1 border-[var(--form-border)] rounded-md bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                    />
                  </div>
                </td>
              </tr>
              <tr className="border-b border-[var(--card-highlight)] last:border-b-0">
                <td className="text-[var(--card-text)] align-middle">
                  <div className="h-[59px] flex items-center">Entry Cost:</div>
                </td>
                <td className="align-middle">
                  <div className="h-[59px] flex items-center">
                    <div className="relative w-full">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[var(--select-text)]">$</span>
                      <input
                        type="number"
                        name="entry_fee"
                        value={formData.entry_fee ?? ''}
                        onChange={handleInputChange}
                        step="1"
                        min="0"
                        className="p-2 h-[42px] pl-6 w-full border-1 border-[var(--form-border)] rounded-md bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                      />
                    </div>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-[var(--card-highlight)] last:border-b-0">
                <td className="text-[var(--card-text)] align-middle">
                  <div className="h-[59px] flex items-center">Bar Input:</div>
                </td>
                <td className="align-middle">
                  <div className="h-[59px] flex items-center">
                    <div className="relative w-full">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[var(--select-text)]">$</span>
                      <input
                        type="number"
                        name="bar_contribution"
                        value={formData.bar_contribution ?? ''}
                        onChange={handleInputChange}
                        step="1"
                        min="0"
                        className="p-2 h-[42px] pl-6 w-full border-1 border-[var(--form-border)] rounded-md bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                      />
                    </div>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-[var(--card-highlight)] last:border-b-0">
                <td className="text-[var(--card-text)] align-middle">
                  <div className="h-[59px] flex items-center">Usage Fee:</div>
                </td>
                <td className="align-middle">
                  <div className="h-[59px] flex items-center">
                    <div className="relative w-full">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[var(--select-text)]">$</span>
                      <input
                        type="number"
                        name="usage_fee"
                        value={formData.usage_fee ?? ''}
                        onChange={handleInputChange}
                        step="1"
                        min="0"
                        className="p-2 h-[42px] pl-6 w-full border-1 border-[var(--form-border)] rounded-md bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                      />
                    </div>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-[var(--card-highlight)] last:border-b-0">
                <td className="text-[var(--card-text)] align-middle">
                  <div className="h-[59px] flex items-center">Bonus Money:</div>
                </td>
                <td className="align-middle">
                  <div className="h-[59px] flex items-center">
                    <div className="relative w-full">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[var(--select-text)]">$</span>
                      <input
                        type="number"
                        name="bonus_money"
                        value={formData.bonus_money ?? ''}
                        onChange={handleInputChange}
                        step="1"
                        min="0"
                        className="p-2 h-[42px] pl-6 w-full border-1 border-[var(--form-border)] rounded-md bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                      />
                    </div>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-[var(--card-highlight)] last:border-b-0">
                <td className="text-[var(--card-text)] align-middle">
                  <div className="h-[59px] flex items-center">Payout Spots:</div>
                </td>
                <td className="align-middle">
                  <div className="h-[59px] flex items-center">
                    <input
                      type="number"
                      name="payout_spots"
                      value={formData.payout_spots ?? ''}
                      onChange={handleInputChange}
                      min="1"
                      className="p-2 h-[42px] w-full border-1 border-[var(--form-border)] rounded-md bg-[var(--form-background)] text-[var(--select-text)] focus:outline-none"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="mt-4">
            <Button onClick={handleSave} className="w-full" disabled={!!error}>
              Save Changes
            </Button>
          </div>
        </div>

        <div className="overflow-auto">
          <h3 className="text-md font-bold text-[var(--card-title)] mb-2">Summary</h3>
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border-b border-[var(--card-highlight)] last:border-b-0">
                <td className="text-[var(--card-text)] align-middle">
                  <div className="h-[59px] flex items-center">Entry Costs:</div>
                </td>
                <td className="align-middle">
                  <div className="h-[59px] flex items-center">{entryFeesDisplay}</div>
                </td>
              </tr>
              <tr className="border-b border-[var(--card-highlight)] last:border-b-0">
                <td className="text-[var(--card-text)] align-middle">
                  <div className="h-[59px] flex items-center">Bar Input:</div>
                </td>
                <td className="align-middle">
                  <div className="h-[59px] flex items-center">
                    ${totalBarFees.toFixed(2)}
                  </div>
                </td>
              </tr>
              <tr className="border-b border-[var(--card-highlight)] last:border-b-0">
                <td className="text-[var(--card-text)] align-middle">
                  <div className="h-[59px] flex items-center">Usage Fees:</div>
                </td>
                <td className="align-middle">
                  <div className="h-[59px] flex items-center">
                    ${totalUsageFees.toFixed(2)}
                  </div>
                </td>
              </tr>
              <tr className="border-b border-[var(--card-highlight)] last:border-b-0">
                <td className="text-[var(--card-text)] align-middle">
                  <div className="h-[59px] flex items-center">Bonus Money:</div>
                </td>
                <td className="align-middle">
                  <div className="h-[59px] flex items-center">
                    ${parseFloat((formData.bonus_money ?? 0).toString()).toFixed(2)}
                  </div>
                </td>
              </tr>
              <tr className="border-b border-[var(--card-highlight)] last:border-b-0">
                <td className="text-[var(--card-text)] align-middle">
                  <div className="h-[59px] flex items-center">Total Prize Pool:</div>
                </td>
                <td className="align-middle">
                  <div className="h-[59px] flex items-center">
                    ${totalPrizePool.toFixed(2)}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-4 overflow-auto bg-[var(--color2)] p-4 rounded-md border border-[var(--card-highlight)] shadow-sm">
            <h3 className="text-md font-bold text-[var(--card-title)] mb-2 text-center">Suggested Payouts</h3>
            <table className="w-full border-collapse">
              <tbody>
                {roundedPayouts.map((payout, index) => (
                  <tr key={index}>
                    <td className="text-[var(--card-text)] align-middle w-1/2 text-center">
                      <div className="h-[59px] flex items-center justify-center">
                        {index + 1 + getOrdinalSuffix(index + 1)} Place
                      </div>
                    </td>
                    <td className="align-middle w-1/2 text-center">
                      <div className="h-[59px] flex items-center justify-center">
                        ${payout.toFixed(2)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TournamentDetails;