import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Skeleton,
} from "@mui/material";
import {
  ArrowBack,
  Person,
  Schedule,
  AccessTime,
  CheckCircle,
  Error as ErrorIcon,
  Info,
} from "@mui/icons-material";
import {
  appointmentService,
  slotService,
  doctorService,
  clinicService,
  firestoreService,
} from "../../../services/firestore";
import type { Slot, Doctor, Clinic, Appointment } from "../../../types";
import { formatDate, formatTime } from "../../shared/utils/dateUtils";
import { addDays } from "date-fns";
import { useAuth } from "../../../features/auth/hooks";
import { DatePicker } from "../../shared/components/DatePicker";
import { notificationManager } from "../../../services/notifications";

const steps = ["Select Date", "Choose Slot", "Confirm Booking"];

export function BookingPage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(false);
  const [doctorLoading, setDoctorLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Check for pre-selected slot from BookingPickerPage
  const state = location.state as {
    preSelectedSlot?: Slot;
    preSelectedDate?: Date;
    preSelectedClinic?: string;
  } | null;

  useEffect(() => {
    if (doctorId) {
      loadDoctor();
    }
  }, [doctorId]);

  useEffect(() => {
    if (doctorId && selectedDate) {
      loadSlots();
    }
  }, [doctorId, selectedDate]);

  // Handle pre-selected slot from state
  useEffect(() => {
    if (state?.preSelectedSlot && state?.preSelectedDate) {
      setSelectedDate(state.preSelectedDate);
      setSelectedSlot(state.preSelectedSlot);
      setActiveStep(2); // Skip to confirmation step
    }
  }, [state]);

  const loadDoctor = async () => {
    try {
      setDoctorLoading(true);
      const doc = await doctorService.getById(doctorId!);
      if (doc) {
        setDoctor(doc);
        const cl = await clinicService.getById(doc.clinicIds[0]);
        setClinic(cl);
      } else {
        setError("Doctor not found");
      }
    } catch (err) {
      setError("Failed to load doctor details");
    } finally {
      setDoctorLoading(false);
    }
  };

  const loadSlots = async () => {
    if (!doctorId) return;
    setLoading(true);
    setError(null);
    try {
      const dateStr = formatDate(selectedDate, "yyyy-MM-dd");
      const data = await slotService.getByDoctorAndDate(doctorId, dateStr);
      setSlots(data);
      if (
        selectedSlot &&
        !data.some(
          (slot) =>
            slot.id === selectedSlot.id && !slot.isBooked && !slot.isBlocked,
        )
      ) {
        setSelectedSlot(null);
      }
    } catch (err) {
      setError("Failed to load available slots");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    } else {
      navigate("/patient/booking");
    }
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleSlotSelect = (slot: Slot) => {
    setSelectedSlot(slot);
    setActiveStep(2);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot || !user) return;

    setConfirmLoading(true);
    setError(null);

    try {
      const patient = await firestoreService.patientService.getByUserId(
        user.uid,
      );
      if (!patient) throw new Error("Patient profile not found");

      const result = await appointmentService.bookWithTransaction(
        selectedSlot.id,
        {
          patientId: patient.id,
          doctorId: selectedSlot.doctorId,
          clinicId: selectedSlot.clinicId,
          appointmentType: "consultation",
          scheduledStart: selectedSlot.startTime,
          scheduledEnd: selectedSlot.endTime,
          status: "booked",
        },
      );

      await notificationManager.success(
        "Appointment Booked!",
        `Your appointment is confirmed. Token: #${result.tokenNumber}`,
      );

      navigate(`/patient/queue/${result.appointmentId}`);
    } catch (err: any) {
      // The slot may have been taken in the meantime; refresh the grid so the
      // now-unavailable time drops out of the list.
      await loadSlots();
      setError(err.message || "Booking failed. Please try again.");
      notificationManager.error(
        "Booking Failed",
        err.message || "Please try again",
      );
    } finally {
      setConfirmLoading(false);
    }
  };

  if (doctorLoading) {
    return (
      <Box
        sx={{
          maxWidth: 800,
          mx: "auto",
          display: "flex",
          justifyContent: "center",
          py: 8,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!doctor) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Button variant="text" startIcon={<ArrowBack />} onClick={handleBack}>
            Back to Dashboard
          </Button>
        </Box>
        <Card elevation={1}>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <Alert severity={error ? "error" : "info"}>
              {error || "Doctor not found"}
            </Alert>
            <Button
              variant="text"
              startIcon={<ArrowBack />}
              onClick={handleBack}
              sx={{ mt: 2 }}
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button variant="text" startIcon={<ArrowBack />} onClick={handleBack}>
          Back to Dashboard
        </Button>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Book Appointment
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {doctor.name.startsWith("Dr.") ? doctor.name : `Dr. ${doctor.name}`}{" "}
            • {doctor.specialization}
          </Typography>
        </Box>
      </Box>

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        <StepConnector />
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel
              StepIconProps={{
                sx: {
                  "&.Mui-active": { color: "primary.main" },
                  "&.Mui-completed": { color: "success.main" },
                },
              }}
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      {activeStep === 0 && (
        <Card elevation={1}>
          <CardContent>
            <Typography variant="h6" component="h3" gutterBottom>
              Select Date
            </Typography>
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              minDate={new Date()}
              maxDate={addDays(new Date(), 30)}
              label="Appointment Date"
            />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  "Next"
                )}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {activeStep === 1 && (
        <Card elevation={1}>
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
                Appointment Slots for {formatDate(selectedDate)}
              </Typography>
              <Chip
                label={`${slots.filter((slot) => !slot.isBooked && !slot.isBlocked).length} available`}
                icon={<Schedule />}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : slots.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Info fontSize="small" sx={{ mr: 1 }} />
                No slots have been created for this date. Please select another date.
              </Alert>
            ) : (
              <List dense>
                {slots.map((slot) => {
                  const isSelected = selectedSlot?.id === slot.id;
                  const unavailable = slot.isBooked || slot.isBlocked;
                  return (
                    <ListItem key={slot.id} disablePadding sx={{ mb: 1 }}>
                      <ListItemButton
                        selected={isSelected}
                        disabled={unavailable}
                        onClick={() => handleSlotSelect(slot)}
                        sx={{
                          borderRadius: "12px",
                          border: unavailable
                            ? "1px solid #d1d5db"
                            : isSelected
                            ? "2px solid #0284c7"
                            : "1px solid #e2e8f0",
                          bgcolor: unavailable
                            ? "#e5e7eb"
                            : isSelected
                            ? "rgba(2, 132, 199, 0.06)"
                            : "#ffffff",
                          color: unavailable ? "text.disabled" : "text.primary",
                          py: 1.5,
                          "&.Mui-disabled": {
                            bgcolor: "#e5e7eb",
                            color: "text.disabled",
                            opacity: 0.8,
                          },
                        }}
                      >
                        <ListItemIcon>
                          <AccessTime
                            sx={{ color: unavailable ? "text.disabled" : "primary.main" }}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography
                              variant="subtitle1"
                              fontWeight={700}
                              color={unavailable ? "text.disabled" : "text.primary"}
                            >
                              {formatTime(slot.startTime)} -{" "}
                              {formatTime(slot.endTime)}
                            </Typography>
                          }
                          secondary={
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                flexWrap: "wrap",
                                mt: 0.5,
                              }}
                            >
                              {unavailable ? (
                                <Chip
                                  label={slot.isBlocked ? "Unavailable" : "Booked"}
                                  size="small"
                                  sx={{ bgcolor: "#d1d5db", color: "#4b5563" }}
                                />
                              ) : (
                                <>
                                  <Chip
                                    label={`${slot.durationMinutes} min consultation`}
                                    size="small"
                                    variant="outlined"
                                  />
                                  <Chip
                                    label={`Estimated Token #${getEstimatedToken(clinic, selectedDate)}`}
                                    size="small"
                                    color="primary"
                                  />
                                </>
                              )}
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            )}

            <Box
              sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}
            >
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={handleBack}
              >
                Back
              </Button>
              <Button variant="text" onClick={() => setActiveStep(0)}>
                Change Date
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {activeStep === 2 && selectedSlot && (
        <Card elevation={1}>
          <CardContent>
            <Typography variant="h6" component="h3" gutterBottom>
              Confirm Booking
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2} mb={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Doctor
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {doctor.name.startsWith("Dr.")
                    ? doctor.name
                    : `Dr. ${doctor.name}`}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Specialization
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={600}
                  color="primary.main"
                >
                  {doctor.specialization}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Appointment Date
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {formatDate(selectedDate)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Consultation Window
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {formatTime(selectedSlot.startTime)} -{" "}
                  {formatTime(selectedSlot.endTime)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Duration
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedSlot.durationMinutes} minutes
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Location
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {clinic?.name}
                </Typography>
              </Grid>
            </Grid>
            <Divider sx={{ mb: 2 }} />
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={() => setActiveStep(1)}
              >
                Back
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={handleConfirmBooking}
                disabled={confirmLoading}
                startIcon={
                  confirmLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <CheckCircle />
                  )
                }
              >
                {confirmLoading ? "Confirming..." : "Confirm & Book"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

function getEstimatedToken(clinic: Clinic | null, date: Date): number {
  return Math.floor(Math.random() * 20) + 1;
}
