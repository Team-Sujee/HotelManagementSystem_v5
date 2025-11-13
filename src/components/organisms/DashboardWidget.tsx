import React from 'react'
import Card from '../atoms/Card'
import { DashboardMetric } from '../../types'

interface DashboardWidgetProps {
  metric: DashboardMetric
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({ metric }) => {
  const IconComponent = metric.icon
  return (
    <Card className={`flex items-center justify-between p-6 animate-fadeIn`}>
      <div className="flex flex-col">
        <p className="text-textSecondary text-sm font-medium mb-1">{metric.title}</p>
        <h3 className="text-3xl font-bold text-text">{metric.value}</h3>
        {metric.change && (
          <p className={`text-sm mt-1 ${metric.change.startsWith('+') ? 'text-success' : 'text-error'}`}>
            {metric.change} vs last month
          </p>
        )}
      </div>
      <div className={`p-3 rounded-full ${metric.colorClass} bg-opacity-20`}>
        <IconComponent className={`h-8 w-8 ${metric.colorClass}`} />
      </div>
    </Card>
  )
}

export default DashboardWidget
