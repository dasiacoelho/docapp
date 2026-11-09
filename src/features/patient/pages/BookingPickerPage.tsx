import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Grid,
  Chip,
  Avatar,
  TextField,
  Autocomplete,
  Stack,
  Paper,
  Skeleton,
} from '@mui/material';
import {
  LocalHospital,
  Schedule,
  Search,
  ArrowForward,
  CalendarMonth,
  MedicalInformation,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { clinicService, doctorService, slotService } from '../../../services/firestore';
import type { Clinic, Doctor, Slot } from '../../../types';
import { formatDate, formatTime } from '../../shared/utils/dateUtils';
import { useAuth } from '../../../features/auth/hooks';
import { useClinicSelector, ClinicSelector } from '../../shared/components/ClinicSelector';
import { DatePicker } from '../../shared/components/DatePicker';

export function BookingPickerPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedClinicId, onClinicChange } = useClinicSelector();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('');
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOtherClinics, setShowOtherClinics] = useState(false);

  // Load specializations on mount
  useEffect(() => {
    doctorService.getAllSpecializations().then(setSpecializations).catch(() => setSpecializations([]));
  }, []);

  // Load clinics on mount
  useEffect(() => {
    clinicService.getAll().then((data) => {
      setClinics(data);
      // Auto-select first clinic if none selected
      if (data.length > 0 && !selectedClinicId) {
        onClinicChange(data[0].id);
      }
    }).catch((err) => {
      console.error('Failed to load clinics:', err);
      setError('Failed to load clinics');
    });
  }, []);

  // Load doctors when clinic, date, or specialization changes
  useEffect(() => {
    if (selectedClinicId && selectedDate) {
      loadDoctors();
    } else {
      setDoctors([]);
    }
  }, [selectedClinicId, selectedDate, selectedSpecialization]);

  // Reset selected doctor and slots when search criteria changes
  useEffect(() => {
    setSelectedDoctor(null);
    setAvailableSlots([]);
    setShowOtherClinics(false);
  }, [selectedClinicId, selectedDate, selectedSpecialization]);

  const loadDoctors = async () => {
    if (!selectedClinicId || !selectedDate) return;
    setLoading(true);
    setError(null);
    try {
      const dateStr = formatDate(selectedDate, 'yyyy-MM-dd');
      let docs;
      if (selectedSpecialization) {
        docs = await doctorService.getByClinicAndSpecialization(selectedClinicId, selectedSpecialization, dateStr);
      } else {
        docs = await doctorService.getAvailableDoctorsByClinicAndDate(selectedClinicId, dateStr);
      }
      setDoctors(docs);
    } catch (err) {
      console.error('Failed to load doctors:', err);
      setError('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async (doctor: Doctor) => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    setSelectedDoctor(doctor);
    try {
      const dateStr = formatDate(selectedDate, 'yyyy-MM-dd');
      const slots = await slotService.getByDoctorAndDate(doctor.id, dateStr);
      setAvailableSlots(slots);
    } catch (err) {
      console.error('Failed to load slots:', err);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBookSlot = (slot: Slot) => {
    if (!selectedDoctor || !user || slot.isBooked || slot.isBlocked) return;
    navigate(`/patient/booking/${selectedDoctor.id}`, { 
      state: { 
        preSelectedSlot: slot, 
        preSelectedDate: selectedDate,
        preSelectedClinic: selectedClinicId 
      } 
    });
  };

  const handleOtherClinics = async () => {
    if (!selectedSpecialization || !selectedDate) return;
    setShowOtherClinics(true);
    setClinics(prev => prev.map(({ availableDoctors, availableDoctorDetails, ...clinic }) => clinic));
    try {
      const dateStr = formatDate(selectedDate, 'yyyy-MM-dd');
      const otherClinics = await clinicService.getBySpecialization(selectedSpecialization, dateStr);
      // Filter out current clinic
      const filtered = otherClinics.filter(c => c.id !== selectedClinicId);

      setClinics(prev => prev.map(c => {
        const found = filtered.find(fc => fc.id === c.id);
        return found ? { ...c, availableDoctors: found.availableDoctors, availableDoctorDetails: found.availableDoctorDetails } : c;
      }));
    } catch (err) {
      console.error('Failed to load other clinics:', err);
    }
  };

  const currentClinic = clinics.find((c) => c.id === selectedClinicId);
  const otherClinicsWithAvailability = useMemo(() => 
    clinics.filter(c => c.id !== selectedClinicId && (c.availableDoctors ?? 0) > 0), 
    [clinics, selectedClinicId]
  );

  const hasNoAvailableDoctors = !loading && doctors.length === 0 && selectedClinicId && selectedDate;

  return (
    <Box sx={{ maxWidth: '100%' }}>
      {/* ── Welcome + Filters ── */}
      <Card elevation={0} sx={{ mb: 3, borderRadius: '16px', border: '1px solid #e2e8f0', p: { xs: 2, md: 3 } }}>
        <Typography
          variant="h5"
          fontWeight={800}
          letterSpacing="-0.02em"
          sx={{ color: '#0f172a', mb: 2, fontSize: { xs: '1.3rem', md: '1.5rem' } }}
        >
          Find Your Doctor
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontSize: { xs: '0.82rem', md: '0.88rem' } }}>
          Select clinic, date, and specialization to see available doctors
        </Typography>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'flex-start' }}>
          <Box sx={{ flex: { md: 1 }, minWidth: 0 }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Clinic <span style={{ color: '#ef4444' }}>*</span>
            </Typography>
            <ClinicSelector value={selectedClinicId || currentClinic?.id || ''} onChange={onClinicChange} />
          </Box>

          <Box sx={{ flex: { md: 1 }, minWidth: 0, flexShrink: 0 }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Date <span style={{ color: '#ef4444' }}>*</span>
            </Typography>
            <DatePicker value={selectedDate} onChange={setSelectedDate} minDate={new Date()} />
          </Box>

          <Box sx={{ flex: { md: 1 }, minWidth: 0 }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Specialization
            </Typography>
            <Autocomplete
              options={specializations}
              value={selectedSpecialization}
              onChange={(_, v) => setSelectedSpecialization(v || '')}
              freeSolo
              placeholder="Search specialization (e.g. Cardiology)"
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <Box sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
                        <Search fontSize="small" />
                      </Box>
                    ),
                    ...params.InputProps,
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              )}
              sx={{ '& .MuiInputBase-root': { paddingLeft: 36 } }}
            />
          </Box>
        </Stack>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Card>

      {/* ── Doctors Results ── */}
      {selectedClinicId && selectedDate && (
        <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            {/* Results Header */}
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" fontWeight={800} letterSpacing="-0.01em" sx={{ fontSize: { xs: '1rem', md: '1.1rem' } }}>
                {selectedSpecialization ? `Available ${selectedSpecialization} Doctors` : 'Available Doctors'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={currentClinic?.name || 'Selected Clinic'}
                  icon={<LocalHospital fontSize="small" />}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={formatDate(selectedDate, 'MMM d, yyyy')}
                  icon={<CalendarMonth fontSize="small" />}
                  size="small"
                  variant="outlined"
                />
                {selectedSpecialization && (
                  <Chip
                    label={selectedSpecialization}
                    icon={<MedicalInformation fontSize="small" />}
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>

            {!loading && selectedSpecialization && (
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<Search />}
                  onClick={handleOtherClinics}
                  sx={{ borderRadius: '10px' }}
                >
                  Find Other Clinics for {selectedSpecialization}
                </Button>
              </Box>
            )}

            {/* Loading State */}
            {loading && (
              <Grid container spacing={2}>
                {[1, 2, 3, 4].map((i) => (
                  <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={i}>
                    <Skeleton variant="rectangular" height={280} sx={{ borderRadius: '16px' }} />
                  </Grid>
                ))}
              </Grid>
            )}

            {/* No Doctors Available */}
            {!loading && hasNoAvailableDoctors && (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <LocalHospital sx={{ fontSize: 48, color: '#94a3b8', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No {selectedSpecialization ? `${selectedSpecialization} ` : ''}doctors found
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  No active doctors{selectedSpecialization ? ` specializing in ${selectedSpecialization}` : ''} are linked to {currentClinic?.name || 'this clinic'}.
                </Typography>
              </Box>
            )}

            {/* Other Clinics Recommendation */}
            {showOtherClinics && (
              <Box sx={{ mt: 3, p: 2, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" fontWeight={700} color="#0f172a">
                    Other Clinics with {selectedSpecialization} Doctors
                  </Typography>
                  <Button size="small" onClick={() => setShowOtherClinics(false)}>Close</Button>
                </Box>
                {otherClinicsWithAvailability.length === 0 ? (
                  <Alert severity="info">No other clinics have doctors for this specialization.</Alert>
                ) : (
                  <Grid container spacing={2}>
                    {otherClinicsWithAvailability.map((clinic) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={clinic.id}>
                      <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                            <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: 'rgba(2,132,199,0.1)', color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <LocalHospital />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ color: '#0f172a' }}>
                                {clinic.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                {clinic.address}
                              </Typography>
                              <Typography variant="caption" color="primary.main" fontWeight={600}>
                                {clinic.availableDoctors} matching doctor{clinic.availableDoctors !== 1 ? 's' : ''}
                              </Typography>
                            </Box>
                          </Box>
                          
                          {/* Doctor Details */}
                          {clinic.availableDoctorDetails && clinic.availableDoctorDetails.length > 0 && (
                            <Box sx={{ mb: 1.5, pt: 1.5, borderTop: '1px solid #e2e8f0' }}>
                              <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.75, display: 'block' }}>
                                {selectedSpecialization} Doctors:
                              </Typography>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {clinic.availableDoctorDetails.map((doc, idx) => (
                                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: '8px', bgcolor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                                    <Avatar
                                      src={doc.photoUrl}
                                      sx={{ width: 36, height: 36, borderRadius: '8px', border: '2px solid #e2e8f0', flexShrink: 0 }}
                                    >
                                      {doc.name.split(' ').map(n => n[0]).join('')}
                                    </Avatar>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem', color: '#0f172a' }}>
                                        {doc.name}
                                      </Typography>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25, flexWrap: 'wrap' }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                                          {doc.specialization}
                                        </Typography>
                                        {doc.rating && (
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                            <Typography variant="caption" color="warning.main" sx={{ fontSize: '0.68rem', fontWeight: 600 }}>
                                              {doc.rating}
                                            </Typography>
                                          </Box>
                                        )}
                                        {doc.experienceYears && (
                                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                                            {doc.experienceYears} yrs exp
                                          </Typography>
                                        )}
                                      </Box>
                                    </Box>
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          )}
                          
                          <Box sx={{ mt: 1.5 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<ArrowForward />}
                              onClick={() => {
                                onClinicChange(clinic.id);
                                setShowOtherClinics(false);
                              }}
                            >
                              Select This Clinic
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}

            {/* Doctors Grid */}
            {!loading && !hasNoAvailableDoctors && doctors.length > 0 && (
              <Grid container spacing={2}>
                {doctors.map((doctor) => (
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={doctor.id}>
                    <Card
                      elevation={0}
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 10px 24px -4px rgba(15,23,42,0.08)',
                        },
                      }}
                    >
                      <CardContent sx={{ flex: 1, p: { xs: 2, md: 2.5 } }}>
                        {/* Doctor Header */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                          <Avatar
                            src={doctor.photoUrl}
                            sx={{ width: { xs: 52, md: 58 }, height: { xs: 52, md: 58 }, border: '2px solid #e2e8f0', flexShrink: 0 }}
                          >
                            {doctor.name[0]}
                          </Avatar>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ color: '#0f172a', fontSize: { xs: '0.88rem', md: '0.95rem' }, lineHeight: 1.3 }}>
                              {doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`}
                            </Typography>
                            <Typography variant="body2" color="primary.main" fontWeight={600} noWrap sx={{ fontSize: { xs: '0.77rem', md: '0.82rem' } }}>
                              {doctor.specialization}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3, flexWrap: 'wrap' }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.72rem' }}>
                                {doctor.rating ? `${doctor.rating}` : '4.9'} ({doctor.reviewCount || 120}+)
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        <Divider sx={{ my: 1.25 }} />

                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.25, fontSize: { xs: '0.72rem', md: '0.75rem' }, lineHeight: 1.5 }}>
                          {doctor.qualification || 'Board Certified Specialist'} • {doctor.experienceYears || 0} yrs
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                          <Chip label="Clinic doctor" size="small" variant="outlined" sx={{ fontSize: '0.68rem', height: 20 }} />
                          <Chip label={`${doctor.defaultVisitDuration || 30} min`} size="small" variant="outlined" sx={{ fontSize: '0.68rem', height: 20 }} />
                        </Box>
                      </CardContent>

                      <Box sx={{ px: { xs: 2, md: 2.5 }, pb: { xs: 2, md: 2.5 }, pt: 0 }}>
                        <Button
                          fullWidth
                          variant="outlined"
                          onClick={() => loadSlots(doctor)}
                          startIcon={<Schedule />}
                          sx={{ borderRadius: '10px', py: 0.9, fontSize: '0.82rem' }}
                          disabled={loadingSlots}
                        >
                          {loadingSlots && selectedDoctor?.id === doctor.id ? (
                            <>
                              <CircularProgress size={18} sx={{ mr: 1 }} /> Loading slots...
                            </>
                          ) : (
                            'View Available Slots'
                          )}
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            {/* Available Slots for Selected Doctor */}
            {selectedDoctor && availableSlots.length > 0 && !loadingSlots && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="h6" fontWeight={700} color="#0f172a">
                    Slots for {selectedDoctor.name.startsWith('Dr.') ? selectedDoctor.name : `Dr. ${selectedDoctor.name}`}
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setSelectedDoctor(null)}
                    startIcon={<ExpandLess />}
                  >
                    Back to Doctors
                  </Button>
                </Box>
                <Grid container spacing={1.5}>
                  {availableSlots.map((slot) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={slot.id}>
                      <Card
                        elevation={0}
                        sx={{
                          border: '1px solid',
                          borderColor: slot.isBooked || slot.isBlocked ? '#d1d5db' : '#e2e8f0',
                          bgcolor: slot.isBooked || slot.isBlocked ? '#f1f3f5' : '#fff',
                          borderRadius: '12px',
                          p: 1.5,
                          height: '100%',
                        }}
                      >
                        <CardContent>
                          <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            color={slot.isBooked || slot.isBlocked ? 'text.disabled' : '#0f172a'}
                          >
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {slot.durationMinutes} min consultation
                          </Typography>
                          {(slot.isBooked || slot.isBlocked) && (
                            <Chip
                              label={slot.isBlocked ? 'Unavailable' : 'Booked'}
                              size="small"
                              sx={{ mt: 1, bgcolor: '#d1d5db', color: '#4b5563' }}
                            />
                          )}
                          <Box sx={{ mt: 1.5 }}>
                            <Button
                              fullWidth
                              variant="contained"
                              size="small"
                              disabled={slot.isBooked || slot.isBlocked}
                              onClick={() => handleBookSlot(slot)}
                              startIcon={<ArrowForward />}
                              sx={{ borderRadius: '8px' }}
                            >
                              {slot.isBlocked ? 'Unavailable' : slot.isBooked ? 'Booked' : 'Book This Slot'}
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
            {selectedDoctor && availableSlots.length === 0 && !loadingSlots && (
              <Alert severity="info" sx={{ mt: 2 }}>
                No slots have been created for this doctor on the selected date.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedClinicId && !selectedDate && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Please select a clinic and date to see available doctors.
        </Alert>
      )}
    </Box>
  );
}
