'use client';

import { useRouter } from 'next/navigation';
import { Gender } from '@/lib/types';
import { GenderToggle } from './GenderToggle';

interface TeamGenderToggleProps {
  currentGender: Gender;
  teamId: string;
}

export function TeamGenderToggle({ currentGender, teamId }: TeamGenderToggleProps) {
  const router = useRouter();

  const handleGenderChange = (newGender: Gender) => {
    router.push(`/team/${newGender}/${teamId}`);
  };

  return (
    <GenderToggle value={currentGender} onChange={handleGenderChange} />
  );
}
