import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";
import {
  ArrowForward,
  LocalHospitalRounded,
  WorkHistoryRounded,
} from "@mui/icons-material";
import { doctorService, clinicService } from "../../../services/firestore";
import type { Doctor, Clinic } from "../../../types";

/**
 * Entry point for the "Book Appointment" navigation item. The booking flow
 * itself needs a doctor, so this route lets the patient pick one instead of
 * dead-ending on a route that requires a :doctorId param.
 */
export function BookingPickerPage() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [doctorList, clinicList] = await Promise.all([
          doctorService.getAll(),
          clinicService.getAll(),
        ]);
        if (cancelled) return;
        setDoctors(doctorList.filter((doctor) => doctor.status === "active"));
        setClinics(clinicList);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load doctors");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const clinicName = (clinicId: string) =>
    clinics.find((clinic) => clinic.id === clinicId)?.name;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Book an Appointment
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Choose a doctor to see their available time slots.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {doctors.length === 0 && !error && (
        <Alert severity="info">
          No doctors are available for booking right now.
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 2,
        }}
      >
        {doctors.map((doctor) => {
          const primaryClinic = clinicName(doctor.clinicIds[0]);
          return (
            <Card
              key={doctor.id}
              elevation={1}
              sx={{ display: "flex", flexDirection: "column" }}
            >
              <CardContent sx={{ flex: 1 }}>
                <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                  <Avatar
                    src={doctor.photoUrl}
                    sx={{ width: 56, height: 56, bgcolor: "primary.main" }}
                  >
                    {doctor.name.replace(/^Dr\.\s*/, "")[0]}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 700 }}
                      noWrap
                    >
                      {doctor.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="primary.main"
                      sx={{ fontWeight: 600 }}
                    >
                      {doctor.specialization}
                    </Typography>
                    {doctor.qualification && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block" }}
                      >
                        {doctor.qualification}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  {typeof doctor.experienceYears === "number" && (
                    <Chip
                      size="small"
                      variant="outlined"
                      icon={<WorkHistoryRounded />}
                      label={`${doctor.experienceYears} yrs`}
                    />
                  )}
                  {primaryClinic && (
                    <Chip
                      size="small"
                      variant="outlined"
                      icon={<LocalHospitalRounded />}
                      label={primaryClinic}
                      sx={{ maxWidth: "100%" }}
                    />
                  )}
                </Box>
              </CardContent>

              <Box sx={{ px: 2, pb: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate(`/patient/booking/${doctor.id}`)}
                >
                  View Availability
                </Button>
              </Box>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}
