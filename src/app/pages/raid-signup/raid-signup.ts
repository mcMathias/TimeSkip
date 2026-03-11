import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RaidDataService } from '../../services/raid-data';
import { RaidSignup as RaidSignupModel } from '../../models/raid.model';

@Component({
  selector: 'app-raid-signup',
  imports: [CommonModule, FormsModule],
  templateUrl: './raid-signup.html',
  styleUrl: './raid-signup.scss',
})
export class RaidSignup {
  private raidService = inject(RaidDataService);

  info = this.raidService.info;
  days = this.raidService.days;
  stats = computed(() => this.raidService.getStats());

  // Modal states
  showSignupModal = signal(false);
  showAddDayModal = signal(false);
  showInfoModal = signal(false);

  // Form data
  playerName = signal('');
  playerRole = signal<'tank' | 'healer' | 'dps'>('dps');
  playerStatus = signal<'coming' | 'maybe' | 'absent'>('coming');
  playerSpec = signal('');

  newRaidDay = signal('Monday');
  newRaidDate = signal('');

  infoName = signal('');
  infoDifficulty = signal<'Normal' | 'Heroic' | 'Mythic'>('Heroic');
  infoTime = signal('');

  currentDayId = signal<number | null>(null);

  openSignupModal(dayId: number): void {
    this.currentDayId.set(dayId);
    this.playerName.set('');
    this.playerRole.set('dps');
    this.playerStatus.set('coming');
    this.playerSpec.set('');
    this.showSignupModal.set(true);
  }

  closeSignupModal(): void {
    this.showSignupModal.set(false);
  }

  confirmSignup(): void {
    const dayId = this.currentDayId();
    if (!dayId || !this.playerName()) return;

    const signup: RaidSignupModel = {
      name: this.playerName(),
      role: this.playerRole(),
      status: this.playerStatus(),
      spec: this.playerSpec() || undefined,
    };

    this.raidService.addSignup(dayId, signup);
    this.closeSignupModal();
  }

  removeSignup(dayId: number, playerName: string): void {
    if (confirm(`Remove ${playerName} from raid?`)) {
      this.raidService.removeSignup(dayId, playerName);
    }
  }

  openAddDayModal(): void {
    this.newRaidDay.set('Mandag');
    this.newRaidDate.set('');
    this.showAddDayModal.set(true);
  }

  closeAddDayModal(): void {
    this.showAddDayModal.set(false);
  }

  confirmAddDay(): void {
    if (!this.newRaidDate()) return;
    this.raidService.addDay(this.newRaidDay(), this.newRaidDate());
    this.closeAddDayModal();
  }

  deleteDay(dayId: number): void {
    const day = this.days().find(d => d.id === dayId);
    if (!day) return;

    const message = day.signups.length > 0
      ? `Are you sure you want to delete ${day.day} ${day.date}? There are ${day.signups.length} sign-ups.`
      : `Are you sure you want to delete ${day.day} ${day.date}?`;

    if (confirm(message)) {
      this.raidService.deleteDay(dayId);
    }
  }

  openInfoModal(): void {
    this.infoName.set(this.info().name);
    this.infoDifficulty.set(this.info().difficulty);
    this.infoTime.set(this.info().time);
    this.showInfoModal.set(true);
  }

  closeInfoModal(): void {
    this.showInfoModal.set(false);
  }

  saveInfo(): void {
    if (!this.infoName()) return;
    this.raidService.updateInfo({
      name: this.infoName(),
      difficulty: this.infoDifficulty(),
      time: this.infoTime(),
    });
    this.closeInfoModal();
  }

  copyToDiscord(): void {
    const text = this.raidService.copyToDiscord();
    navigator.clipboard.writeText(text).then(() => {
      this.showToast();
    });
  }

  getConfirmedByRole(day: any, role: string): any[] {
    return day.signups.filter((s: any) => s.role === role && s.status === 'coming');
  }

  getMaybes(day: any): any[] {
    return day.signups.filter((s: any) => s.status === 'maybe');
  }

  getAbsents(day: any): any[] {
    return day.signups.filter((s: any) => s.status === 'absent');
  }

  getTotalConfirmed(day: any): number {
    return day.signups.filter((s: any) => s.status === 'coming').length;
  }

  getEmptySlots(day: any, role: string): number[] {
    const counts: Record<string, number> = { tank: 2, healer: 5, dps: 13 };
    const max = counts[role] || 0;
    const filled = this.getConfirmedByRole(day, role).length;
    const empty = Math.max(0, Math.min(3, max - filled));
    return Array(empty).fill(0);
  }

  private showToast(): void {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2000);
    }
  }
}
