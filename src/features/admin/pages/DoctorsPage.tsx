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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Avatar,
  Tabs,
  Tab,
} from '@mui/material';
import { People, Add, Edit, Delete, Visibility, MedicalInformation, Schedule, Save, Close, PersonAdd, ToggleOn, ToggleOff } from '@mui/icons-material';
import { doctorService, clinicService, firestoreService } from '../../../services/firestore';
import type { Doctor, Clinic } from '../../../types';
import { useAuth } from '../../../features/auth/hooks';

export function DoctorsPage() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [formData, setFormData] = useState<Partial<Doctor>>({
    name: '',
    email: '',
    specialization: '',
    clinicIds: [],
    phone: '',
    qualification: '',
    experienceYears: 0,
    status: 'active',
    availability: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [doctorsData, clinicsData] = await Promise.all([
        doctorService.getAll(),
        clinicService.getAll(),
      ]);
      setDoctors(doctorsData);
      setClinics(clinicsData);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (doctor?: Doctor) => {
    if (doctor) {
      setEditingDoctor(doctor);
      setFormData({
        name: doctor.name,
        email: doctor.email,
        specialization: doctor.specialization,
        clinicIds: doctor.clinicIds,
        phone: doctor.phone,
        qualification: doctor.qualification,
        experienceYears: doctor.experienceYears,
        status: doctor.status,
        availability: doctor.availability,
      });
    } else {
      setEditingDoctor(null);
      setFormData({
        name: '',
        email: '',
        specialization: '',
        clinicIds: [],
        phone: '',
        qualification: '',
        experienceYears: 0,
        status: 'active',
        availability: [],
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingDoctor(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
const data = {
      ...formData,
      clinicIds: (formData.clinicIds || []).filter((id): id is string => Boolean(id)),
      availability: formData.availability || [],
    };
    
    if (editingDoctor) {
      await doctorService.update(editingDoctor.id, data);
    } else {
      await doctorService.create(data as any);
    }
      await loadData();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.message || 'Failed to save doctor');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (doctor: Doctor) => {
    if (!window.confirm(`Delete doctor "${doctor.name}"? This action cannot be undone.`)) return;
    try {
      await doctorService.delete(doctor.id);
      await loadData();
    } catch (err) {
      setError('Failed to delete doctor');
    }
  };

  const handleToggleStatus = async (doctor: Doctor) => {
    try {
      await doctorService.update(doctor.id, { status: doctor.status === 'active' ? 'inactive' : 'active' });
      await loadData();
    } catch (err) {
      setError('Failed to update status');
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
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Doctor Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage doctor profiles, specializations, and clinic assignments
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAdd />} onClick={() => handleOpenDialog()}>
          Add Doctor
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

      <Card elevation={1}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Doctor</TableCell>
                <TableCell>Specialization</TableCell>
                <TableCell>Clinics</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Experience</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {doctors.map((doctor) => (
                <TableRow key={doctor.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                        <MedicalInformation fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>Dr. {doctor.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{doctor.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={doctor.specialization} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {doctor.clinicIds.map((cid) => (
                        <Chip key={cid} label={clinics.find(c => c.id === cid)?.name || cid} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>{doctor.phone || '-'}</TableCell>
                  <TableCell>{doctor.experienceYears} years</TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={doctor.status === 'active'}
                          onChange={() => handleToggleStatus(doctor)}
                          size="small"
                          color="success"
                        />
                      }
                      label={doctor.status === 'active' ? 'Active' : 'Inactive'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View">
                      <IconButton size="small" onClick={() => handleOpenDialog(doctor)}><Visibility /></IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpenDialog(doctor)}><Edit /></IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(doctor)}><Delete /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {doctors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">No doctors registered</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={showDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
        </DialogTitle>
        <DialogContent>
          <Tabs value={0} variant="scrollable" sx={{ mb: 2 }}>
            <Tab label="Basic Info" />
            <Tab label="Clinics" />
          </Tabs>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Specialization"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Qualification"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Years of Experience"
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="h6" component="h3" gutterBottom>
                Clinic Assignments
              </Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Assign to Clinics</InputLabel>
                <Select
                  multiple
                  value={formData.clinicIds || []}
                  label="Clinics"
                  onChange={(e) => setFormData({ ...formData, clinicIds: e.target.value as string[] })}
                  renderValue={(selected) => selected.map(s => clinics.find(c => c.id === s)?.name || s).join(', ')}
                >
                  {clinics.map((clinic) => (
                    <MenuItem key={clinic.id} value={clinic.id}>{clinic.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Hold Ctrl/Cmd to select multiple clinics. Doctors can only see appointments for assigned clinics.
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}>
            {saving ? 'Saving...' : editingDoctor ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}