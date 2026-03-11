import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(
            environment.supabaseUrl,
            environment.supabaseKey
        );
    }

    // M+ Data
    async getMplusData() {
        const { data, error } = await this.supabase
            .from('mplus_data')
            .select('*')
            .eq('id', 1)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching mplus data:', error);
            return null;
        }
        return data?.data || null;
    }

    async saveMplusData(mplusData: any) {
        const { error } = await this.supabase
            .from('mplus_data')
            .upsert({ id: 1, data: mplusData, updated_at: new Date().toISOString() });

        if (error) {
            console.error('Error saving mplus data:', error);
        }
    }

    // Raid Data
    async getRaidData() {
        const { data, error } = await this.supabase
            .from('raid_data')
            .select('*')
            .eq('id', 1)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching raid data:', error);
            return null;
        }
        return data?.data || null;
    }

    async saveRaidData(raidData: any) {
        const { error } = await this.supabase
            .from('raid_data')
            .upsert({ id: 1, data: raidData, updated_at: new Date().toISOString() });

        if (error) {
            console.error('Error saving raid data:', error);
        }
    }

    // Real-time subscriptions
    subscribeMplusChanges(callback: (data: any) => void): RealtimeChannel {
        return this.supabase
            .channel('mplus_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'mplus_data'
            }, (payload) => {
                if (payload.new && (payload.new as any).data) {
                    callback((payload.new as any).data);
                }
            })
            .subscribe();
    }

    subscribeRaidChanges(callback: (data: any) => void): RealtimeChannel {
        return this.supabase
            .channel('raid_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'raid_data'
            }, (payload) => {
                if (payload.new && (payload.new as any).data) {
                    callback((payload.new as any).data);
                }
            })
            .subscribe();
    }

    unsubscribe(channel: RealtimeChannel) {
        this.supabase.removeChannel(channel);
    }
}
