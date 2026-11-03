import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Chip,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Block,
  Visibility,
  Schedule,
  AccessTime,
  Save,
  Close,
} from "@mui/icons-material";
import {
  doctorService,
  slotService,
  clinicService,
  toDate,
} from "../../../services/firestore";
import type { Doctor, Slot, Clinic, WorkingHours } from "../../../types";
import {
  formatDate,
  formatTime,
  parseTimeString,
  addMinutesToDate,
} from "../../shared/utils/dateUtils";
import { useAuth } from "../../../features/auth/hooks";
import { DatePicker } from "../../shared/components/DatePicker";
import {
  ClinicSelector,
  useClinicSelector,
} from "../../shared/components/ClinicSelector";

export function SchedulePage() {
  const { user } = useAuth();
  const { selectedClinicId, onClinicChange } = useClinicSelector();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [slotFilter, setSlotFilter] = useState<
    "all" | "available" | "booked" | "blocked"
  >("all");
  const [generateForm, setGenerateForm] = useState({
    startTime: "09:00",
    endTime: "17:00",
    slotDuration: 15,
    date: formatDate(selectedDate, "yyyy-MM-dd"),
  });

  useEffect(() => {
    loadDoctor();
    loadClinics();
  }, []);

  useEffect(() => {
    if (doctor && selectedClinicId) {
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

  const loadSlots = async () => {
    if (!doctor || !selectedClinicId) return;
    setLoading(true);
    try {
      const dateStr = formatDate(selectedDate, "yyyy-MM-dd");
      const data = await slotService.getByDoctorAndDate(doctor.id, dateStr);
      setSlots(
        [...data].sort((a, b) => {
          const startA = toDate(a.startTime)?.getTime() ?? 0;
          const startB = toDate(b.startTime)?.getTime() ?? 0;
          return startA - startB;
        }),
      );
    } catch (err) {
      setError("Failed to load slots");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSlots = async () => {
    if (!doctor || !selectedClinicId) return;
    setSaving(true);
    try {
      const dateStr = generateForm.date;
      await slotService.generateSlotsForDoctor(
        doctor.id,
        selectedClinicId,
        dateStr,
        {
          start: generateForm.startTime,
          end: generateForm.endTime,
          slotDuration: generateForm.slotDuration,
        },
      );
      await loadSlots();
      setShowGenerateDialog(false);
    } catch (err: any) {
      setError(err.message || "Failed to generate slots");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBlock = async (slot: Slot) => {
    try {
      await slotService.blockSlot(slot.id, !slot.isBlocked);
      await loadSlots();
    } catch (err) {
      setError("Failed to update slot");
    }
  };

  const handleDeleteSlot = async (slot: Slot) => {
    if (slot.isBooked) {
      setError("Cannot delete booked slot");
      return;
    }
    try {
      await slotService.delete(slot.id);
      await loadSlots();
    } catch (err) {
      setError("Failed to delete slot");
    }
  };

  const handleAddSingleSlot = async () => {
    if (!doctor || !selectedClinicId) return;
    const start = createDateWithTime(selectedDate, generateForm.startTime);
    const end = addMinutesToDate(start, generateForm.slotDuration);

    try {
      await slotService.create({
        doctorId: doctor.id,
        clinicId: selectedClinicId,
        date: formatDate(selectedDate, "yyyy-MM-dd"),
        startTime: start,
        endTime: end,
        durationMinutes: generateForm.slotDuration,
        isBooked: false,
        isBlocked: false,
      });
      await loadSlots();
    } catch (err) {
      setError("Failed to add slot");
    }
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
    return <Alert severity="error">Doctor profile not found</Alert>;
  }

  const availableSlots = slots.filter((s) => !s.isBooked && !s.isBlocked);
  const bookedSlots = slots.filter((s) => s.isBooked);
  const blockedSlots = slots.filter((s) => s.isBlocked);
  const filteredSlots =
    slotFilter === "available"
      ? availableSlots
      : slotFilter === "booked"
        ? bookedSlots
        : slotFilter === "blocked"
          ? blockedSlots
          : slots;

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
            Schedule Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {doctor.name.startsWith("Dr.") ? doctor.name : `Dr. ${doctor.name}`}{" "}
            • Manage your availability
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
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowGenerateDialog(true)}
          >
            Generate Slots
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={1}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Available
              </Typography>
              <Typography variant="h4" component="h3" color="success.main">
                {availableSlots.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={1}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Booked
              </Typography>
              <Typography variant="h4" component="h3" color="primary.main">
                {bookedSlots.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={1}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Blocked
              </Typography>
              <Typography variant="h4" component="h3" color="warning.main">
                {blockedSlots.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Tabs
        value={slotFilter}
        onChange={(_, value) => setSlotFilter(value as typeof slotFilter)}
        sx={{ mb: 2 }}
      >
        <Tab label="All Slots" value="all" />
        <Tab label="Available" value="available" />
        <Tab label="Booked" value="booked" />
        <Tab label="Blocked" value="blocked" />
      </Tabs>

      <Card elevation={1}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSlots.map((slot) => (
                <TableRow key={slot.id} hover>
                  <TableCell>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </Typography>
                  </TableCell>
                  <TableCell>{slot.durationMinutes} min</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      {slot.isBooked && (
                        <Chip
                          label="Booked"
                          size="small"
                          color="primary"
                          variant="filled"
                        />
                      )}
                      {slot.isBlocked && !slot.isBooked && (
                        <Chip
                          label="Blocked"
                          size="small"
                          color="warning"
                          variant="filled"
                        />
                      )}
                      {!slot.isBooked && !slot.isBlocked && (
                        <Chip
                          label="Available"
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={slot.isBlocked ? "Unblock" : "Block"}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleBlock(slot)}
                        color={slot.isBlocked ? "default" : "warning"}
                      >
                        {slot.isBlocked ? <Visibility /> : <Block />}
                      </IconButton>
                    </Tooltip>
                    {!slot.isBooked && (
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteSlot(slot)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredSlots.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      {slots.length === 0
                        ? 'No slots for this date. Click "Generate Slots" to create availability.'
                        : "No slots match this filter."}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog
        open={showGenerateDialog}
        onClose={() => setShowGenerateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Generate Time Slots</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={generateForm.date}
                onChange={(e) =>
                  setGenerateForm({ ...generateForm, date: e.target.value })
                }
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                type="time"
                label="Start Time"
                value={generateForm.startTime}
                onChange={(e) =>
                  setGenerateForm({
                    ...generateForm,
                    startTime: e.target.value,
                  })
                }
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                type="time"
                label="End Time"
                value={generateForm.endTime}
                onChange={(e) =>
                  setGenerateForm({ ...generateForm, endTime: e.target.value })
                }
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Slot Duration</InputLabel>
                <Select
                  value={generateForm.slotDuration}
                  label="Slot Duration"
                  onChange={(e) =>
                    setGenerateForm({
                      ...generateForm,
                      slotDuration: Number(e.target.value),
                    })
                  }
                >
                  <MenuItem value={10}>10 minutes</MenuItem>
                  <MenuItem value={15}>15 minutes</MenuItem>
                  <MenuItem value={20}>20 minutes</MenuItem>
                  <MenuItem value={30}>30 minutes</MenuItem>
                  <MenuItem value={45}>45 minutes</MenuItem>
                  <MenuItem value={60}>60 minutes</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      generateForm.date ===
                      formatDate(selectedDate, "yyyy-MM-dd")
                    }
                    onChange={(e) =>
                      setGenerateForm({
                        ...generateForm,
                        date: e.target.checked
                          ? formatDate(selectedDate, "yyyy-MM-dd")
                          : generateForm.date,
                      })
                    }
                  />
                }
                label="Apply to selected date in picker"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGenerateDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleGenerateSlots}
            disabled={saving}
            startIcon={
              saving ? <CircularProgress size={20} color="inherit" /> : <Save />
            }
          >
            {saving ? "Generating..." : "Generate Slots"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function createDateWithTime(date: Date, timeStr: string): Date {
  const d = new Date(date);
  const { hours, minutes } = parseTimeString(timeStr);
  d.setHours(hours, minutes, 0, 0);
  return d;
}
