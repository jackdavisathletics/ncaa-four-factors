import { notFound } from 'next/navigation';
import { Gender, Season, DEFAULT_SEASON, calculateAveragesFromStandings, calculatePercentilesFromStandings } from '@/lib/types';
import { getTeamById, getTeamStandings, getTeamGames, getStandings, getTeamConference, getTeamConferenceGames, calculateStatsFromGames, getConferenceOnlyAverages, getConferenceOnlyPercentiles } from '@/lib/data';
import { TeamPageClient } from './TeamPageClient';

interface TeamPageProps {
  params: Promise<{
    gender: string;
    teamId: string;
  }>;
  searchParams: Promise<{
    season?: string;
  }>;
}

export default async function TeamPage({ params, searchParams }: TeamPageProps) {
  const { gender: genderParam, teamId } = await params;
  const { season: seasonParam } = await searchParams;
  const gender = genderParam as Gender;
  const season = (['2024-25', '2023-24', '2022-23', '2021-22'].includes(seasonParam || '') ? seasonParam : DEFAULT_SEASON) as Season;

  if (gender !== 'mens' && gender !== 'womens') {
    notFound();
  }

  const team = getTeamById(gender, teamId, season);
  const standings = getTeamStandings(gender, teamId, season);
  const games = getTeamGames(gender, teamId, season);

  if (!team || !standings) {
    notFound();
  }

  // Get the team's conference
  const teamConference = getTeamConference(gender, teamId, season);
  const conferenceName = teamConference?.name || 'Conference';

  // DI mode data: all games, DI averages
  const allStandings = getStandings(gender, season);
  const diAverages = calculateAveragesFromStandings(allStandings);
  const diPercentiles = calculatePercentilesFromStandings(allStandings);

  // Conference mode data: conference games only, conference-only averages
  const conferenceGames = teamConference
    ? getTeamConferenceGames(gender, teamId, season)
    : [];
  const conferenceStats = calculateStatsFromGames(conferenceGames, teamId);
  const conferenceAverages = teamConference
    ? getConferenceOnlyAverages(gender, teamConference.id, season)
    : diAverages;
  const conferencePercentiles = teamConference
    ? getConferenceOnlyPercentiles(gender, teamConference.id, season)
    : diPercentiles;

  return (
    <TeamPageClient
      team={team}
      gender={gender}
      season={season}
      conferenceName={conferenceName}
      games={games}
      diStats={standings}
      diAverages={diAverages}
      diPercentiles={diPercentiles}
      conferenceStats={conferenceStats}
      conferenceAverages={conferenceAverages}
      conferencePercentiles={conferencePercentiles}
    />
  );
}
