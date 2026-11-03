import React, { useState, useEffect } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Speed, LocalHospital, People, Schedule, Assessment, TrendingUp } from '@mui/icons-material';
import { appointmentService, doctorService, clinicService, firestoreService } from '../../../services/firestore';
import type { Clinic, Doctor, Appointment } from '../../../types';
import { formatDate, formatTime, getMinutesDifference, isToday } from '../../shared/utils/dateUtils';
import { useAuth } from '../../../features/auth/hooks';
import { DatePicker } from '../../shared/components/DatePicker';

export function AdminDashboard() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [clinicsData, doctorsData] = await Promise.all([
        clinicService.getAll(),
        doctorService.getAll(),
      ]);
      setClinics(clinicsData);
      setDoctors(doctorsData);
      
      if (clinicsData.length > 0) {
        const appointmentsData = await appointmentService.getByClinicAndDate(
          clinicsData[0].id, 
          formatDate(selectedDate, 'yyyy-MM-dd')
        );
        setAppointments(appointmentsData);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const todayAppointments = appointments.filter(a => isToday(a.scheduledStart));
  const totalAppointments = appointments.length;
  const completedToday = todayAppointments.filter(a => a.status === 'completed').length;
  const cancelledToday = todayAppointments.filter(a => a.status === 'cancelled').length;
  const noShowToday = todayAppointments.filter(a => a.status === 'no_show').length;
  const avgWaitTime = calculateAvgWaitTime(todayAppointments);
  const utilizationRate = calculateUtilization(doctors, todayAppointments);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Admin Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            System overview for {formatDate(selectedDate)}
          </Typography>
        </Box>
        <DatePicker value={selectedDate} onChange={setSelectedDate} />
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 2, color: 'primary.contrastText' }}>
                  <LocalHospital fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    Total Clinics
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Active locations</Typography>
                </Box>
              </Box>
              <Divider />
              <Typography variant="h3" component="h2" gutterBottom>
                {clinics.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 2, color: 'success.contrastText' }}>
                  <People fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    Registered Doctors
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Active physicians</Typography>
                </Box>
              </Box>
              <Divider />
              <Typography variant="h3" component="h2" gutterBottom>
                {doctors.filter(d => d.status === 'active').length}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {doctors.length} total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 2, color: 'info.contrastText' }}>
                  <Schedule fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    Today's Appointments
                  </Typography>
                  <Typography variant="body2" color="text.secondary">All clinics combined</Typography>
                </Box>
              </Box>
              <Divider />
              <Typography variant="h3" component="h2" gutterBottom>
                {todayAppointments.length}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {completedToday} completed • {cancelledToday} cancelled
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 2, color: 'warning.contrastText' }}>
                  <Speed fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    Avg Wait Time
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Estimated today</Typography>
                </Box>
              </Box>
              <Divider />
              <Typography variant="h3" component="h2" gutterBottom>
                {avgWaitTime} min
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={1}>
            <CardContent>
              <Typography variant="h6" component="h3" gutterBottom>
                Appointments by Clinic
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Clinic</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Completed</TableCell>
                    <TableCell align="right">Pending</TableCell>
                    <TableCell align="right">Cancelled</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clinics.map((clinic) => {
                    const clinicAppts = todayAppointments.filter(a => a.clinicId === clinic.id);
                    return (
                      <TableRow key={clinic.id} hover>
                        <TableCell>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{clinic.name}</Typography>
                        </TableCell>
                        <TableCell align="right">{clinicAppts.length}</TableCell>
                        <TableCell align="right"><Chip label={clinicAppts.filter(a => a.status === 'completed').length} size="small" color="success" variant="outlined" /></TableCell>
                        <TableCell align="right"><Chip label={clinicAppts.filter(a => ['booked', 'checked_in', 'in_progress'].includes(a.status)).length} size="small" color="warning" variant="outlined" /></TableCell>
                        <TableCell align="right"><Chip label={clinicAppts.filter(a => a.status === 'cancelled').length} size="small" color="error" variant="outlined" /></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={1}>
            <CardContent>
              <Typography variant="h6" component="h3" gutterBottom>
                Doctor Utilization Today
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Doctor</TableCell>
                    <TableCell>Clinic</TableCell>
                    <TableCell align="right">Scheduled</TableCell>
                    <TableCell align="right">Completed</TableCell>
                    <TableCell align="right">Utilization</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {doctors.filter(d => d.status === 'active').map((doctor) => {
                    const docAppts = todayAppointments.filter(a => a.doctorId === doctor.id);
                    const scheduled = docAppts.length;
                    const completed = docAppts.filter(a => a.status === 'completed').length;
                    const utilization = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;
                    return (
                      <TableRow key={doctor.id} hover>
                        <TableCell>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>Dr. {doctor.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{doctor.specialization}</Typography>
                        </TableCell>
                        <TableCell>{clinics.find(c => c.id === doctor.clinicIds[0])?.name || 'N/A'}</TableCell>
                        <TableCell align="right">{scheduled}</TableCell>
                        <TableCell align="right">{completed}</TableCell>
                        <TableCell align="right">
                          <Chip label={`${utilization}%`} size="small" variant="outlined" color={utilization >= 80 ? 'success' : utilization >= 50 ? 'warning' : 'error'} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card elevation={1}>
        <CardContent>
          <Typography variant="h6" component="h3" gutterBottom>
            Recent Appointments
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Clinic</TableCell>
                <TableCell>Doctor</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {todayAppointments
                .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())
                .slice(0, 10)
                .map((appt) => (
                  <TableRow key={appt.id} hover>
                    <TableCell>{formatTime(appt.scheduledStart)}</TableCell>
                    <TableCell>{clinics.find(c => c.id === appt.clinicId)?.name || appt.clinicId}</TableCell>
                    <TableCell>Dr. {doctors.find(d => d.id === appt.doctorId)?.name || appt.doctorId}</TableCell>
                    <TableCell>Patient {appt.patientId.slice(-6)}</TableCell>
                    <TableCell><Chip label={appt.appointmentType} size="small" variant="outlined" /></TableCell>
                    <TableCell align="center">
                      <Chip
                        label={appt.status.replace('_', ' ')}
                        size="small"
                        color={
                          appt.status === 'completed' ? 'success' :
                          appt.status === 'in_progress' ? 'primary' :
                          appt.status === 'checked_in' ? 'info' :
                          appt.status === 'booked' ? 'warning' : 'error'
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              {todayAppointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">No appointments for today</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}

function calculateAvgWaitTime(appointments: Appointment[]): number {
  const completed = appointments.filter(a => a.status === 'completed' && a.actualStart && a.scheduledStart);
  if (completed.length === 0) return 0;
  const totalWait = completed.reduce((sum, a) => {
    const wait = getMinutesDifference(a.scheduledStart, a.actualStart!);
    return sum + wait;
  }, 0);
  return Math.round(totalWait / completed.length);
}

function calculateUtilization(doctors: Doctor[], appointments: Appointment[]): number {
  const activeDoctors = doctors.filter(d => d.status === 'active');
  if (activeDoctors.length === 0) return 0;
  const totalScheduled = appointments.length;
  const totalCompleted = appointments.filter(a => a.status === 'completed').length;
  return totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;
}