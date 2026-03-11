export interface Slot {
    role: 'Tank' | 'Healer' | 'DPS' | 'Standby';
    player: string;
    time: string;
}

export interface Group {
    name: string;
    slots: Slot[];
}

export interface Day {
    date: string;
    groups: Group[];
}

export interface Week {
    name: string;
    days: Day[];
}

export interface MplusData {
    weeks: { [key: number]: Week };
}
