import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
  Paper,
  Rating,
  Stack,
} from '@mui/material';
import {
  LocalHospital,
  Schedule,
  ArrowForward,
  CheckCircleRounded,
  CalendarMonthRounded,
  NotificationsActiveRounded,
} from '@mui/icons-material';
import { clinicService, doctorService, appointmentService } from '../../../services/firestore';
import type { Clinic, Doctor, Appointment } from '../../../types';
import { formatDate } from '../../shared/utils/dateUtils';
import { useAuth } from '../../../features/auth/hooks';
import { useClinicSelector, ClinicSelector } from '../../shared/components/ClinicSelector';
import { DatePicker } from '../../shared/components/DatePicker';

export function PatientDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedClinicId, onClinicChange } = useClinicSelector();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadInitialData(); }, []);

  useEffect(() => {
    if (selectedClinicId) loadDoctorsAndAppointments();
  }, [selectedClinicId, selectedDate]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const data = await clinicService.getAll();
      setClinics(data);
      if (data.length > 0 && !selectedClinicId) onClinicChange(data[0].id);
    } catch (err) {
      setError('Failed to load clinic network');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctorsAndAppointments = async () => {
    if (!selectedClinicId || !user?.uid) return;
    try {
      const [docs, appts] = await Promise.all([
        doctorService.getByClinic(selectedClinicId),
        appointmentService.getByPatient(user.uid),
      ]);
      setDoctors(docs);
      setUpcomingAppointments(appts);
    } catch (err) {
      console.error('Failed to load doctors or appointments:', err);
    }
  };

  const currentClinic = clinics.find((c) => c.id === selectedClinicId) || clinics[0];
  const activeQueueAppointment = upcomingAppointments.find((a) =>
    ['in_progress', 'checked_in', 'booked'].includes(a.status)
  );

  if (loading && clinics.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress size={36} color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '100%' }}>
      {/* ── Welcome + Filters ── */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          fontWeight={800}
          letterSpacing="-0.02em"
          sx={{ color: '#0f172a', mb: 0.5, fontSize: { xs: '1.3rem', sm: '1.5rem', md: '1.65rem' } }}
        >
          Hello, {user?.displayName?.split(' ')[0] || 'Patient'} 👋
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: { xs: '0.82rem', sm: '0.88rem' } }}>
          Find certified doctors, book appointments, and monitor your live queue in real-time.
        </Typography>

        {/* Filters row — stacks on mobile */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Box sx={{ flex: { sm: 1 }, minWidth: 0 }}>
            <ClinicSelector value={selectedClinicId || currentClinic?.id || ''} onChange={onClinicChange} />
          </Box>
          <Box sx={{ flexShrink: 0 }}>
            <DatePicker value={selectedDate} onChange={setSelectedDate} minDate={new Date()} />
          </Box>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── Active Queue Banner ── */}
      {activeQueueAppointment && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 2.5 },
            mb: 3,
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
            color: '#ffffff',
            boxShadow: '0 8px 24px -4px rgba(2, 132, 199, 0.3)',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
            {/* Token Badge */}
            <Box sx={{
              width: 52, height: 52, borderRadius: '14px',
              bgcolor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', border: '1px solid rgba(255,255,255,0.3)', flexShrink: 0,
            }}>
              <Typography variant="caption" sx={{ fontSize: '0.58rem', textTransform: 'uppercase', fontWeight: 700, color: '#e0f2fe' }}>TOKEN</Typography>
              <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1 }}>#{activeQueueAppointment.tokenNumber}</Typography>
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.4 }}>
                <Box className="pulse-indicator" sx={{ bgcolor: '#4ade80' }} />
                <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#ccfbf1', fontSize: '0.65rem' }}>
                  Active Queue — {activeQueueAppointment.status.replace('_', ' ').toUpperCase()}
                </Typography>
              </Box>
              <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                {doctors.find((d) => d.id === activeQueueAppointment.doctorId)?.name || 'Dr. Sarah Jenkins, MD'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem' }}>
                Position #{activeQueueAppointment.queuePosition || 2} in line • Est. wait: ~{activeQueueAppointment.estimatedWaitMinutes || 15} mins
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            onClick={() => navigate(`/patient/queue/${activeQueueAppointment.id}`)}
            endIcon={<ArrowForward />}
            size="small"
            sx={{
              bgcolor: '#ffffff', color: '#0284c7', fontWeight: 700,
              px: 2.5, py: 1, borderRadius: '11px', flexShrink: 0,
              '&:hover': { bgcolor: '#f0f9ff' },
              alignSelf: { xs: 'flex-end', sm: 'center' },
            }}
          >
            Track Live Queue
          </Button>
        </Paper>
      )}

      {/* ── Quick Stats ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            icon: <LocalHospital />,
            bg: 'rgba(2,132,199,0.1)',
            color: 'primary.main',
            label: 'Selected Clinic',
            value: currentClinic?.name || 'Medical Center',
          },
          {
            icon: <Schedule />,
            bg: 'rgba(13,148,136,0.1)',
            color: 'secondary.main',
            label: 'Available Doctors',
            value: `${doctors.length} Specialists On-Duty`,
          },
          {
            icon: <CheckCircleRounded />,
            bg: 'rgba(16,185,129,0.1)',
            color: '#059669',
            label: 'My Appointments',
            value: `${upcomingAppointments.length} Booked Visits`,
          },
        ].map((stat) => (
          <Grid size={{ xs: 12, sm: 4 }} key={stat.label}>
            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '14px', height: '100%' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: '14px !important', px: 2 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: '11px', bgcolor: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {stat.icon}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" sx={{ fontSize: '0.62rem', letterSpacing: '0.04em', display: 'block' }}>
                    {stat.label}
                  </Typography>
                  <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ color: '#0f172a', fontSize: { xs: '0.82rem', md: '0.88rem' } }}>
                    {stat.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Doctors Section Header ── */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6" fontWeight={800} letterSpacing="-0.01em" sx={{ fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' } }}>
          Available Doctors & Specialists
        </Typography>
        <Chip
          label={`${doctors.length} Ready for Consultation`}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 600, fontSize: '0.72rem' }}
        />
      </Box>

      {/* ── Doctor Cards ── */}
      <Grid container spacing={2}>
        {doctors.map((doctor) => {
          const displayName = doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`;
          return (
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
                        {displayName}
                      </Typography>
                      <Typography variant="body2" color="primary.main" fontWeight={600} noWrap sx={{ fontSize: { xs: '0.77rem', md: '0.82rem' } }}>
                        {doctor.specialization}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3, flexWrap: 'wrap' }}>
                        <Rating value={doctor.rating || 4.9} precision={0.1} size="small" readOnly sx={{ fontSize: '0.8rem' }} />
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
                    <Chip label="Slots Available" size="small" color="success" sx={{ fontSize: '0.68rem', height: 20 }} />
                    <Chip label={`${doctor.defaultVisitDuration || 30} min visit`} size="small" variant="outlined" sx={{ fontSize: '0.68rem', height: 20 }} />
                  </Box>
                </CardContent>

<Box sx={{ px: { xs: 2, md: 2.5 }, pb: { xs: 2, md: 2.5 }, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => navigate('/patient/booking')}
                      endIcon={<CalendarMonthRounded />}
                      sx={{ borderRadius: '10px', py: 0.9, fontSize: '0.82rem' }}
                    >
                      Book Appointment
                    </Button>
                  </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
