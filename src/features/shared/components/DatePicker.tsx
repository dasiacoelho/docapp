import React from 'react';
import { Box, FormControl, InputLabel, TextField, IconButton, Tooltip, Typography } from '@mui/material';
import { CalendarMonth, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { format, parseISO, addDays, subDays, startOfWeek, endOfWeek, isSameDay } from 'date-fns';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  showWeekNavigation?: boolean;
  label?: string;
}

export function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  disabled = false,
  showWeekNavigation = true,
  label = 'Date',
}: DatePickerProps) {
  const handleDateChange = (date: Date) => {
    if (minDate && isBefore(date, minDate)) return;
    if (maxDate && isAfter(date, maxDate)) return;
    onChange(date);
  };

  const goToPreviousDay = () => handleDateChange(subDays(value, 1));
  const goToNextDay = () => handleDateChange(addDays(value, 1));
  const goToPreviousWeek = () => handleDateChange(subDays(value, 7));
  const goToNextWeek = () => handleDateChange(addDays(value, 7));
  const goToToday = () => handleDateChange(new Date());

  const weekStart = startOfWeek(value, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(value, { weekStartsOn: 0 });

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      <FormControl size="small" fullWidth sx={{ minWidth: 200, flex: 1 }}>
        <InputLabel id="date-picker-label">{label}</InputLabel>
        <TextField
          fullWidth
          type="date"
          value={format(value, 'yyyy-MM-dd')}
          onChange={(e) => handleDateChange(parseISO(e.target.value))}
          disabled={disabled}
          slotProps={{
            inputLabel: { shrink: true },
            htmlInput: {
              min: minDate ? format(minDate, 'yyyy-MM-dd') : undefined,
              max: maxDate ? format(maxDate, 'yyyy-MM-dd') : undefined,
            },
          }}
        />
      </FormControl>

      {showWeekNavigation && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Previous week">
            <IconButton size="small" onClick={goToPreviousWeek} disabled={disabled || (minDate && isBefore(subDays(value, 7), minDate))}>
              <ChevronLeft />
            </IconButton>
          </Tooltip>
          <Tooltip title="Previous day">
            <IconButton size="small" onClick={goToPreviousDay} disabled={disabled || (minDate && isBefore(subDays(value, 1), minDate))}>
              <ChevronLeft style={{ transform: 'scale(0.7)' }} />
            </IconButton>
          </Tooltip>
          
          <Box sx={{ px: 1, textAlign: 'center', minWidth: 120 }}>
            <Typography variant="caption" color="text.secondary">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'd, yyyy')}
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {format(value, 'EEEE, MMM d')}
            </Typography>
          </Box>
          
          <Tooltip title="Next day">
            <IconButton size="small" onClick={goToNextDay} disabled={disabled || (maxDate && isAfter(addDays(value, 1), maxDate))}>
              <ChevronRight style={{ transform: 'scale(0.7)' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Next week">
            <IconButton size="small" onClick={goToNextWeek} disabled={disabled || (maxDate && isAfter(addDays(value, 7), maxDate))}>
              <ChevronRight />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Today">
            <IconButton size="small" onClick={goToToday} disabled={disabled}>
              <CalendarMonth fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
}

function isBefore(date1: Date, date2: Date): boolean {
  return date1.getTime() < date2.getTime();
}

function isAfter(date1: Date, date2: Date): boolean {
  return date1.getTime() > date2.getTime();
}