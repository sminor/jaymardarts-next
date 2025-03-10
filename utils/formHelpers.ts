// app/utils/formHelpers.ts
interface PlayerNDAStatus {
    captain: boolean;
    teammate: boolean;
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
  
  interface FeeCalculation {
    total_fees_due: number;
    captain_league_cost?: number;
    teammate_league_cost?: number;
  }
  
  export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  export const formatPhoneNumber = (value: string): string => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    // Remove leading "1" if present (e.g., 15035551212 -> 5035551212)
    const noLeadingOne = cleaned.startsWith('1') ? cleaned.slice(1) : cleaned;
    // Check if we have exactly 10 digits
    if (noLeadingOne.length !== 10) return noLeadingOne; // Return partial for user input
    // Format as (XXX) XXX-XXXX
    return `(${noLeadingOne.slice(0, 3)}) ${noLeadingOne.slice(3, 6)}-${noLeadingOne.slice(6)}`;
  };
  
  export const isValidPhoneNumber = (value: string): boolean => {
    const cleaned = value.replace(/\D/g, '');
    const noLeadingOne = cleaned.startsWith('1') ? cleaned.slice(1) : cleaned;
    return noLeadingOne.length === 10;
  };
  
  export const calculateFees = (
    leagueName: string,
    ndaStatus: PlayerNDAStatus,
    leagueDetails: LeagueDetails[]
  ): FeeCalculation => {
    const league = leagueDetails.find((l) => l.name === leagueName);
    if (!league) return { total_fees_due: 0 };
  
    const { cost_per_player, sanction_fee } = league;
    const captainCost = cost_per_player + (ndaStatus.captain ? 0 : sanction_fee);
    const teammateCost = cost_per_player + (ndaStatus.teammate ? 0 : sanction_fee);
  
    return {
      total_fees_due: captainCost + teammateCost,
      captain_league_cost: captainCost,
      teammate_league_cost: teammateCost,
    };
  };