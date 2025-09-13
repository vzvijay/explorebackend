import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';

interface DateInputProps extends Omit<TextFieldProps, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const DateInput: React.FC<DateInputProps> = ({ 
  value, 
  onChange, 
  placeholder = "DD/MM/YYYY",
  ...props 
}) => {
  const formatDate = (inputValue: string): string => {
    // Remove all non-digits
    const digits = inputValue.replace(/\D/g, '');
    
    // Add slashes at appropriate positions
    if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 4) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDate(event.target.value);
    onChange(formatted);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow backspace, delete, arrow keys, tab, escape
    if ([8, 9, 27, 46, 37, 38, 39, 40].includes(event.keyCode)) {
      return;
    }
    // Allow only digits
    if (!/[0-9]/.test(event.key)) {
      event.preventDefault();
    }
  };

  const validateDate = (dateString: string): boolean => {
    if (dateString.length !== 10) return true; // Don't validate incomplete dates
    
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateString.match(regex);
    
    if (!match) return false;
    
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    
    // Basic validation
    if (day < 1 || day > 31) return false;
    if (month < 1 || month > 12) return false;
    if (year < 1900 || year > 2100) return false;
    
    return true;
  };

  const isValid = value.length === 10 ? validateDate(value) : true;
  const hasError = value.length === 10 && !isValid;

  return (
    <TextField
      {...props}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      inputProps={{
        maxLength: 10,
        pattern: "\\d{2}/\\d{2}/\\d{4}",
        ...props.inputProps
      }}
      error={hasError}
      helperText={hasError ? "Invalid date format" : props.helperText}
    />
  );
};

export default DateInput;
