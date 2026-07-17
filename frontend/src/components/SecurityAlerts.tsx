import React from 'react';
import { format } from 'date-fns';

interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  resolved: boolean;
}

interface SecurityAlertsProps {
  alerts: SecurityAlert[];
}

export const SecurityAlerts: React.FC<SecurityAlertsProps> = ({ alerts }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '🟡';
      default:
        return 'ℹ️';
    }
  };

  const unresolvedAlerts = alerts.filter(alert => !alert.resolved);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Security Alerts</h3>
        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {unresolvedAlerts.length} Active
        </span>
      </div>

      {unresolvedAlerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-2xl mb-2">🛡️</div>
          <p>No active security alerts</p>
        </div>
      ) : (
        <div className="space-y-3">
          {unresolvedAlerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`border-l-4 p-4 rounded-r-lg ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start space-x-3">
                <span className="text-lg">{getSeverityIcon(alert.severity)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                    <span className="text-xs text-gray-500 uppercase font-medium">
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{alert.description}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {format(new Date(alert.timestamp), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};