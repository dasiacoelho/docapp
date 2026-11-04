import React from 'react';
import { Box, TextField, IconButton, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import { CalendarMonth, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { format, parseISO, addDays, subDays, startOfWeek, endOfWeek } from 'date-fns';

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
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));

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
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'nowrap', width: '100%' }}>
      {/* Date input */}
      <TextField
        size="small"
        type="date"
        label={label}
        value={format(value, 'yyyy-MM-dd')}
        onChange={(e) => e.target.value && handleDateChange(parseISO(e.target.value))}
        disabled={disabled}
        sx={{ minWidth: { xs: 120, sm: 140 }, flex: '0 0 auto' }}
        slotProps={{
          inputLabel: { shrink: true },
          htmlInput: {
            min: minDate ? format(minDate, 'yyyy-MM-dd') : undefined,
            max: maxDate ? format(maxDate, 'yyyy-MM-dd') : undefined,
          },
        }}
      />

      {showWeekNavigation && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, flex: 1, overflow: 'hidden' }}>
          {/* Prev week — hide on xs */}
          {!isXs && (
            <Tooltip title="Previous week">
              <span>
                <IconButton size="small" onClick={goToPreviousWeek} disabled={disabled || (!!minDate && isBefore(subDays(value, 7), minDate))}>
                  <ChevronLeft fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
          <Tooltip title="Previous day">
            <span>
              <IconButton size="small" onClick={goToPreviousDay} disabled={disabled || (!!minDate && isBefore(subDays(value, 1), minDate))}>
                <ChevronLeft fontSize="small" sx={{ transform: 'scale(0.75)' }} />
              </IconButton>
            </span>
          </Tooltip>

          {/* Centre label */}
          <Box sx={{ px: 0.5, textAlign: 'center', minWidth: 0, flex: 1, overflow: 'hidden' }}>
            {!isXs && (
              <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ fontSize: '0.68rem' }}>
                {format(weekStart, 'MMM d')} – {format(weekEnd, 'd, yyyy')}
              </Typography>
            )}
            <Typography variant="body2" fontWeight={500} noWrap sx={{ fontSize: { xs: '0.78rem', sm: '0.83rem' } }}>
              {isXs ? format(value, 'EEE, MMM d') : format(value, 'EEEE, MMM d')}
            </Typography>
          </Box>

          <Tooltip title="Next day">
            <span>
              <IconButton size="small" onClick={goToNextDay} disabled={disabled || (!!maxDate && isAfter(addDays(value, 1), maxDate))}>
                <ChevronRight fontSize="small" sx={{ transform: 'scale(0.75)' }} />
              </IconButton>
            </span>
          </Tooltip>
          {!isXs && (
            <Tooltip title="Next week">
              <span>
                <IconButton size="small" onClick={goToNextWeek} disabled={disabled || (!!maxDate && isAfter(addDays(value, 7), maxDate))}>
                  <ChevronRight fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
          <Tooltip title="Go to today">
            <span>
              <IconButton size="small" onClick={goToToday} disabled={disabled}>
                <CalendarMonth fontSize="small" color="primary" />
              </IconButton>
            </span>
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
