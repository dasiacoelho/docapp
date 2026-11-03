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
} from '@mui/material';
import {
  LocalHospital,
  Schedule,
  AccessTime,
  ArrowForward,
  StarRounded,
  CheckCircleRounded,
  NotificationsActiveRounded,
  CalendarMonthRounded,
} from '@mui/icons-material';
import { clinicService, doctorService, appointmentService } from '../../../services/firestore';
import type { Clinic, Doctor, Appointment } from '../../../types';
import { formatDate, formatTime } from '../../shared/utils/dateUtils';
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

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedClinicId) {
      loadDoctorsAndAppointments();
    }
  }, [selectedClinicId, selectedDate]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const data = await clinicService.getAll();
      setClinics(data);
      if (data.length > 0 && !selectedClinicId) {
        onClinicChange(data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load clinic network');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctorsAndAppointments = async () => {
    if (!selectedClinicId) return;
    try {
      const [docs, appts] = await Promise.all([
        doctorService.getByClinic(selectedClinicId),
        appointmentService.getByPatient(user?.uid || 'patient-1'),
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress size={36} color="primary" />
      </Box>
    );
  }

  return (
    <Box>
      {/* Top Welcome & Filter Ribbon */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em" sx={{ color: '#0f172a', mb: 0.5 }}>
            Hello, {user?.displayName?.split(' ')[0] || 'Patient'} 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Find certified doctors, book appointments, and monitor your live queue in real-time.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <ClinicSelector value={selectedClinicId || currentClinic?.id || ''} onChange={onClinicChange} />
          <DatePicker value={selectedDate} onChange={setSelectedDate} minDate={new Date()} />
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Active Live Queue Banner (if appointment exists) */}
      {activeQueueAppointment && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3 },
            mb: 4,
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
            color: '#ffffff',
            boxShadow: '0 10px 30px -5px rgba(2, 132, 199, 0.3)',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            gap: 2.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '16px',
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <Typography variant="caption" sx={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, color: '#e0f2fe' }}>
                TOKEN
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1 }}>
                #{activeQueueAppointment.tokenNumber}
              </Typography>
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Box className="pulse-indicator" sx={{ bgcolor: '#4ade80' }} />
                <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#ccfbf1' }}>
                  ACTIVE QUEUE STATUS: {activeQueueAppointment.status.replace('_', ' ').toUpperCase()}
                </Typography>
              </Box>
              <Typography variant="h6" fontWeight={700}>
                {doctors.find((d) => d.id === activeQueueAppointment.doctorId)?.name || 'Dr. Sarah Jenkins, MD'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                Position #{activeQueueAppointment.queuePosition || 2} in line • Est. wait: ~{activeQueueAppointment.estimatedWaitMinutes || 15} mins
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            onClick={() => navigate(`/patient/queue/${activeQueueAppointment.id}`)}
            endIcon={<ArrowForward />}
            sx={{
              bgcolor: '#ffffff',
              color: '#0284c7',
              fontWeight: 700,
              px: 3,
              py: 1.2,
              borderRadius: '12px',
              '&:hover': { bgcolor: '#f0f9ff' },
            }}
          >
            Track Live Queue
          </Button>
        </Paper>
      )}

      {/* Quick Stats Grid */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card elevation={0} sx={{ p: 1, border: '1px solid #e2e8f0', borderRadius: '16px' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: 'rgba(2, 132, 199, 0.1)', color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LocalHospital />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                  Selected Clinic
                </Typography>
                <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ maxWidth: 220 }}>
                  {currentClinic?.name || 'Medical Center'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card elevation={0} sx={{ p: 1, border: '1px solid #e2e8f0', borderRadius: '16px' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: 'rgba(13, 148, 136, 0.1)', color: 'secondary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Schedule />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                  Available Doctors
                </Typography>
                <Typography variant="subtitle1" fontWeight={700}>
                  {doctors.length} Specialists On-Duty
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card elevation={0} sx={{ p: 1, border: '1px solid #e2e8f0', borderRadius: '16px' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircleRounded />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                  My Appointments
                </Typography>
                <Typography variant="subtitle1" fontWeight={700}>
                  {upcomingAppointments.length} Booked Visits
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Available Doctors Section */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5" fontWeight={800} letterSpacing="-0.01em">
          Available Doctors & Specialists
        </Typography>
        <Chip label={`${doctors.length} Ready for Consultation`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
      </Box>

      <Grid container spacing={3}>
        {doctors.map((doctor) => {
          const displayName = doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`;
          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={doctor.id}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '18px',
                  border: '1px solid #e2e8f0',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.08)',
                  },
                }}
              >
                <CardContent sx={{ flex: 1, p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar
                      src={doctor.photoUrl}
                      sx={{ width: 64, height: 64, border: '2px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                    >
                      {doctor.name[0]}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" fontWeight={700} noWrap sx={{ color: '#0f172a' }}>
                        {displayName}
                      </Typography>
                      <Typography variant="body2" color="primary.main" fontWeight={600} noWrap>
                        {doctor.specialization}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                        <Rating value={4.9} precision={0.1} size="small" readOnly sx={{ fontSize: '0.9rem' }} />
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          4.9 (120+)
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                    {doctor.qualification || 'Board Certified Specialist'} • {doctor.experienceYears || 12} yrs experience
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label="Slots Available" size="small" color="success" sx={{ fontSize: '0.7rem', height: 22 }} />
                    <Chip label="30 min visit" size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />
                  </Box>
                </CardContent>

                <Box sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => navigate(`/patient/booking/${doctor.id}`)}
                    endIcon={<CalendarMonthRounded />}
                    sx={{ borderRadius: '10px', py: 1 }}
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