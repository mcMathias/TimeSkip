export interface CharacterGear {
    item_level_equipped: number;
    item_level_total: number;
}

export interface MythicPlusScore {
    all: number;
    dps: number;
    healer: number;
    tank: number;
}

export interface MythicPlusScoreBySeason {
    season: string;
    scores: MythicPlusScore;
}

export interface Character {
    name: string;
    realm: string;
    class: string;
    active_spec_name?: string;
    gear?: CharacterGear;
    mythic_plus_scores_by_season?: MythicPlusScoreBySeason[];
}

export interface GuildMember {
    rank: number;
    character: Character;
}

export interface GuildProfile {
    name: string;
    realm: string;
    members: GuildMember[];
}
