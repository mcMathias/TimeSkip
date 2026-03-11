import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MplusDataService } from '../../services/mplus-data';

@Component({
  selector: 'app-mplus-signup',
  imports: [CommonModule, FormsModule],
  templateUrl: './mplus-signup.html',
  styleUrl: './mplus-signup.scss',
})
export class MplusSignup {
  private mplusService = inject(MplusDataService);

  weeks = this.mplusService.weeks;
  currentWeek = this.mplusService.currentWeek;
  currentWeekData = this.mplusService.currentWeekData;
  stats = computed(() => this.mplusService.getStats());

  // Modal states
  showSignupModal = signal(false);
  showNewWeekModal = signal(false);

  // Form data
  playerName = signal('');
  serverTime = signal('');
  newWeekName = signal('');

  // Current selection
  currentDayIndex = signal(0);
  currentGroupIndex = signal(0);
  currentSlotIndex = signal(0);

  // Search
  searchTerm = signal('');
  searchResults = computed(() => {
    const term = this.searchTerm();
    if (!term) return [];
    return this.mplusService.searchPlayer(term);
  });

  getWeekNumbers(): number[] {
    return Object.keys(this.weeks()).map(Number);
  }

  switchWeek(week: number): void {
    this.mplusService.switchWeek(week);
  }

  openSignupModal(dayIndex: number, groupIndex: number, slotIndex: number): void {
    this.currentDayIndex.set(dayIndex);
    this.currentGroupIndex.set(groupIndex);
    this.currentSlotIndex.set(slotIndex);

    const slot = this.currentWeekData()?.days[dayIndex]?.groups[groupIndex]?.slots[slotIndex];
    this.playerName.set(slot?.player || '');
    this.serverTime.set(slot?.time || '');

    this.showSignupModal.set(true);
  }

  closeSignupModal(): void {
    this.showSignupModal.set(false);
    this.playerName.set('');
    this.serverTime.set('');
  }

  confirmSignup(): void {
    this.mplusService.updateSlot(
      this.currentDayIndex(),
      this.currentGroupIndex(),
      this.currentSlotIndex(),
      this.playerName(),
      this.serverTime()
    );
    this.closeSignupModal();
  }

  clearSlot(dayIndex: number, groupIndex: number, slotIndex: number, event: Event): void {
    event.stopPropagation();
    if (confirm('Fjern denne tilmelding?')) {
      this.mplusService.clearSlot(dayIndex, groupIndex, slotIndex);
    }
  }

  addGroup(dayIndex: number): void {
    this.mplusService.addGroup(dayIndex);
  }

  removeGroup(dayIndex: number, groupIndex: number): void {
    if (confirm('Er du sikker på at du vil fjerne denne gruppe?')) {
      this.mplusService.removeGroup(dayIndex, groupIndex);
    }
  }

  openNewWeekModal(): void {
    this.newWeekName.set('');
    this.showNewWeekModal.set(true);
  }

  closeNewWeekModal(): void {
    this.showNewWeekModal.set(false);
  }

  confirmNewWeek(): void {
    if (this.newWeekName()) {
      this.mplusService.addWeek(this.newWeekName());
      this.closeNewWeekModal();
    }
  }

  copyGroupToDiscord(dayIndex: number, groupIndex: number): void {
    const text = this.mplusService.copyGroupToDiscord(dayIndex, groupIndex);
    navigator.clipboard.writeText(text).then(() => {
      this.showToast();
    });
  }

  clearAllData(): void {
    if (confirm('Er du sikker på at du vil slette ALLE tilmeldinger?')) {
      this.mplusService.clearAllData();
    }
  }

  getGroupStatus(group: any): string {
    const filledSlots = group.slots.filter((s: any) => s.player && s.role !== 'Standby').length;
    if (filledSlots >= 5) return 'full';
    if (filledSlots >= 3) return 'partial';
    return 'empty';
  }

  private showToast(): void {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2000);
    }
  }
}
