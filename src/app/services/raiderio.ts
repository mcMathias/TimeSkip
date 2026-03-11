import { Injectable, signal } from '@angular/core';
import { GuildMember, GuildProfile, Character } from '../models/roster.model';

@Injectable({
  providedIn: 'root',
})
export class RaiderioService {
  private readonly GUILD_NAME = 'TimeSkip';
  private readonly REALM = 'ravencrest';
  private readonly REGION = 'eu';

  roster = signal<GuildMember[]>([]);
  loading = signal<boolean>(false);
  loadingProgress = signal<string>('');
  error = signal<string | null>(null);

  async loadGuildRoster(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.loadingProgress.set('Henter guild medlemmer...');

    try {
      const response = await fetch(
        `https://raider.io/api/v1/guilds/profile?region=${this.REGION}&realm=${this.REALM}&name=${this.GUILD_NAME}&fields=members`
      );

      if (!response.ok) {
        throw new Error('Kunne ikke hente guild data');
      }

      const data: GuildProfile = await response.json();
      this.roster.set(data.members || []);

      // Load detailed character data
      await this.loadDetailedCharacterData();
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Ukendt fejl');
      this.roster.set([]);
    } finally {
      this.loading.set(false);
      this.loadingProgress.set('');
    }
  }

  private async loadDetailedCharacterData(): Promise<void> {
    const members = this.roster();
    const total = members.length;
    let loaded = 0;

    const batchSize = 5;

    for (let i = 0; i < members.length; i += batchSize) {
      const batch = members.slice(i, Math.min(i + batchSize, members.length));

      const promises = batch.map(async (member, batchIndex) => {
        const index = i + batchIndex;
        const charName = member.character?.name;
        const realm = member.character?.realm || this.REALM;

        if (!charName) return;

        try {
          const charResponse = await fetch(
            `https://raider.io/api/v1/characters/profile?region=${this.REGION}&realm=${encodeURIComponent(realm)}&name=${encodeURIComponent(charName)}&fields=gear,mythic_plus_scores_by_season:current`
          );

          if (charResponse.ok) {
            const charData = await charResponse.json();
            this.roster.update((r) => {
              const newRoster = [...r];
              if (newRoster[index]) {
                newRoster[index] = {
                  ...newRoster[index],
                  character: {
                    ...newRoster[index].character,
                    gear: charData.gear,
                    mythic_plus_scores_by_season: charData.mythic_plus_scores_by_season,
                  },
                };
              }
              return newRoster;
            });
          }
        } catch {
          // Silently fail for individual characters
        }

        loaded++;
      });

      await Promise.all(promises);
      this.loadingProgress.set(`Henter karakter data: ${loaded}/${total}...`);

      // Small delay to avoid rate limiting
      if (i + batchSize < members.length) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    this.loadingProgress.set('✅ Alle karakter data hentet!');
  }

  getRioColor(score: number): string {
    if (score >= 3000) return 'red';
    if (score >= 2500) return 'pink';
    if (score >= 2000) return 'orange';
    if (score >= 1500) return 'purple';
    if (score >= 1000) return 'blue';
    if (score >= 500) return 'green';
    return 'gray';
  }

  getRankName(rank: number): string {
    const ranks = ['Guild Master', 'Officer', 'Veteran', 'Raider', 'Member', 'Initiate', 'Alt'];
    return ranks[rank] || `Rank ${rank}`;
  }
}
