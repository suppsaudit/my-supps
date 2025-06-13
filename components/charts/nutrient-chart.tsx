'use client';

import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { NutrientData } from '@/types';
import { formatNutrientAmount } from '@/lib/utils';

interface NutrientChartProps {
  nutrients: NutrientData[];
  supplements: Array<{ id: string; name: string; color: string }>;
  showRDAZones?: boolean;
  mode?: 'perServing' | 'perUnit';
}

export function NutrientChart({ 
  nutrients, 
  supplements,
  showRDAZones = true
}: NutrientChartProps) {
  // チャート用データの準備
  const chartData = nutrients.map(nutrientData => {
    const dataPoint: Record<string, number | string> = {
      nutrient: nutrientData.nutrient.nameJa,
      coverage: nutrientData.coverage,
      actualAmount: nutrientData.actualAmount,
      unit: nutrientData.nutrient.unit
    };

    // 各サプリメントの貢献度を追加
    nutrientData.supplements.forEach(supp => {
      const supplement = supplements.find(s => s.id === supp.supplement.id);
      if (supplement) {
        dataPoint[supplement.id] = (supp.amount / nutrientData.recommendedAmount) * 100;
      }
    });

    return dataPoint;
  });

  interface TooltipPayload {
    payload: {
      nutrient: string;
      actualAmount: number;
      coverage: number;
      unit: string;
    };
  }
  
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <div className="bg-spotify-black/90 p-3 rounded-lg border border-spotify-gray">
          <p className="text-white font-semibold mb-2">{data.nutrient}</p>
          <p className="text-spotify-gray-light text-sm">
            摂取量: {formatNutrientAmount(data.actualAmount, data.unit)}
          </p>
          <p className="text-spotify-gray-light text-sm">
            カバー率: {Math.round(data.coverage)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[500px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData}>
          <PolarGrid 
            gridType="polygon"
            radialLines={showRDAZones}
            stroke="#535353"
          />
          <PolarAngleAxis 
            dataKey="nutrient"
            tick={{ fill: '#B3B3B3', fontSize: 12 }}
          />
          <PolarRadiusAxis 
            domain={[0, 150]}
            tickCount={4}
            tick={{ fill: '#B3B3B3', fontSize: 10 }}
            axisLine={false}
          />
          
          {/* RDAゾーン表示 */}
          {showRDAZones && (
            <>
              {/* 適正ゾーン (80-120%) */}
              <Radar
                dataKey={() => 100}
                stroke="#1DB954"
                fill="#1DB954"
                fillOpacity={0.1}
              />
              {/* 上限ゾーン (120%) */}
              <Radar
                dataKey={() => 120}
                stroke="#FF1493"
                fill="none"
                strokeDasharray="5 5"
              />
            </>
          )}
          
          {/* サプリメントごとのレーダー */}
          {supplements.map((supplement) => (
            <Radar
              key={supplement.id}
              dataKey={supplement.id}
              stroke={supplement.color}
              fill={supplement.color}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          ))}
          
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
      
      {/* 凡例 */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 p-4">
        {supplements.map(supplement => (
          <div key={supplement.id} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: supplement.color }}
            />
            <span className="text-sm text-spotify-gray-light">{supplement.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}