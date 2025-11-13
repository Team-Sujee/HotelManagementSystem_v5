import React from 'react'
import Spinner from '../atoms/Spinner'

interface TableProps<T> {
  data: T[]
  columns: {
    key: keyof T | string
    header: string
    render?: (item: T) => React.ReactNode
    className?: string
  }[]
  loading?: boolean
  emptyMessage?: string
  className?: string
}

const Table = <T extends object>({ data, columns, loading = false, emptyMessage = 'No data available.', className = '' }: TableProps<T>) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center text-textSecondary py-8">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={`overflow-x-auto rounded-2xl border border-border shadow-lg animate-fadeIn ${className}`}>
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-surface">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className={`px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider ${column.className || ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-surface divide-y divide-border">
          {data.map((item, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-primary/5 transition-colors duration-150">
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={`px-6 py-4 whitespace-nowrap text-sm text-text ${column.className || ''}`}
                >
                  {column.render ? column.render(item) : (item as any)[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Table
