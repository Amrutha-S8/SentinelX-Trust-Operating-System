import React from 'react';
import { Link } from 'react-router-dom';

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  badge?: {
    text: string;
    color: 'red' | 'yellow' | 'green' | 'blue' | 'purple';
  };
}

export const ActionCard: React.FC<ActionCardProps> = ({ 
  title, 
  description, 
  icon, 
  link, 
  badge 
}) => {
  const getBadgeColor = (color: string) => {
    switch (color) {
      case 'red':
        return 'bg-red-100 text-red-800';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800';
      case 'green':
        return 'bg-green-100 text-green-800';
      case 'blue':
        return 'bg-blue-100 text-blue-800';
      case 'purple':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Link
      to={link}
      className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 relative"
    >
      {badge && (
        <div className="absolute top-4 right-4">
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getBadgeColor(badge.color)}`}>
            {badge.text}
          </span>
        </div>
      )}
      
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-full bg-gray-100">
          {icon}
        </div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-2">{description}</p>
      </div>
    </Link>
  );
};