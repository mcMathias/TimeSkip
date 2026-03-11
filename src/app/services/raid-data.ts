import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { RaidData, RaidDay, RaidSignup, RaidInfo } from '../models/raid.model';
import { SupabaseService } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class RaidDataService implements OnDestroy {
  private supabaseService = inject(SupabaseService);
  private realtimeChannel: RealtimeChannel | null = null;

  private data = signal<RaidData>(this.getDefaultData());

  info = computed(() => this.data().info);
  days = computed(() => this.data().days);

  constructor() {
    this.loadData();
    this.setupRealtimeSubscription();
  }

  ngOnDestroy(): void {
    if (this.realtimeChannel) {
      this.supabaseService.unsubscribe(this.realtimeChannel);
    }
  }

  private setupRealtimeSubscription(): void {
    this.realtimeChannel = this.supabaseService.subscribeRaidChanges((newData) => {
      if (JSON.stringify(newData) !== JSON.stringify(this.data())) {
        this.data.set(newData);
      }
    });
  }

  private getDefaultData(): RaidData {
    return {
      info: {
        name: 'Liberation of Undermine',
        difficulty: 'Heroic',
        time: '19:45 - 23:00',
      },
      days: [
        { id: 1, day: 'Mandag', date: '10.3.2026', time: '19:45 - 23:00', signups: [] },
        { id: 2, day: 'Onsdag', date: '12.3.2026', time: '19:45 - 23:00', signups: [] },
        { id: 3, day: 'Torsdag', date: '13.3.2026', time: '19:45 - 23:00', signups: [] },
      ],
    };
  }

  private async loadData(): Promise<void> {
    const saved = await this.supabaseService.getRaidData();
    if (saved) {
      // Migration: add info if not present
      if (!saved.info) {
        saved.info = {
          name: 'Liberation of Undermine',
          difficulty: 'Heroic',
          time: '19:45 - 23:00',
        };
      }
      this.data.set(saved);
    }
  }

  private saveData(): void {
    this.supabaseService.saveRaidData(this.data());
  }

  updateInfo(info: RaidInfo): void {
    this.data.update((d) => ({ ...d, info }));
    this.saveData();
  }

  addDay(day: string, date: string): void {
    const newId = this.data().days.length > 0
      ? Math.max(...this.data().days.map((d) => d.id)) + 1
      : 1;

    this.data.update((d) => {
      const newDays = [
        ...d.days,
        { id: newId, day, date, time: d.info.time, signups: [] },
      ].sort((a, b) => {
        const dateA = a.date.split('.').reverse().join('');
        const dateB = b.date.split('.').reverse().join('');
        return dateA.localeCompare(dateB);
      });
      return { ...d, days: newDays };
    });
    this.saveData();
  }

  deleteDay(dayId: number): void {
    this.data.update((d) => ({
      ...d,
      days: d.days.filter((day) => day.id !== dayId),
    }));
    this.saveData();
  }

  addSignup(dayId: number, signup: RaidSignup): void {
    this.data.update((d) => {
      const newData = JSON.parse(JSON.stringify(d)) as RaidData;
      const day = newData.days.find((day) => day.id === dayId);
      if (day) {
        const existingIndex = day.signups.findIndex(
          (s) => s.name.toLowerCase() === signup.name.toLowerCase()
        );
        if (existingIndex !== -1) {
          day.signups[existingIndex] = signup;
        } else {
          day.signups.push(signup);
        }
      }
      return newData;
    });
    this.saveData();
  }

  removeSignup(dayId: number, playerName: string): void {
    this.data.update((d) => {
      const newData = JSON.parse(JSON.stringify(d)) as RaidData;
      const day = newData.days.find((day) => day.id === dayId);
      if (day) {
        day.signups = day.signups.filter((s) => s.name !== playerName);
      }
      return newData;
    });
    this.saveData();
  }

  getStats(): { raidDays: number; tanks: number; healers: number; dps: number; maybes: number } {
    let tanks = 0, healers = 0, dps = 0, maybes = 0;

    this.data().days.forEach((day) => {
      tanks += day.signups.filter((s) => s.role === 'tank' && s.status === 'coming').length;
      healers += day.signups.filter((s) => s.role === 'healer' && s.status === 'coming').length;
      dps += day.signups.filter((s) => s.role === 'dps' && s.status === 'coming').length;
      maybes += day.signups.filter((s) => s.status === 'maybe').length;
    });

    return { raidDays: this.data().days.length, tanks, healers, dps, maybes };
  }

  copyToDiscord(): string {
    let text = '```\n';
    text += `🏰 RAID SIGNUP - ${this.data().info.name} ${this.data().info.difficulty}\n`;
    text += '═══════════════════════════════════════\n\n';

    this.data().days.forEach((day) => {
      const tanks = day.signups.filter((s) => s.role === 'tank' && s.status === 'coming');
      const healers = day.signups.filter((s) => s.role === 'healer' && s.status === 'coming');
      const dps = day.signups.filter((s) => s.role === 'dps' && s.status === 'coming');
      const maybes = day.signups.filter((s) => s.status === 'maybe');

      const total = tanks.length + healers.length + dps.length;

      text += `📅 ${day.day} ${day.date} (${day.time})\n`;
      text += `Total: ${total}/20\n`;
      text += `───────────────────────────────\n`;
      text += `🛡️ Tanks (${tanks.length}/2): ${tanks.map((p) => p.name).join(', ') || '-'}\n`;
      text += `💚 Healers (${healers.length}/5): ${healers.map((p) => p.name).join(', ') || '-'}\n`;
      text += `⚔️ DPS (${dps.length}/13): ${dps.map((p) => p.name).join(', ') || '-'}\n`;
      if (maybes.length > 0) {
        text += `❓ Måske: ${maybes.map((p) => p.name).join(', ')}\n`;
      }
      text += '\n';
    });

    text += '```';
    return text;
  }
}
