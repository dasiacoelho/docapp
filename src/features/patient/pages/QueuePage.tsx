import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Button,
  IconButton,
  Divider,
  Skeleton,
} from "@mui/material";
import {
  ArrowBack,
  Person,
  AccessTime,
  Schedule,
  CheckCircle,
  Error as ErrorIcon,
  Refresh,
  Notifications,
} from "@mui/icons-material";
import {
  appointmentService,
  doctorService,
  firestoreService,
  patientService,
  toDate,
} from "../../../services/firestore";
import type { Appointment, Doctor } from "../../../types";
import {
  formatDate,
  formatTime,
  getRelativeTimeString,
  formatDuration,
} from "../../shared/utils/dateUtils";
import {
  calculateQueuePosition,
  calculateEstimatedWait,
  getQueueStats,
} from "../../shared/utils/queueUtils";
import { useAuth } from "../../../features/auth/hooks";
import {
  notificationManager,
  InAppNotification,
} from "../../../services/notifications";

export function QueuePage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [clinicAppointments, setClinicAppointments] = useState<Appointment[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queuePosition, setQueuePosition] = useState(0);
  const [estimatedWait, setEstimatedWait] = useState(0);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);
  const [noActiveVisit, setNoActiveVisit] = useState(false);

  useEffect(() => {
    if (appointmentId) {
      loadAppointment();
      setupRealtimeListener();
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [appointmentId]);

  // Reached from the sidebar without an id: resolve the patient's active visit
  // and continue to it, otherwise show an explicit empty state.
  useEffect(() => {
    if (appointmentId) return;

    let cancelled = false;

    const resolveActiveVisit = async () => {
      try {
        const patient = await patientService.getByUserId(user?.uid || "");
        const appointments = patient
          ? await appointmentService.getByPatient(patient.id)
          : [];
        const active = appointments.find(
          (appt) =>
            appt.patientId === patient?.id &&
            ["booked", "checked_in", "in_progress"].includes(appt.status),
        );

        if (cancelled) return;
        if (active) navigate(`/patient/queue/${active.id}`, { replace: true });
        else setNoActiveVisit(true);
      } catch (err) {
        if (!cancelled) setError("Failed to load your active visit");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    resolveActiveVisit();
    return () => {
      cancelled = true;
    };
  }, [appointmentId, user?.uid, navigate]);

  const loadAppointment = async () => {
    try {
      const appt = await appointmentService.getById(appointmentId!);
      if (appt) {
        setAppointment(appt);
        const clinicAppts = await appointmentService.getByClinicAndDate(
          appt.clinicId,
          formatDate(appt.scheduledStart, "yyyy-MM-dd"),
        );
        setClinicAppointments(clinicAppts);
        updateQueueStats(clinicAppts, appt.id);
      }
    } catch (err) {
      setError("Failed to load appointment");
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeListener = () => {
    if (!appointmentId) return;

    const unsub = firestoreService.onSnapshot(
      "appointments",
      appointmentId,
      (snap) => {
        if (snap.exists()) {
          const updated = { id: snap.id, ...snap.data() } as Appointment;
          setAppointment(updated);
          if (clinicAppointments.length > 0) {
            updateQueueStats(clinicAppointments, updated.id);
          }
        }
      },
    );
    setUnsubscribe(unsub);
  };

  const updateQueueStats = (
    appointments: Appointment[],
    currentAppointmentId: string,
  ) => {
    const position = calculateQueuePosition(appointments, currentAppointmentId);
    const wait = calculateEstimatedWait(appointments, currentAppointmentId);
    setQueuePosition(position);
    setEstimatedWait(wait);
  };

  const handleRefresh = async () => {
    setLoading(true);
    await loadAppointment();
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (noActiveVisit) {
    return (
      <Card elevation={1} sx={{ maxWidth: 600, mx: "auto" }}>
        <CardContent sx={{ textAlign: "center", py: 6 }}>
          <Person sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
          <Typography variant="h6" gutterBottom>
            No active visit
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You are not in a queue right now. Book an appointment to join one.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate("/patient/booking")}
          >
            Book Appointment
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (error || !appointment) {
    return (
      <Alert severity="error" onClose={() => navigate("/patient/booking")}>
        {error || "Appointment not found"}
      </Alert>
    );
  }

  const isActive = ["checked_in", "in_progress"].includes(appointment.status);
  const isCompleted = ["completed", "cancelled", "no_show"].includes(
    appointment.status,
  );

  // Firestore may return Timestamps while the demo data uses Date objects.
  const scheduledStart = toDate(appointment.scheduledStart);
  const scheduledEnd = toDate(appointment.scheduledEnd);
  const durationMinutes =
    scheduledStart && scheduledEnd
      ? Math.round((scheduledEnd.getTime() - scheduledStart.getTime()) / 60000)
      : 0;

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button
          variant="text"
          startIcon={<ArrowBack />}
          onClick={() => navigate("/patient/booking")}
        >
          Back to Dashboard
        </Button>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Queue Tracker
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your digital token: <strong>#{appointment.tokenNumber}</strong>
          </Typography>
        </Box>
        <IconButton onClick={handleRefresh} aria-label="Refresh">
          <Refresh />
        </IconButton>
      </Box>

      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: isActive ? "success.light" : "primary.light",
                color: isActive
                  ? "success.contrastText"
                  : "primary.contrastText",
                minWidth: 120,
                textAlign: "center",
              }}
            >
              <Typography variant="h2" component="h1" gutterBottom>
                {queuePosition || "—"}
              </Typography>
              <Typography variant="caption" sx={{ textTransform: "uppercase" }}>
                Position in Queue
              </Typography>
            </Box>
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: "warning.light",
                color: "warning.contrastText",
                minWidth: 120,
                textAlign: "center",
              }}
            >
              <Typography variant="h2" component="h1" gutterBottom>
                {estimatedWait > 0 ? `${estimatedWait} min` : "—"}
              </Typography>
              <Typography variant="caption" sx={{ textTransform: "uppercase" }}>
                Est. Wait Time
              </Typography>
            </Box>
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: "info.light",
                color: "info.contrastText",
                minWidth: 120,
                textAlign: "center",
                flexGrow: 1,
              }}
            >
              <Typography variant="h6" component="h2" gutterBottom>
                {appointment.status.replace("_", " ")}
              </Typography>
              <Typography variant="caption" sx={{ textTransform: "uppercase" }}>
                Current Status
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card elevation={1} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" component="h3" gutterBottom>
            Appointment Details
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Doctor
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {appointment.doctorId === "doctor-1"
                  ? "Dr. Sarah Jenkins, MD"
                  : appointment.doctorId === "doctor-2"
                    ? "Dr. Marcus Vance, MD"
                    : "Dr. Specialist"}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Scheduled Time
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {formatTime(appointment.scheduledStart)}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Duration
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {formatDuration(durationMinutes)}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Appointment Type
              </Typography>
              <Chip
                label={appointment.appointmentType}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 600, mt: 0.5 }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card elevation={1} sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6" component="h3" gutterBottom>
              Live Queue
            </Typography>
            <Chip
              label={`Total: ${getQueueStats(clinicAppointments).total}`}
              size="small"
              variant="outlined"
            />
          </Box>
          <List dense>
            {clinicAppointments
              .filter((a) =>
                ["booked", "checked_in", "in_progress"].includes(a.status),
              )
              .sort((a, b) => a.tokenNumber - b.tokenNumber)
              .map((appt, index) => (
                <ListItem
                  key={appt.id}
                  sx={{
                    opacity: appt.id === appointment.id ? 1 : 0.7,
                    fontWeight: appt.id === appointment.id ? 600 : 400,
                    bgcolor:
                      appt.id === appointment.id
                        ? "action.hover"
                        : "transparent",
                    borderRadius: 1,
                    mx: -1,
                    px: 1,
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      variant="rounded"
                      sx={{
                        width: 36,
                        height: 36,
                        fontSize: "0.75rem",
                        bgcolor:
                          appt.status === "in_progress"
                            ? "success.main"
                            : appt.status === "checked_in"
                              ? "primary.main"
                              : "grey.400",
                      }}
                    >
                      {appt.tokenNumber}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`Token #${appt.tokenNumber}`}
                    secondary={
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          flexWrap: "wrap",
                          mt: 0.5,
                        }}
                      >
                        <Chip
                          label={formatTime(appt.scheduledStart)}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={appt.status.replace("_", " ")}
                          size="small"
                          color={
                            appt.status === "in_progress"
                              ? "success"
                              : appt.status === "checked_in"
                                ? "primary"
                                : "default"
                          }
                        />
                        {appt.id === appointment.id && (
                          <Chip
                            label="YOU"
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
          </List>
        </CardContent>
      </Card>

      {isCompleted && (
        <Alert
          severity={appointment.status === "completed" ? "success" : "warning"}
          sx={{ mb: 3 }}
        >
          This appointment has been {appointment.status.replace("_", " ")}.
        </Alert>
      )}

      <Card elevation={1}>
        <CardContent>
          <Typography variant="h6" component="h3" gutterBottom>
            What to Expect
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List dense>
            <ListItem disableGutters>
              <ListItemIcon>
                <CheckCircle color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText>
                <Typography variant="body2">
                  Arrive at the clinic 10 minutes before your scheduled time
                </Typography>
              </ListItemText>
            </ListItem>
            <ListItem disableGutters>
              <ListItemIcon>
                <CheckCircle color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText>
                <Typography variant="body2">
                  Check in at the reception desk to update your status
                </Typography>
              </ListItemText>
            </ListItem>
            <ListItem disableGutters>
              <ListItemIcon>
                <Notifications color="info" fontSize="small" />
              </ListItemIcon>
              <ListItemText>
                <Typography variant="body2">
                  You'll receive in-app notifications when your turn approaches
                </Typography>
              </ListItemText>
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}
