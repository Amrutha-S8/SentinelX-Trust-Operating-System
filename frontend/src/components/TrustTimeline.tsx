import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface TrustTimelineProps {
  data: Array<{ timestamp: string; trustScore: number; riskLevel: string }>;
}

export const TrustTimeline: React.FC<TrustTimelineProps> = ({ data }) => {
  const chartData = data.map((item) => ({
    time: format(new Date(item.timestamp), 'MMM dd HH:mm'),
    score: item.trustScore,
  }));

  return (
    <div className="w-full h-80 bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Trust Score Timeline</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};