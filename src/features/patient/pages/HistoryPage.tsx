import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Button,
  IconButton,
  Divider,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Skeleton,
} from '@mui/material';
import { ArrowBack, Person, Schedule, AccessTime, CheckCircle, Cancel, Error as ErrorIcon, Info, History } from '@mui/icons-material';
import { appointmentService, firestoreService } from '../../../services/firestore';
import type { Appointment } from '../../../types';
import { formatDate, formatTime, formatDateTime, isPast } from '../../shared/utils/dateUtils';
import { useAuth } from '../../../features/auth/hooks';

export function HistoryPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  useEffect(() => {
    loadAppointments();
  }, [user]);

  const loadAppointments = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const patient = await firestoreService.patientService.getByUserId(user.uid);
      if (patient) {
        const data = await appointmentService.getByPatient(patient.id);
        setAppointments(data);
      }
    } catch (err) {
      setError('Failed to load appointment history');
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter((appt) => {
    if (filter === 'upcoming') return !isPast(appt.scheduledStart) && !['completed', 'cancelled', 'no_show'].includes(appt.status);
    if (filter === 'past') return isPast(appt.scheduledStart) || ['completed', 'cancelled', 'no_show'].includes(appt.status);
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'primary';
      case 'checked_in': return 'info';
      case 'booked': return 'warning';
      case 'cancelled': return 'error';
      case 'no_show': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle fontSize="small" color="success" />;
      case 'in_progress': return <Schedule fontSize="small" color="primary" />;
      case 'checked_in': return <Info fontSize="small" color="info" />;
      case 'booked': return <Schedule fontSize="small" color="warning" />;
      case 'cancelled': return <Cancel fontSize="small" color="error" />;
      case 'no_show': return <ErrorIcon fontSize="small" color="error" />;
      default: return <Info fontSize="small" />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box maxWidth={900} mx="auto">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button variant="text" startIcon={<ArrowBack />} onClick={() => window.history.back()}>
          Back to Dashboard
        </Button>
        <Typography variant="h5" component="h2" gutterBottom>
          Appointment History
        </Typography>
      </Box>

      <Card elevation={1} sx={{ mb: 3 }}>
        <CardContent>
          <Tabs
            value={filter}
            onChange={(_, v) => setFilter(v as any)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}
          >
            <Tab label="All" />
            <Tab label="Upcoming" />
            <Tab label="Past" />
          </Tabs>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {filteredAppointments.length === 0 ? (
        <Card elevation={1}>
          <CardContent sx={{ py: 6, textAlign: 'center' }}>
            <History fontSize="large" color="text.secondary" sx={{ mb: 2 }} />
            <Typography variant="h6" component="h3" color="text.secondary" gutterBottom>
              No appointments found
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {filter === 'upcoming' 
                ? 'You have no upcoming appointments.' 
                : filter === 'past' 
                ? 'You have no past appointments.' 
                : 'Book your first appointment to get started!'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card elevation={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Clinic</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Token</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAppointments.map((appt) => (
                  <TableRow key={appt.id} hover>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(appt.scheduledStart)}
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {formatTime(appt.scheduledStart)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar size={32} sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                          <Person fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight={500}>Dr. {appt.doctorId}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {appt.appointmentType}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1">Clinic {appt.clinicId}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={appt.appointmentType} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        {getStatusIcon(appt.status)}
                        <Chip
                          label={appt.status.replace('_', ' ')}
                          size="small"
                          color={getStatusColor(appt.status)}
                          variant={['completed', 'cancelled', 'no_show'].includes(appt.status) ? 'filled' : 'outlined'}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body1" fontWeight={500} fontFamily="monospace">
                        #{appt.tokenNumber}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {!isPast(appt.scheduledStart) && ['booked', 'checked_in'].includes(appt.status) && (
                        <Button size="small" href={`/patient/queue/${appt.id}`}>
                          Track Queue
                        </Button>
                      )}
                      {isPast(appt.scheduledStart) && appt.status === 'booked' && (
                        <Button size="small" color="error" variant="outlined">
                          Missed
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
}