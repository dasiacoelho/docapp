import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Badge,
} from "@mui/material";
import {
  Person,
  Schedule,
  AccessTime,
  CheckCircle,
  PlayArrow,
  Visibility,
  MedicalInformation,
  Phone,
  Email,
  History,
  Close,
} from "@mui/icons-material";
import {
  doctorService,
  appointmentService,
  clinicService,
  toDate,
} from "../../../services/firestore";
import type { Doctor, Appointment, Clinic } from "../../../types";
import {
  formatDate,
  formatTime,
  isToday,
  isPast,
} from "../../shared/utils/dateUtils";
import { useAuth } from "../../../features/auth/hooks";
import { DatePicker } from "../../shared/components/DatePicker";
import {
  ClinicSelector,
  useClinicSelector,
} from "../../shared/components/ClinicSelector";
import {
  getQueueStats,
  sortAppointmentsForQueue,
  getNextPatient,
  getCurrentPatient,
} from "../../shared/utils/queueUtils";

export function DoctorQueuePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedClinicId, onClinicChange } = useClinicSelector();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadDoctor();
    loadClinics();
  }, []);

  useEffect(() => {
    if (doctor && selectedClinicId) {
      loadAppointments();
    }
  }, [doctor, selectedClinicId, selectedDate]);

  const loadDoctor = async () => {
    try {
      const doc = await doctorService.getByUserId(user?.uid || "");
      if (doc) {
        setDoctor(doc);
        if (doc.clinicIds.length > 0 && !selectedClinicId) {
          onClinicChange(doc.clinicIds[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load doctor profile:", err);
    }
  };

  const loadClinics = async () => {
    try {
      const data = await clinicService.getAll();
      setClinics(data);
    } catch (err) {
      console.error("Failed to load clinics:", err);
    }
  };

  const loadAppointments = async () => {
    if (!doctor || !selectedClinicId) return;
    setLoading(true);
    try {
      const dateStr = formatDate(selectedDate, "yyyy-MM-dd");
      const data = await appointmentService.getByDoctor(doctor.id, dateStr);
      setAppointments(data);
    } catch (err) {
      console.error("Failed to load appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (
    appointmentId: string,
    status: Appointment["status"],
  ) => {
    try {
      const updateData: any = { status };
      if (status === "checked_in") updateData.actualStart = new Date();
      if (status === "in_progress") updateData.actualStart = new Date();
      if (status === "completed") updateData.actualEnd = new Date();

      await appointmentService.update(appointmentId, updateData);
      setSelectedAppointment((prev) =>
        prev && prev.id === appointmentId ? { ...prev, ...updateData } : prev,
      );
      await loadAppointments();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const todayAppointments = appointments.filter((a) =>
    isToday(a.scheduledStart),
  );
  const queueStats = getQueueStats(todayAppointments);
  const nextPatient = getNextPatient(todayAppointments);
  const currentPatient = getCurrentPatient(todayAppointments);
  const sortedAppointments = sortAppointmentsForQueue(todayAppointments);
  const historyAppointments = [...appointments]
    .filter((a) => ["completed", "cancelled", "no_show"].includes(a.status))
    .sort(
      (a, b) =>
        (toDate(b.scheduledStart)?.getTime() ?? 0) -
        (toDate(a.scheduledStart)?.getTime() ?? 0),
    );

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

  if (!doctor) {
    return <Alert severity="error">Doctor profile not found</Alert>;
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Patient Queue
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {doctor.name.startsWith("Dr.") ? doctor.name : `Dr. ${doctor.name}`}{" "}
            • {clinics.find((c) => c.id === selectedClinicId)?.name}
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <ClinicSelector
            value={selectedClinicId || ""}
            onChange={onClinicChange}
          />
          <DatePicker value={selectedDate} onChange={setSelectedDate} />
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card elevation={2}>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}
              >
                <Badge badgeContent={queueStats.total} color="primary" max={99}>
                  <Person fontSize="large" color="primary" />
                </Badge>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Patients
                  </Typography>
                  <Typography variant="h5" component="h3">
                    {queueStats.total}
                  </Typography>
                </Box>
              </Box>
              <Divider variant="inset" />
              <Box sx={{ display: "flex", gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Waiting
                  </Typography>
                  <Typography variant="h6" color="warning.main">
                    {queueStats.waiting}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    In Progress
                  </Typography>
                  <Typography variant="h6" color="primary.main">
                    {queueStats.inProgress}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Done
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {queueStats.completed}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card
            elevation={2}
            sx={{
              borderLeft: currentPatient
                ? "4px solid #1976d2"
                : "4px solid #4caf50",
            }}
          >
            <CardContent>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Current Patient
              </Typography>
              {currentPatient ? (
                <Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    Token #{currentPatient.tokenNumber}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatTime(currentPatient.scheduledStart)}
                  </Typography>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle />}
                    onClick={() =>
                      handleStatusChange(currentPatient.id, "completed")
                    }
                  >
                    Complete
                  </Button>
                </Box>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  No active consultation
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card
            elevation={2}
            sx={{ borderLeft: nextPatient ? "4px solid #ff9800" : "none" }}
          >
            <CardContent>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Next in Queue
              </Typography>
              {nextPatient && nextPatient.id !== currentPatient?.id ? (
                <Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    Token #{nextPatient.tokenNumber}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Scheduled: {formatTime(nextPatient.scheduledStart)}
                  </Typography>
                  {nextPatient.status === "booked" && (
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      startIcon={<CheckCircle />}
                      onClick={() =>
                        handleStatusChange(nextPatient.id, "checked_in")
                      }
                    >
                      Check In
                    </Button>
                  )}
                </Box>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  Queue empty
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card elevation={1}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<History />}
                  onClick={() => setShowHistory(true)}
                >
                  View History
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Schedule />}
                  onClick={() => navigate("/doctor/schedule")}
                >
                  Manage Slots
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card elevation={1}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Token</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Scheduled</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedAppointments.map((appt) => (
                <TableRow
                  key={appt.id}
                  hover
                  selected={selectedAppointment?.id === appt.id}
                  onClick={() => {
                    setSelectedAppointment(appt);
                    setShowDetails(true);
                  }}
                  sx={{
                    fontWeight: appt.id === currentPatient?.id ? 600 : 400,
                    bgcolor:
                      appt.id === currentPatient?.id
                        ? "action.hover"
                        : "transparent",
                  }}
                >
                  <TableCell>
                    <Badge
                      badgeContent={appt.tokenNumber}
                      color="primary"
                      variant="dot"
                      max={999}
                    >
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 500, fontFamily: "monospace" }}
                      >
                        #{appt.tokenNumber}
                      </Typography>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: "primary.light",
                          color: "primary.contrastText",
                        }}
                      >
                        <Person fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          Patient {appt.patientId.slice(-6)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {appt.patientId}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatTime(appt.scheduledStart)}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatTime(appt.scheduledEnd)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={appt.appointmentType}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={appt.status.replace("_", " ")}
                      size="small"
                      color={
                        appt.status === "in_progress"
                          ? "success"
                          : appt.status === "checked_in"
                            ? "primary"
                            : appt.status === "booked"
                              ? "warning"
                              : "default"
                      }
                      variant={
                        ["completed", "cancelled", "no_show"].includes(
                          appt.status,
                        )
                          ? "filled"
                          : "outlined"
                      }
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAppointment(appt);
                          setShowDetails(true);
                        }}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    {appt.status === "booked" && (
                      <Tooltip title="Check In Patient">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(appt.id, "checked_in");
                          }}
                        >
                          <CheckCircle />
                        </IconButton>
                      </Tooltip>
                    )}
                    {appt.status === "checked_in" && (
                      <Tooltip title="Start Consultation">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(appt.id, "in_progress");
                          }}
                        >
                          <PlayArrow />
                        </IconButton>
                      </Tooltip>
                    )}
                    {appt.status === "in_progress" && (
                      <Tooltip title="Complete Consultation">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(appt.id, "completed");
                          }}
                        >
                          <CheckCircle />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {todayAppointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No appointments scheduled for today
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog
        open={showDetails}
        onClose={() => {
          setShowDetails(false);
          setSelectedAppointment(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <Typography>Patient Details</Typography>
            <IconButton
              onClick={() => {
                setShowDetails(false);
                setSelectedAppointment(null);
              }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        {selectedAppointment && (
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Token Number
                </Typography>
                <Typography variant="h6" component="h3">
                  #{selectedAppointment.tokenNumber}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={selectedAppointment.status.replace("_", " ")}
                  color={
                    selectedAppointment.status === "in_progress"
                      ? "success"
                      : selectedAppointment.status === "checked_in"
                        ? "primary"
                        : selectedAppointment.status === "booked"
                          ? "warning"
                          : "default"
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Scheduled Time
                </Typography>
                <Typography variant="body1">
                  {formatTime(selectedAppointment.scheduledStart)} -{" "}
                  {formatTime(selectedAppointment.scheduledEnd)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Appointment Type
                </Typography>
                <Typography variant="body1">
                  {selectedAppointment.appointmentType}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" color="text.secondary">
                  Patient ID
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: "monospace" }}>
                  {selectedAppointment.patientId}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" color="text.secondary">
                  Doctor
                </Typography>
                <Typography variant="body1">
                  {doctor.name.startsWith("Dr.")
                    ? doctor.name
                    : `Dr. ${doctor.name}`}{" "}
                  ({doctor.specialization})
                </Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" color="text.secondary">
                  Clinic
                </Typography>
                <Typography variant="body1">
                  {clinics.find((c) => c.id === selectedClinicId)?.name}
                </Typography>
              </Grid>
              {selectedAppointment.notes && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" color="text.secondary">
                    Notes
                  </Typography>
                  <Typography variant="body1">
                    {selectedAppointment.notes}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </DialogContent>
        )}
        <DialogActions>
          <Button
            onClick={() => {
              setShowDetails(false);
              setSelectedAppointment(null);
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showHistory}
        onClose={() => setShowHistory(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Consultation History</DialogTitle>
        <DialogContent dividers>
          {historyAppointments.length === 0 ? (
            <Typography variant="body1" color="text.secondary" sx={{ py: 2 }}>
              No completed consultations for this date.
            </Typography>
          ) : (
            <List>
              {historyAppointments.map((appt) => (
                <ListItem key={appt.id} divider>
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: "success.light",
                        color: "success.contrastText",
                      }}
                    >
                      <CheckCircle fontSize="small" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`Token #${appt.tokenNumber} • ${appt.appointmentType}`}
                    secondary={`${formatTime(appt.scheduledStart)} - ${formatTime(appt.scheduledEnd)} • ${appt.status.replace("_", " ")}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHistory(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
