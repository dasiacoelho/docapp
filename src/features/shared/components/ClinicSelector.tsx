import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import { LocationOn, ExpandMore } from '@mui/icons-material';
import { clinicService } from '../../../services/firestore';
import type { Clinic } from '../../../types';
import { useAuth } from '../../../features/auth/hooks';

interface ClinicSelectorProps {
  value: string;
  onChange: (clinicId: string) => void;
  showLabel?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ClinicSelector({
  value,
  onChange,
  showLabel = true,
  disabled = false,
  placeholder = 'Select clinic',
}: ClinicSelectorProps) {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadClinics();
    }
  }, [user]);

  const loadClinics = async () => {
    try {
      setLoading(true);
      const data = await clinicService.getAll();
      setClinics(data);
    } catch (error) {
      console.error('Failed to load clinics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: any) => {
    onChange(e.target.value as string);
  };

  if (clinics.length === 0 && !loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {showLabel && <Typography variant="body2" color="text.secondary">No clinics available</Typography>}
      </Box>
    );
  }

  return (
    <FormControl fullWidth size="small" disabled={disabled || loading}>
      {showLabel && <InputLabel id="clinic-select-label">Clinic</InputLabel>}
      <Select
        labelId="clinic-select-label"
        value={value}
        label={placeholder}
        onChange={handleChange}
        disabled={disabled || loading}
        IconComponent={() => <ExpandMore />}
      >
        {clinics.map((clinic) => (
          <MenuItem key={clinic.id} value={clinic.id}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOn fontSize="small" color="primary" />
              <Box>
                <Typography variant="body2">{clinic.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {clinic.address}
                </Typography>
              </Box>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export function useClinicSelector() {
  const [selectedClinicId, setSelectedClinicId] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`selectedClinic_${user.uid}`);
      if (saved) {
        setSelectedClinicId(saved);
      }
    }
  }, [user]);

  const handleChange = (clinicId: string) => {
    setSelectedClinicId(clinicId);
    if (user) {
      localStorage.setItem(`selectedClinic_${user.uid}`, clinicId);
    }
  };

  return { selectedClinicId, onClinicChange: handleChange };
}