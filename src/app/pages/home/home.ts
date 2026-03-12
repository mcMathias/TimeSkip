import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RaiderioService } from '../../services/raiderio';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private raiderioService = inject(RaiderioService);

  guildStats = signal({
    members: 0,
    avgIlvl: 0,
    raidProgress: '0/8 Heroic',
  });

  announcements = signal([
    {
      id: 1,
      title: '🎮 Season 2 M+ Push Week!',
      message: 'Sign up for M+ groups this weekend. Target: 2500+ score.',
      date: 'March 12, 2026',
      type: 'event',
    },
    {
      id: 2,
      title: '🏰 Heroic Liberation of Undermine',
      message: 'Raid nights: Mon/Wed/Thu 19:45-23:00 Server Time.',
      date: 'March 10, 2026',
      type: 'raid',
    },
  ]);

  quickLinks = [
    { icon: '📋', title: 'M+ Sign-up', desc: 'Join Mythic+ groups', route: '/mplus' },
    { icon: '🏰', title: 'Raid Sign-up', desc: 'Sign up for raids', route: '/raid' },
    { icon: '👥', title: 'Guild Roster', desc: 'View members', route: '/roster' },
  ];

  ngOnInit(): void {
    this.loadGuildStats();
  }

  private async loadGuildStats(): Promise<void> {
    // Load roster if not already loaded
    if (this.raiderioService.roster().length === 0) {
      await this.raiderioService.loadGuildRoster();
    }

    const roster = this.raiderioService.roster();
    if (roster.length > 0) {
      const membersWithIlvl = roster.filter(m => m.character?.gear?.item_level_equipped);
      const avgIlvl = membersWithIlvl.length > 0
        ? Math.round(membersWithIlvl.reduce((sum, m) => sum + (m.character?.gear?.item_level_equipped || 0), 0) / membersWithIlvl.length)
        : 0;

      this.guildStats.set({
        members: roster.length,
        avgIlvl,
        raidProgress: '5/8 Heroic', // Update this manually or fetch from raider.io
      });
    }
  }
}
