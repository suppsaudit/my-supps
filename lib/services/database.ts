import { createClient } from '@/lib/supabase/browser';
import type { UserProfileData } from '@/types/profile';
import { mockNutrients, mockSupplements, mockSupplementNutrients, mockUserProfile, mockUserSupplements } from './mock-data';

export class DatabaseService {
  private supabase = createClient();
  private isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://demo.supabase.co';

  // ユーザー操作
  async getCurrentUser() {
    if (this.isDemo) {
      return mockUserProfile;
    }

    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return data;
  }

  async updateUserProfile(userId: string, profile: UserProfileData) {
    if (this.isDemo) {
      console.log('Demo mode: Profile update simulated');
      return;
    }

    const { error } = await this.supabase
      .from('users')
      .update({ profile })
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // サプリメント操作
  async getSupplements() {
    if (this.isDemo) {
      return mockSupplements;
    }

    const { data, error } = await this.supabase
      .from('supplements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching supplements:', error);
      return [];
    }

    return data || [];
  }

  async getSupplementById(id: string) {
    if (this.isDemo) {
      const supplement = mockSupplements.find(s => s.id === id);
      if (!supplement) return null;
      
      const nutrients = mockSupplementNutrients
        .filter(sn => sn.supplement_id === id)
        .map(sn => ({
          ...sn,
          nutrient: mockNutrients.find(n => n.id === sn.nutrient_id)
        }));
      
      return {
        ...supplement,
        supplement_nutrients: nutrients
      };
    }

    const { data, error } = await this.supabase
      .from('supplements')
      .select(`
        *,
        supplement_nutrients (
          *,
          nutrient:nutrients(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching supplement:', error);
      return null;
    }

    return data;
  }

  async searchSupplementsByUrl(url: string) {
    // URLからiHerb IDを抽出
    const iherbMatch = url.match(/iherb\.com\/pr\/.*?\/(\w+-\d+)/);
    if (!iherbMatch) return null;

    const iherbId = iherbMatch[1];
    
    if (this.isDemo) {
      return mockSupplements.find(s => s.iherb_id === iherbId) || null;
    }

    const { data, error } = await this.supabase
      .from('supplements')
      .select('*')
      .eq('iherb_id', iherbId)
      .single();

    if (error) {
      console.error('Error searching supplement:', error);
      return null;
    }

    return data;
  }

  // 栄養素操作
  async getNutrients() {
    if (this.isDemo) {
      return mockNutrients;
    }

    const { data, error } = await this.supabase
      .from('nutrients')
      .select('*')
      .order('name_ja');

    if (error) {
      console.error('Error fetching nutrients:', error);
      return [];
    }

    return data || [];
  }

  // ユーザーサプリメント操作
  async getUserSupplements(userId: string) {
    if (this.isDemo) {
      return mockUserSupplements;
    }

    const { data, error } = await this.supabase
      .from('user_supplements')
      .select(`
        *,
        supplement:supplements(*)
      `)
      .eq('user_id', userId)
      .order('added_at', { ascending: false });

    if (error) {
      console.error('Error fetching user supplements:', error);
      return [];
    }

    return data || [];
  }

  async addUserSupplement(userId: string, supplementId: string) {
    if (this.isDemo) {
      console.log('Demo mode: User supplement added simulated');
      return;
    }

    const { error } = await this.supabase
      .from('user_supplements')
      .insert({
        user_id: userId,
        supplement_id: supplementId,
      });

    if (error) {
      console.error('Error adding user supplement:', error);
      throw error;
    }
  }

  async updateUserSupplement(userId: string, supplementId: string, updates: { isSelected?: boolean; dailyIntake?: number; notes?: string }) {
    if (this.isDemo) {
      console.log('Demo mode: User supplement update simulated', { userId, supplementId, updates });
      return;
    }

    // フィールド名をデータベース形式に変換
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbUpdates: Record<string, any> = {};
    if (updates.isSelected !== undefined) dbUpdates.is_selected = updates.isSelected;
    if (updates.dailyIntake !== undefined) dbUpdates.daily_intake = updates.dailyIntake;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

    const { error } = await this.supabase
      .from('user_supplements')
      .update(dbUpdates)
      .eq('user_id', userId)
      .eq('supplement_id', supplementId);

    if (error) {
      console.error('Error updating user supplement:', error);
      throw error;
    }
  }

  async removeUserSupplement(userId: string, supplementId: string) {
    if (this.isDemo) {
      console.log('Demo mode: User supplement removal simulated');
      return;
    }

    const { error } = await this.supabase
      .from('user_supplements')
      .delete()
      .eq('user_id', userId)
      .eq('supplement_id', supplementId);

    if (error) {
      console.error('Error removing user supplement:', error);
      throw error;
    }
  }

  // サプリメント栄養素関連
  async getSupplementNutrients(supplementId: string) {
    if (this.isDemo) {
      return mockSupplementNutrients
        .filter(sn => sn.supplement_id === supplementId)
        .map(sn => ({
          ...sn,
          nutrient: mockNutrients.find(n => n.id === sn.nutrient_id)
        }));
    }

    const { data, error } = await this.supabase
      .from('supplement_nutrients')
      .select(`
        *,
        nutrient:nutrients(*)
      `)
      .eq('supplement_id', supplementId);

    if (error) {
      console.error('Error fetching supplement nutrients:', error);
      return [];
    }

    return data || [];
  }
}