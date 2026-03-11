export interface RaidSignup {
    name: string;
    role: 'tank' | 'healer' | 'dps';
    status: 'coming' | 'maybe' | 'absent';
    spec?: string;
}

export interface RaidDay {
    id: number;
    day: string;
    date: string;
    time: string;
    signups: RaidSignup[];
}

export interface RaidInfo {
    name: string;
    difficulty: 'Normal' | 'Heroic' | 'Mythic';
    time: string;
}

export interface RaidData {
    info: RaidInfo;
    days: RaidDay[];
}
