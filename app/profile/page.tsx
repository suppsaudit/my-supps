'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, User, Target, Activity } from 'lucide-react';
import { ThemeMode } from '@/types';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useSupabase } from '@/lib/hooks/use-supabase';
import { DatabaseService } from '@/lib/services/database';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { theme, setTheme } = useAppStore();
  const { user, loading } = useSupabase();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    weight: '',
    height: '',
    age: '',
    gender: '',
    adhdTendency: false,
    goals: [] as string[],
  });

  const themes: { value: ThemeMode; label: string }[] = [
    { value: 'light', label: 'ライト' },
    { value: 'dark', label: 'ダーク' },
    { value: 'medium-dark', label: 'ミディアムダーク' },
    { value: 'auto', label: '自動' },
  ];

  const goals = [
    { id: 'sleep', label: '睡眠改善', icon: '😴' },
    { id: 'fatigue', label: '疲労回復', icon: '🔋' },
    { id: 'focus', label: '集中力向上', icon: '🎯' },
    { id: 'immunity', label: '免疫力強化', icon: '🛡️' },
    { id: 'skin', label: '美肌・美容', icon: '✨' },
    { id: 'muscle', label: '筋力向上', icon: '💪' },
  ];

  useEffect(() => {
    const loadProfile = async () => {
      if (!user || loading) return;
      
      const db = new DatabaseService();
      const userData = await db.getCurrentUser();
      
      if (userData?.profile) {
        setProfile({
          weight: userData.profile.weight || '',
          height: userData.profile.height || '',
          age: userData.profile.age || '',
          gender: userData.profile.gender || '',
          adhdTendency: userData.profile.adhd_tendency || false,
          goals: userData.profile.goals || [],
        });
      }
    };

    loadProfile();
  }, [user, loading]);

  const toggleGoal = (goalId: string) => {
    setProfile(prev => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter(g => g !== goalId)
        : [...prev.goals, goalId]
    }));
  };

  const handleSave = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }

    setIsSaving(true);
    try {
      const db = new DatabaseService();
      await db.updateUserProfile(user.id, {
        weight: profile.weight ? parseFloat(profile.weight) : null,
        height: profile.height ? parseFloat(profile.height) : null,
        age: profile.age ? parseInt(profile.age) : null,
        gender: (profile.gender as 'male' | 'female' | 'other') || null,
        adhd_tendency: profile.adhdTendency,
        goals: profile.goals,
      });
      
      // 成功メッセージなど
    } catch (error) {
      console.error('Profile save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-spotify-black via-spotify-gray-dark to-spotify-black flex items-center justify-center">
        <div className="text-spotify-gray-light">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-spotify-black via-spotify-gray-dark to-spotify-black">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="gap-2 text-spotify-gray-light hover:text-white">
              <ArrowLeft className="w-4 h-4" />
              ホームに戻る
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-spotify-green to-pink-light bg-clip-text text-transparent">
              プロファイル設定
            </h1>
            <p className="text-lg text-spotify-gray-light">
              あなたに最適な栄養素推奨量を計算します
            </p>
          </div>

          <div className="space-y-8">
            <Card className="bg-spotify-gray-dark/50 border-spotify-gray">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5" />
                  基本情報
                </CardTitle>
                <CardDescription className="text-spotify-gray-light">
                  体重ベースのRDA計算に使用されます
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-spotify-gray-light mb-2">
                      体重 (kg)
                    </label>
                    <input
                      type="number"
                      value={profile.weight}
                      onChange={(e) => setProfile({ ...profile, weight: e.target.value })}
                      className="w-full px-4 py-2 bg-spotify-black/50 border border-spotify-gray rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-spotify-green"
                      placeholder="60"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-spotify-gray-light mb-2">
                      身長 (cm)
                    </label>
                    <input
                      type="number"
                      value={profile.height}
                      onChange={(e) => setProfile({ ...profile, height: e.target.value })}
                      className="w-full px-4 py-2 bg-spotify-black/50 border border-spotify-gray rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-spotify-green"
                      placeholder="170"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-spotify-gray-light mb-2">
                      年齢
                    </label>
                    <input
                      type="number"
                      value={profile.age}
                      onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                      className="w-full px-4 py-2 bg-spotify-black/50 border border-spotify-gray rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-spotify-green"
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-spotify-gray-light mb-2">
                      性別
                    </label>
                    <select
                      value={profile.gender}
                      onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                      className="w-full px-4 py-2 bg-spotify-black/50 border border-spotify-gray rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-spotify-green"
                    >
                      <option value="">選択してください</option>
                      <option value="male">男性</option>
                      <option value="female">女性</option>
                      <option value="other">その他</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-spotify-gray-dark/50 border-spotify-gray">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  健康目標
                </CardTitle>
                <CardDescription className="text-spotify-gray-light">
                  あなたの目標に合わせたサプリメント提案に活用されます
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {goals.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => toggleGoal(goal.id)}
                      className={cn(
                        "p-4 rounded-lg border transition-all",
                        profile.goals.includes(goal.id)
                          ? "bg-pink/20 border-pink text-white"
                          : "bg-spotify-black/30 border-spotify-gray text-spotify-gray-light hover:border-spotify-gray-light"
                      )}
                    >
                      <div className="text-2xl mb-2">{goal.icon}</div>
                      <div className="text-sm font-medium">{goal.label}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-spotify-gray-dark/50 border-spotify-gray">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  テーマ設定
                </CardTitle>
                <CardDescription className="text-spotify-gray-light">
                  アプリの外観を変更できます
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {themes.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTheme(t.value)}
                      className={cn(
                        "p-3 rounded-lg border transition-all",
                        theme === t.value
                          ? "bg-spotify-green/20 border-spotify-green text-white"
                          : "bg-spotify-black/30 border-spotify-gray text-spotify-gray-light hover:border-spotify-gray-light"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Button 
                variant="spotify" 
                size="lg" 
                className="gap-2"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="w-5 h-5" />
                {isSaving ? '保存中...' : 'プロファイルを保存'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}