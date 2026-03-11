import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { MplusData, Week, Group, Slot, Day } from '../models/mplus.model';
import { SupabaseService } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class MplusDataService implements OnDestroy {
  private supabaseService = inject(SupabaseService);
  private realtimeChannel: RealtimeChannel | null = null;

  private data = signal<MplusData>(this.getDefaultData());
  currentWeek = signal<number>(1);

  weeks = computed(() => this.data().weeks);
  currentWeekData = computed(() => this.data().weeks[this.currentWeek()]);

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
    this.realtimeChannel = this.supabaseService.subscribeMplusChanges((newData) => {
      // Only update if data is different to avoid loops
      if (JSON.stringify(newData) !== JSON.stringify(this.data())) {
        this.data.set(newData);
      }
    });
  }

  private getDefaultData(): MplusData {
    return {
      weeks: {
        1: {
          name: 'Week 1 - Season Start',
          days: [
            { date: 'Wednesday 25.3.2026', groups: this.generateEmptyGroups(4) },
            { date: 'Thursday 26.3.2026', groups: this.generateEmptyGroups(4) },
            { date: 'Friday 27.3.2026', groups: this.generateEmptyGroups(4) },
            { date: 'Saturday 28.3.2026', groups: this.generateEmptyGroups(4) },
            { date: 'Sunday 29.3.2026', groups: this.generateEmptyGroups(4) },
          ],
        },
        2: {
          name: 'Week 2',
          days: [
            { date: 'Wednesday 1.4.2026', groups: this.generateEmptyGroups(4) },
            { date: 'Thursday 2.4.2026', groups: this.generateEmptyGroups(4) },
            { date: 'Friday 3.4.2026', groups: this.generateEmptyGroups(4) },
            { date: 'Saturday 4.4.2026', groups: this.generateEmptyGroups(4) },
            { date: 'Sunday 5.4.2026', groups: this.generateEmptyGroups(4) },
          ],
        },
      },
    };
  }

  generateEmptyGroups(count: number): Group[] {
    const groups: Group[] = [];
    for (let i = 0; i < count; i++) {
      groups.push({
        name: `Group ${i + 1}`,
        slots: [
          { role: 'Tank', player: '', time: '' },
          { role: 'Healer', player: '', time: '' },
          { role: 'DPS', player: '', time: '' },
          { role: 'DPS', player: '', time: '' },
          { role: 'DPS', player: '', time: '' },
          { role: 'Standby', player: '', time: '' },
          { role: 'Standby', player: '', time: '' },
        ],
      });
    }
    return groups;
  }

  private async loadData(): Promise<void> {
    const saved = await this.supabaseService.getMplusData();
    if (saved) {
      this.data.set(saved);
    }
  }

  private saveData(): void {
    this.supabaseService.saveMplusData(this.data());
  }

  switchWeek(week: number): void {
    this.currentWeek.set(week);
  }

  addWeek(name: string): void {
    const weeks = this.data().weeks;
    const nextWeekNum = Math.max(...Object.keys(weeks).map(Number)) + 1;

    this.data.update((d) => ({
      ...d,
      weeks: {
        ...d.weeks,
        [nextWeekNum]: {
          name,
          days: [
            { date: 'Wednesday', groups: this.generateEmptyGroups(4) },
            { date: 'Thursday', groups: this.generateEmptyGroups(4) },
            { date: 'Friday', groups: this.generateEmptyGroups(4) },
            { date: 'Saturday', groups: this.generateEmptyGroups(4) },
            { date: 'Sunday', groups: this.generateEmptyGroups(4) },
          ],
        },
      },
    }));
    this.saveData();
  }

  updateSlot(dayIndex: number, groupIndex: number, slotIndex: number, player: string, time: string): void {
    this.data.update((d) => {
      const newData = JSON.parse(JSON.stringify(d)) as MplusData;
      const week = newData.weeks[this.currentWeek()];
      if (week?.days[dayIndex]?.groups[groupIndex]?.slots[slotIndex]) {
        week.days[dayIndex].groups[groupIndex].slots[slotIndex].player = player;
        week.days[dayIndex].groups[groupIndex].slots[slotIndex].time = time;
      }
      return newData;
    });
    this.saveData();
  }

  clearSlot(dayIndex: number, groupIndex: number, slotIndex: number): void {
    this.updateSlot(dayIndex, groupIndex, slotIndex, '', '');
  }

  addGroup(dayIndex: number): void {
    this.data.update((d) => {
      const newData = JSON.parse(JSON.stringify(d)) as MplusData;
      const week = newData.weeks[this.currentWeek()];
      if (week?.days[dayIndex]) {
        const groupNum = week.days[dayIndex].groups.length + 1;
        week.days[dayIndex].groups.push({
          name: `Group ${groupNum}`,
          slots: [
            { role: 'Tank', player: '', time: '' },
            { role: 'Healer', player: '', time: '' },
            { role: 'DPS', player: '', time: '' },
            { role: 'DPS', player: '', time: '' },
            { role: 'DPS', player: '', time: '' },
            { role: 'Standby', player: '', time: '' },
            { role: 'Standby', player: '', time: '' },
          ],
        });
      }
      return newData;
    });
    this.saveData();
  }

  removeGroup(dayIndex: number, groupIndex: number): void {
    this.data.update((d) => {
      const newData = JSON.parse(JSON.stringify(d)) as MplusData;
      const week = newData.weeks[this.currentWeek()];
      if (week?.days[dayIndex]?.groups.length > 1) {
        week.days[dayIndex].groups.splice(groupIndex, 1);
        // Rename groups
        week.days[dayIndex].groups.forEach((g, i) => (g.name = `Group ${i + 1}`));
      }
      return newData;
    });
    this.saveData();
  }

  getStats(): { tanks: number; healers: number; dps: number; total: number; fullGroups: number; totalGroups: number } {
    const week = this.currentWeekData();
    if (!week) return { tanks: 0, healers: 0, dps: 0, total: 0, fullGroups: 0, totalGroups: 0 };

    let tanks = 0, healers = 0, dps = 0, fullGroups = 0, totalGroups = 0;

    week.days.forEach((day) => {
      day.groups.forEach((group) => {
        totalGroups++;
        let groupFilled = 0;
        group.slots.forEach((slot) => {
          if (slot.player && slot.role !== 'Standby') {
            if (slot.role === 'Tank') tanks++;
            else if (slot.role === 'Healer') healers++;
            else if (slot.role === 'DPS') dps++;
            groupFilled++;
          }
        });
        if (groupFilled >= 5) fullGroups++;
      });
    });

    return { tanks, healers, dps, total: tanks + healers + dps, fullGroups, totalGroups };
  }

  searchPlayer(name: string): Array<{ week: number; dayIndex: number; groupIndex: number; slotIndex: number; day: string; group: string; role: string; time: string }> {
    const results: Array<{ week: number; dayIndex: number; groupIndex: number; slotIndex: number; day: string; group: string; role: string; time: string }> = [];
    const searchTerm = name.toLowerCase();

    Object.entries(this.data().weeks).forEach(([weekNum, week]) => {
      week.days.forEach((day, dayIndex) => {
        day.groups.forEach((group, groupIndex) => {
          group.slots.forEach((slot, slotIndex) => {
            if (slot.player.toLowerCase().includes(searchTerm)) {
              results.push({
                week: Number(weekNum),
                dayIndex,
                groupIndex,
                slotIndex,
                day: day.date,
                group: group.name,
                role: slot.role,
                time: slot.time,
              });
            }
          });
        });
      });
    });

    return results;
  }

  copyGroupToDiscord(dayIndex: number, groupIndex: number): string {
    const week = this.currentWeekData();
    if (!week) return '';

    const day = week.days[dayIndex];
    const group = day?.groups[groupIndex];
    if (!group) return '';

    let text = '```\n';
    text += `📅 ${day.date} - ${group.name}\n`;
    text += '═══════════════════════════\n';

    group.slots.forEach((slot) => {
      const icon = slot.role === 'Tank' ? '🛡️' : slot.role === 'Healer' ? '💚' : slot.role === 'Standby' ? '📋' : '⚔️';
      const player = slot.player || '(Ledig)';
      const time = slot.time ? ` - ${slot.time}` : '';
      text += `${icon} ${slot.role}: ${player}${time}\n`;
    });

    text += '```';
    return text;
  }

  clearAllData(): void {
    this.data.set(this.getDefaultData());
    this.saveData();
  }
}
