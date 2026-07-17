import React from 'react';
import { format } from 'date-fns';

interface Activity {
  id: string;
  type: 'login' | 'trust_eval' | 'approval' | 'security';
  description: string;
  timestamp: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

interface ActivityFeedProps {
  activities: Activity[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'login':
        return '🔐';
      case 'trust_eval':
        return '🛡️';
      case 'approval':
        return '✅';
      case 'security':
        return '🚨';
      default:
        return '📝';
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className={`p-3 rounded-lg ${getSeverityColor(activity.severity)}`}>
            <div className="flex items-start space-x-3">
              <span className="text-lg">{getIcon(activity.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{activity.description}</p>
                <p className="text-xs text-gray-500">
                  {format(new Date(activity.timestamp), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};