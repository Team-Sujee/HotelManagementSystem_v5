import React from 'react'
import Input from '../atoms/Input'

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  icon?: React.ElementType
}

const FormField: React.FC<FormFieldProps> = ({ label, error, icon, ...props }) => {
  return (
    <div className="mb-4">
      <Input label={label} error={error} icon={icon} {...props} />
    </div>
  )
}

export default FormField
