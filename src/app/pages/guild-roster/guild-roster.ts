import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RaiderioService } from '../../services/raiderio';
import { GuildMember } from '../../models/roster.model';

@Component({
  selector: 'app-guild-roster',
  imports: [CommonModule, FormsModule],
  templateUrl: './guild-roster.html',
  styleUrl: './guild-roster.scss',
})
export class GuildRoster implements OnInit {
  private raiderioService = inject(RaiderioService);

  roster = this.raiderioService.roster;
  loading = this.raiderioService.loading;
  loadingProgress = this.raiderioService.loadingProgress;
  error = this.raiderioService.error;

  searchTerm = signal('');
  sortColumn = signal<string>('rio');
  sortDirection = signal<'asc' | 'desc'>('desc');

  filteredRoster = computed(() => {
    let members = this.roster();
    const search = this.searchTerm().toLowerCase();

    if (search) {
      members = members.filter(m =>
        m.character?.name?.toLowerCase().includes(search)
      );
    }

    // Sort
    const column = this.sortColumn();
    const direction = this.sortDirection();

    return [...members].sort((a, b) => {
      let valA: any, valB: any;

      switch (column) {
        case 'name':
          valA = a.character?.name?.toLowerCase() || '';
          valB = b.character?.name?.toLowerCase() || '';
          break;
        case 'class':
          valA = a.character?.class?.toLowerCase() || '';
          valB = b.character?.class?.toLowerCase() || '';
          break;
        case 'ilvl':
          valA = a.character?.gear?.item_level_equipped || 0;
          valB = b.character?.gear?.item_level_equipped || 0;
          break;
        case 'rio':
        default:
          valA = a.character?.mythic_plus_scores_by_season?.[0]?.scores?.all || 0;
          valB = b.character?.mythic_plus_scores_by_season?.[0]?.scores?.all || 0;
          break;
      }

      if (typeof valA === 'string') {
        return direction === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return direction === 'asc' ? valA - valB : valB - valA;
    });
  });

  ngOnInit(): void {
    this.loadRoster();
  }

  loadRoster(): void {
    this.raiderioService.loadGuildRoster();
  }

  sortBy(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set(column === 'name' || column === 'class' ? 'asc' : 'desc');
    }
  }

  getRioScore(member: GuildMember): number {
    return member.character?.mythic_plus_scores_by_season?.[0]?.scores?.all || 0;
  }

  getRioColor(member: GuildMember): string {
    return this.raiderioService.getRioColor(this.getRioScore(member));
  }

  getIlvl(member: GuildMember): number | null {
    return member.character?.gear?.item_level_equipped || null;
  }

  getRankName(rank: number): string {
    return this.raiderioService.getRankName(rank);
  }

  getClassSlug(className: string | undefined): string {
    if (!className) return '';
    return className.toLowerCase().replace(' ', '-');
  }
}
