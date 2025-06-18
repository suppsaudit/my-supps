'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Search, Package, TrendingUp, BarChart3, User } from 'lucide-react';
import { UserHeader } from '@/components/layout/user-header';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-spotify-black via-spotify-gray-dark to-spotify-black">
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      
      <main className="relative z-10">
        <header className="container mx-auto px-4 py-6 flex justify-between items-center">
          <Link href="/" className="text-2xl font-black text-spotify-green">
            MY SUPPS
          </Link>
          <UserHeader />
        </header>
        
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h1 className="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-spotify-green to-pink-light bg-clip-text text-transparent">
              MY SUPPS
            </h1>
            <p className="text-xl md:text-2xl text-spotify-gray-light mb-12">
              iHerbパワーユーザーのための革新的サプリ管理
            </p>