import React, { useState, useEffect } from "react";
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
  Tabs,
  Tab,
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
} from "@mui/material";
import {
  LocalHospital,
  Person,
  Schedule,
  AccessTime,
  CheckCircle,
  PlayArrow,
  ArrowForward,
  Edit,
  Visibility,
  Add,
  Close,
} from "@mui/icons-material";
import {
  doctorService,
  appointmentService,
  slotService,
  clinicService,
  firestoreService,
} from "../../../services/firestore";
import type { Doctor, Appointment, Slot, Clinic } from "../../../types";
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
} from "../../shared/utils/queueUtils";

export function DoctorDashboard() {
  const { user } = useAuth();
  const { selectedClinicId, onClinicChange } = useClinicSelector();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"queue" | "all" | "slots">(
    "queue",
  );
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  useEffect(() => {
    loadDoctor();
    loadClinics();
  }, []);

  useEffect(() => {
    if (doctor && selectedClinicId) {
      loadAppointments();
      loadSlots();
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
      setError("Failed to load doctor profile");
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
    try {
      const dateStr = formatDate(selectedDate, "yyyy-MM-dd");
      const data = await appointmentService.getByDoctor(doctor.id, dateStr);
      setAppointments(data);
    } catch (err) {
      console.error("Failed to load appointments:", err);
    }
  };

  const loadSlots = async () => {
    if (!doctor || !selectedClinicId) return;
    try {
      const dateStr = formatDate(selectedDate, "yyyy-MM-dd");
      const data = await slotService.getByDoctorAndDate(doctor.id, dateStr);
      setSlots(data);
    } catch (err) {
      console.error("Failed to load slots:", err);
    } finally {
      setLoading(false);
    }
  };

  const todayAppointments = appointments.filter((a) =>
    isToday(a.scheduledStart),
  );
  const upcomingAppointments = appointments.filter(
    (a) =>
      !isPast(a.scheduledStart) &&
      !["completed", "cancelled", "no_show"].includes(a.status),
  );
  const queueStats = getQueueStats(todayAppointments);
  const visibleAppointments =
    activeTab === "queue"
      ? sortAppointmentsForQueue(todayAppointments)
      : sortAppointmentsForQueue(appointments);

  const handleStatusChange = async (
    appointmentId: string,
    status: Appointment["status"],
  ) => {
    const patch: Partial<Appointment> = { status };
    if (status === "checked_in" || status === "in_progress")
      patch.actualStart = new Date();
    if (status === "completed") patch.actualEnd = new Date();

    await appointmentService.update(appointmentId, patch);
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, ...patch } : a)),
    );
    setSelectedAppointment((prev) =>
      prev && prev.id === appointmentId ? { ...prev, ...patch } : prev,
    );
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

  if (!doctor) {
    return (
      <Alert severity="error">
        Doctor profile not found. Please contact admin.
      </Alert>
    );
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
            {doctor.name.startsWith("Dr.") ? doctor.name : `Dr. ${doctor.name}`}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {doctor.specialization} • {doctor.status}
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
            disabled={clinics.length <= 1}
          />
          <DatePicker value={selectedDate} onChange={setSelectedDate} />
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2}>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "primary.light",
                    borderRadius: 2,
                    color: "primary.contrastText",
                  }}
                >
                  <Schedule fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    Today's Appointments
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(selectedDate)}
                  </Typography>
                </Box>
              </Box>
              <Divider />
              <Typography variant="h3" component="h2" gutterBottom>
                {todayAppointments.length}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {queueStats.waiting} waiting • {queueStats.inProgress} in
                progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2}>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "success.light",
                    borderRadius: 2,
                    color: "success.contrastText",
                  }}
                >
                  <LocalHospital fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    Clinic
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {clinics.find((c) => c.id === selectedClinicId)?.name ||
                      "Select clinic"}
                  </Typography>
                </Box>
              </Box>
              <Divider />
              <Typography variant="h3" component="h2" gutterBottom>
                {slots.filter((s) => !s.isBooked && !s.isBlocked).length}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Available slots today
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2}>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "warning.light",
                    borderRadius: 2,
                    color: "warning.contrastText",
                  }}
                >
                  <AccessTime fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    Working Hours
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getWorkingHoursForClinic(
                      doctor,
                      selectedClinicId,
                      selectedDate,
                    )}
                  </Typography>
                </Box>
              </Box>
              <Divider />
              <Typography variant="h3" component="h2" gutterBottom>
                {slots.filter((s) => s.isBlocked).length}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Blocked slots
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab(value as typeof activeTab)}
        sx={{ mb: 3 }}
      >
        <Tab label="Today's Queue" value="queue" />
        <Tab label="All Appointments" value="all" />
        <Tab label="Slots" value="slots" />
      </Tabs>

      <Card elevation={1}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {activeTab === "slots" ? (
                  <>
                    <TableCell>Time</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Appointment</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>Time</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Token</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {activeTab === "slots" &&
                slots.map((slot) => (
                  <TableRow key={slot.id} hover>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatTime(slot.startTime)}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {formatTime(slot.endTime)}
                      </Typography>
                    </TableCell>
                    <TableCell>{slot.durationMinutes} min</TableCell>
                    <TableCell>
                      <Chip
                        label={
                          slot.isBooked
                            ? "Booked"
                            : slot.isBlocked
                              ? "Blocked"
                              : "Available"
                        }
                        size="small"
                        color={
                          slot.isBooked
                            ? "primary"
                            : slot.isBlocked
                              ? "default"
                              : "success"
                        }
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {slot.appointmentId || "—"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              {activeTab !== "slots" &&
                visibleAppointments.map((appt) => (
                  <TableRow key={appt.id} hover>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatTime(appt.scheduledStart)}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {formatTime(appt.scheduledEnd)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
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
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 500, fontFamily: "monospace" }}
                      >
                        #{appt.tokenNumber}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => setSelectedAppointment(appt)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      {appt.status === "booked" && (
                        <Tooltip title="Check In">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() =>
                              handleStatusChange(appt.id, "checked_in")
                            }
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
                            onClick={() =>
                              handleStatusChange(appt.id, "in_progress")
                            }
                          >
                            <PlayArrow />
                          </IconButton>
                        </Tooltip>
                      )}
                      {appt.status === "in_progress" && (
                        <Tooltip title="Complete">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() =>
                              handleStatusChange(appt.id, "completed")
                            }
                          >
                            <CheckCircle />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              {activeTab !== "slots" && visibleAppointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      {activeTab === "queue"
                        ? "No appointments for today"
                        : "No appointments for this date"}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {activeTab === "slots" && slots.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No slots for this date
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog
        open={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedAppointment && (
          <>
            <DialogTitle
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              Appointment #{selectedAppointment.tokenNumber}
              <IconButton
                onClick={() => setSelectedAppointment(null)}
                aria-label="Close"
              >
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Patient ID
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedAppointment.patientId}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={selectedAppointment.status.replace("_", " ")}
                    size="small"
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
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Date
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatDate(selectedAppointment.scheduledStart)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Time
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatTime(selectedAppointment.scheduledStart)} -{" "}
                    {formatTime(selectedAppointment.scheduledEnd)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Type
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedAppointment.appointmentType}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Doctor
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {doctor.name.startsWith("Dr.")
                      ? doctor.name
                      : `Dr. ${doctor.name}`}
                  </Typography>
                </Box>
                {selectedAppointment.notes && (
                  <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                    <Typography variant="body2" color="text.secondary">
                      Notes
                    </Typography>
                    <Typography variant="body1">
                      {selectedAppointment.notes}
                    </Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              {selectedAppointment.status === "booked" && (
                <Button
                  startIcon={<CheckCircle />}
                  onClick={() =>
                    handleStatusChange(selectedAppointment.id, "checked_in")
                  }
                >
                  Check In
                </Button>
              )}
              {selectedAppointment.status === "checked_in" && (
                <Button
                  startIcon={<PlayArrow />}
                  onClick={() =>
                    handleStatusChange(selectedAppointment.id, "in_progress")
                  }
                >
                  Start Consultation
                </Button>
              )}
              {selectedAppointment.status === "in_progress" && (
                <Button
                  startIcon={<CheckCircle />}
                  color="success"
                  onClick={() =>
                    handleStatusChange(selectedAppointment.id, "completed")
                  }
                >
                  Complete
                </Button>
              )}
              <Button onClick={() => setSelectedAppointment(null)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

function getWorkingHoursForClinic(
  doctor: Doctor,
  clinicId: string,
  date: Date,
): string {
  const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  // Older Firestore doctor records may not have a workingHours map yet.
  const hours = doctor.workingHours?.[dayKeys[date.getDay()]];
  if (!hours) return "Not scheduled";
  return `${hours.start} - ${hours.end}`;
}
