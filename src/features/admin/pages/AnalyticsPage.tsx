import React, { useState, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Paper,
  Chip,
  Tooltip,
  IconButton,
} from '@mui/material';
import { Analytics, TrendingUp, Download, DateRange, People, Schedule, LocalHospital, Assessment, Speed, Timer } from '@mui/icons-material';
import { appointmentService, doctorService, clinicService, firestoreService } from '../../../services/firestore';
import type { Appointment, Doctor, Clinic } from '../../../types';
import { formatDate, formatTime, getMinutesDifference, isToday } from '../../shared/utils/dateUtils';
import { subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { useAuth } from '../../../features/auth/hooks';
import { DatePicker } from '../../shared/components/DatePicker';

export function AnalyticsPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: subDays(new Date(), 30),
    end: new Date(),
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [clinicsData, doctorsData] = await Promise.all([
        clinicService.getAll(),
        doctorService.getAll(),
      ]);
      setClinics(clinicsData);
      setDoctors(doctorsData);

      // Load appointments for all clinics in date range
      const allAppointments: Appointment[] = [];
      for (const clinic of clinicsData) {
        const startStr = formatDate(dateRange.start, 'yyyy-MM-dd');
        const endStr = formatDate(dateRange.end, 'yyyy-MM-dd');
        const appts = await appointmentService.getByClinicAndDateRange(clinic.id, startStr, endStr);
        allAppointments.push(...appts);
      }
      setAppointments(allAppointments);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter(a => 
    new Date(a.scheduledStart) >= dateRange.start && new Date(a.scheduledStart) <= dateRange.end
  );

  const completedAppointments = filteredAppointments.filter(a => a.status === 'completed');
  const cancelledAppointments = filteredAppointments.filter(a => a.status === 'cancelled');
  const noShowAppointments = filteredAppointments.filter(a => a.status === 'no_show');

  const avgWaitTime = calculateAvgWaitTime(completedAppointments);
  const avgConsultationTime = calculateAvgConsultationTime(completedAppointments);
  const noShowRate = filteredAppointments.length > 0 
    ? ((noShowAppointments.length / filteredAppointments.length) * 100).toFixed(1) 
    : '0';
  const completionRate = filteredAppointments.length > 0
    ? ((completedAppointments.length / filteredAppointments.length) * 100).toFixed(1)
    : '0';

  const clinicStats = clinics.map(clinic => {
    const clinicAppts = filteredAppointments.filter(a => a.clinicId === clinic.id);
    const completed = clinicAppts.filter(a => a.status === 'completed');
    const cancelled = clinicAppts.filter(a => a.status === 'cancelled');
    const noShows = clinicAppts.filter(a => a.status === 'no_show');
    return {
      clinic,
      total: clinicAppts.length,
      completed: completed.length,
      cancelled: cancelled.length,
      noShows: noShows.length,
      avgWait: calculateAvgWaitTime(completed),
      completionRate: clinicAppts.length > 0 ? ((completed.length / clinicAppts.length) * 100).toFixed(1) : '0',
    };
  });

  const doctorStats = doctors.filter(d => d.status === 'active').map(doctor => {
    const docAppts = filteredAppointments.filter(a => a.doctorId === doctor.id);
    const completed = docAppts.filter(a => a.status === 'completed');
    const cancelled = docAppts.filter(a => a.status === 'cancelled');
    const noShows = docAppts.filter(a => a.status === 'no_show');
    const avgConsult = calculateAvgConsultationTime(completed);
    return {
      doctor,
      total: docAppts.length,
      completed: completed.length,
      cancelled: cancelled.length,
      noShows: noShows.length,
      avgConsultation: avgConsult,
      completionRate: docAppts.length > 0 ? ((completed.length / docAppts.length) * 100).toFixed(1) : '0',
    };
  }).sort((a, b) => b.total - a.total);

  const dailyStats = getDailyStats(filteredAppointments, dateRange);

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
            Analytics & Reports
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={getRangeLabel(dateRange)}
              label="Date Range"
              onChange={(e) => setDateRange(getRangeFromLabel(e.target.value))}
            >
              <MenuItem value="today">{formatDate(new Date())}</MenuItem>
              <MenuItem value="week">Last 7 Days</MenuItem>
              <MenuItem value="month">Last 30 Days</MenuItem>
              <MenuItem value="quarter">Last 90 Days</MenuItem>
              <MenuItem value="custom">Custom Range</MenuItem>
            </Select>
          </FormControl>
          <DatePicker value={dateRange.start} onChange={(d) => setDateRange({ ...dateRange, start: d })} />
          <Typography variant="body2" color="text.secondary">to</Typography>
          <DatePicker value={dateRange.end} onChange={(d) => setDateRange({ ...dateRange, end: d })} />
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 2, color: 'primary.contrastText' }}>
                  <Assessment fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Total Appointments</Typography>
                  <Typography variant="h5" component="h3">{filteredAppointments.length}</Typography>
                </Box>
              </Box>
              <Divider variant="inset" />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label={`Completed: ${completedAppointments.length}`} size="small" color="success" variant="outlined" />
                <Chip label={`Cancelled: ${cancelledAppointments.length}`} size="small" color="error" variant="outlined" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 2, color: 'success.contrastText' }}>
                  <TrendingUp fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Completion Rate</Typography>
                  <Typography variant="h5" component="h3">{completionRate}%</Typography>
                </Box>
              </Box>
              <Divider variant="inset" />
              <Chip label={`No-show Rate: ${noShowRate}%`} size="small" color="warning" variant="outlined" />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 2, color: 'info.contrastText' }}>
                  <Speed fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Avg Wait Time</Typography>
                  <Typography variant="h5" component="h3">{avgWaitTime} min</Typography>
                </Box>
              </Box>
              <Divider variant="inset" />
              <Typography variant="body2" color="text.secondary">Based on {completedAppointments.length} completed visits</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 2, color: 'warning.contrastText' }}>
                  <Timer fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Avg Consultation</Typography>
                  <Typography variant="h5" component="h3">{avgConsultationTime} min</Typography>
                </Box>
              </Box>
              <Divider variant="inset" />
              <Typography variant="body2" color="text.secondary">Based on {completedAppointments.length} completed visits</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ mb: 3 }}>
        <Tab label="Clinic Performance" icon={<LocalHospital />} />
        <Tab label="Doctor Performance" icon={<People />} />
        <Tab label="Daily Trends" icon={<TrendingUp />} />
        <Tab label="Appointment Types" icon={<Schedule />} />
      </Tabs>

      {tab === 0 && (
        <Card elevation={1}>
          <CardContent>
            <Typography variant="h6" component="h3" gutterBottom>
              Clinic Performance
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Clinic</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Completed</TableCell>
                  <TableCell align="right">Cancelled</TableCell>
                  <TableCell align="right">No-Shows</TableCell>
                  <TableCell align="right">Completion %</TableCell>
                  <TableCell align="right">Avg Wait</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clinicStats.map((stat) => (
                  <TableRow key={stat.clinic.id} hover>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>{stat.clinic.name}</Typography>
                    </TableCell>
                    <TableCell align="right">{stat.total}</TableCell>
                    <TableCell align="right"><Chip label={stat.completed} size="small" color="success" variant="outlined" /></TableCell>
                    <TableCell align="right"><Chip label={stat.cancelled} size="small" color="error" variant="outlined" /></TableCell>
                    <TableCell align="right"><Chip label={stat.noShows} size="small" color="warning" variant="outlined" /></TableCell>
                    <TableCell align="right">
                      <Chip label={`${stat.completionRate}%`} size="small" variant="outlined" color={parseFloat(stat.completionRate) >= 80 ? 'success' : 'warning'} />
                    </TableCell>
                    <TableCell align="right">{stat.avgWait} min</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {tab === 1 && (
        <Card elevation={1}>
          <CardContent>
            <Typography variant="h6" component="h3" gutterBottom>
              Doctor Performance
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Specialization</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Completed</TableCell>
                  <TableCell align="right">Cancelled</TableCell>
                  <TableCell align="right">No-Shows</TableCell>
                  <TableCell align="right">Completion %</TableCell>
                  <TableCell align="right">Avg Consult</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {doctorStats.map((stat) => (
                  <TableRow key={stat.doctor.id} hover>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>Dr. {stat.doctor.name}</Typography>
                    </TableCell>
                    <TableCell><Chip label={stat.doctor.specialization} size="small" variant="outlined" /></TableCell>
                    <TableCell align="right">{stat.total}</TableCell>
                    <TableCell align="right"><Chip label={stat.completed} size="small" color="success" variant="outlined" /></TableCell>
                    <TableCell align="right"><Chip label={stat.cancelled} size="small" color="error" variant="outlined" /></TableCell>
                    <TableCell align="right"><Chip label={stat.noShows} size="small" color="warning" variant="outlined" /></TableCell>
                    <TableCell align="right">
                      <Chip label={`${stat.completionRate}%`} size="small" variant="outlined" color={parseFloat(stat.completionRate) >= 80 ? 'success' : 'warning'} />
                    </TableCell>
                    <TableCell align="right">{stat.avgConsultation} min</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {tab === 2 && (
        <Card elevation={1}>
          <CardContent>
            <Typography variant="h6" component="h3" gutterBottom>
              Daily Trends
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Appointments</TableCell>
                  <TableCell align="right">Completed</TableCell>
                  <TableCell align="right">Cancelled</TableCell>
                  <TableCell align="right">No-Shows</TableCell>
                  <TableCell align="right">Avg Wait (min)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dailyStats.slice().reverse().map((day) => (
                  <TableRow key={day.date} hover>
                    <TableCell>{day.date}</TableCell>
                    <TableCell align="right">{day.total}</TableCell>
                    <TableCell align="right"><Chip label={day.completed} size="small" color="success" variant="outlined" /></TableCell>
                    <TableCell align="right"><Chip label={day.cancelled} size="small" color="error" variant="outlined" /></TableCell>
                    <TableCell align="right"><Chip label={day.noShows} size="small" color="warning" variant="outlined" /></TableCell>
                    <TableCell align="right">{day.avgWait}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {tab === 3 && (
        <Card elevation={1}>
          <CardContent>
            <Typography variant="h6" component="h3" gutterBottom>
              Appointment Type Distribution
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              {getAppointmentTypeStats(filteredAppointments).map((stat) => (
                <Box key={stat.type} sx={{ flex: '1 1 200px' }}>
                  <Card elevation={1} sx={{ p: 2, textAlign: 'center', minWidth: 200 }}>
                    <Typography variant="h4" component="h2" color="primary.main">{stat.count}</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{stat.type}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {((stat.count / filteredAppointments.length) * 100).toFixed(1)}%
                    </Typography>
                  </Card>
                </Box>
              ))}
            </Box>
            <Typography variant="h6" component="h3" gutterBottom>
              By Type Details
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Completed</TableCell>
                  <TableCell align="right">Cancelled</TableCell>
                  <TableCell align="right">No-Shows</TableCell>
                  <TableCell align="right">Avg Wait</TableCell>
                  <TableCell align="right">Avg Duration</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getAppointmentTypeStats(filteredAppointments).map((stat) => {
                  const typeAppts = filteredAppointments.filter(a => a.appointmentType === stat.type);
                  const completed = typeAppts.filter(a => a.status === 'completed');
                  return (
                    <TableRow key={stat.type} hover>
                      <TableCell><Chip label={stat.type} size="small" variant="outlined" /></TableCell>
                      <TableCell align="right">{stat.count}</TableCell>
                      <TableCell align="right">{completed.length}</TableCell>
                      <TableCell align="right">{typeAppts.filter(a => a.status === 'cancelled').length}</TableCell>
                      <TableCell align="right">{typeAppts.filter(a => a.status === 'no_show').length}</TableCell>
                      <TableCell align="right">{calculateAvgWaitTime(completed)} min</TableCell>
                      <TableCell align="right">{calculateAvgConsultationTime(completed)} min</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

function calculateAvgWaitTime(appointments: Appointment[]): number {
  const completed = appointments.filter(a => a.actualStart && a.scheduledStart);
  if (completed.length === 0) return 0;
  const totalWait = completed.reduce((sum, a) => sum + getMinutesDifference(a.scheduledStart, a.actualStart!), 0);
  return Math.round(totalWait / completed.length);
}

function calculateAvgConsultationTime(appointments: Appointment[]): number {
  const completed = appointments.filter(a => a.actualStart && a.actualEnd);
  if (completed.length === 0) return 0;
  const totalTime = completed.reduce((sum, a) => sum + getMinutesDifference(a.actualStart!, a.actualEnd!), 0);
  return Math.round(totalTime / completed.length);
}

function getDailyStats(appointments: Appointment[], range: { start: Date; end: Date }) {
  const days = eachDayOfInterval({ start: range.start, end: range.end });
  return days.map(day => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dayAppts = appointments.filter(a => 
      new Date(a.scheduledStart) >= dayStart && new Date(a.scheduledStart) <= dayEnd
    );
    const completed = dayAppts.filter(a => a.status === 'completed');
    const avgWait = calculateAvgWaitTime(completed);
    
    return {
      date: formatDate(day, 'MMM dd, EEE'),
      total: dayAppts.length,
      completed: completed.length,
      cancelled: dayAppts.filter(a => a.status === 'cancelled').length,
      noShows: dayAppts.filter(a => a.status === 'no_show').length,
      avgWait,
    };
  }).filter(d => d.total > 0);
}

function getAppointmentTypeStats(appointments: Appointment[]) {
  const types = [...new Set(appointments.map(a => a.appointmentType))];
  return types.map(type => ({
    type,
    count: appointments.filter(a => a.appointmentType === type).length,
  })).sort((a, b) => b.count - a.count);
}

function getRangeLabel(range: { start: Date; end: Date }): string {
  const today = new Date();
  const weekAgo = subDays(today, 7);
  const monthAgo = subDays(today, 30);
  const quarterAgo = subDays(today, 90);
  
  if (isToday(range.start) && isToday(range.end)) return 'today';
  if (range.start >= weekAgo && range.end >= today) return 'week';
  if (range.start >= monthAgo && range.end >= today) return 'month';
  if (range.start >= quarterAgo && range.end >= today) return 'quarter';
  return 'custom';
}

function getRangeFromLabel(label: string): { start: Date; end: Date } {
  const today = new Date();
  switch (label) {
    case 'today':
      return { start: today, end: today };
    case 'week':
      return { start: subDays(today, 7), end: today };
    case 'month':
      return { start: subDays(today, 30), end: today };
    case 'quarter':
      return { start: subDays(today, 90), end: today };
    default:
      return { start: subDays(today, 30), end: today };
  }
}