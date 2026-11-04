import React, { useState, useEffect, useRef } from 'react';
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
  Stack,
  ImageList,
  ImageListItem,
} from '@mui/material';
import { People, Add, Edit, Delete, Visibility, MedicalInformation, Schedule, Save, Close, PersonAdd, ToggleOn, ToggleOff, PhotoCamera, Delete as DeleteIcon } from '@mui/icons-material';
import { doctorService, clinicService, firestoreService } from '../../../services/firestore';
import type { Doctor, Clinic } from '../../../types';
import { useAuth } from '../../../features/auth/hooks';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { app } from '../../../services/firebase';

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
    rating: 0,
    reviewCount: 0,
    defaultVisitDuration: 30,
    status: 'active',
    availability: [],
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        rating: doctor.rating,
        reviewCount: doctor.reviewCount,
        defaultVisitDuration: doctor.defaultVisitDuration,
        status: doctor.status,
        availability: doctor.availability,
      });
      setPhotoPreview(doctor.photoUrl || null);
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
        rating: 0,
        reviewCount: 0,
        defaultVisitDuration: 30,
        status: 'active',
        availability: [],
      });
      setPhotoPreview(null);
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingDoctor(null);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handlePhotoRemove = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadPhoto = async (doctorId: string): Promise<string | null> => {
    if (!photoFile) return editingDoctor?.photoUrl || null;
    
    setUploadingPhoto(true);
    try {
      const storage = getStorage(app);
      const photoRef = ref(storage, `doctors/${doctorId}/profile_${Date.now()}.${photoFile.name.split('.').pop()}`);
      const snapshot = await uploadBytesResumable(photoRef, photoFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (err) {
      console.error('Photo upload failed:', err);
      throw new Error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      let doctorId = editingDoctor?.id;
      const data = {
        ...formData,
        clinicIds: (formData.clinicIds || []).filter((id): id is string => Boolean(id)),
        availability: formData.availability || [],
      };
      
      if (editingDoctor) {
        await doctorService.update(editingDoctor.id, data);
      } else {
        const result = await doctorService.create(data as any);
        doctorId = result;
      }
      
      // Upload photo if selected
      if (photoFile && doctorId) {
        const photoUrl = await uploadPhoto(doctorId);
        if (photoUrl) {
          await doctorService.update(doctorId, { photoUrl });
        }
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
          {/* Photo Upload Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3, p: 2, border: '1px solid #e2e8f0', borderRadius: '12px', bgcolor: '#fafafa' }}>
            <Box sx={{ position: 'relative', flexShrink: 0 }}>
              <Avatar
                src={photoPreview}
                sx={{ width: 100, height: 100, border: '3px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              >
                {(!photoPreview && !photoFile) ? <MedicalInformation fontSize="large" /> : null}
              </Avatar>
              {(photoPreview || photoFile) && (
                <IconButton
                  size="small"
                  onClick={handlePhotoRemove}
                  sx={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    bgcolor: 'error.main',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    '&:hover': { bgcolor: 'error.dark' },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" gutterBottom>Doctor Photo</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Upload a professional photo (JPG/PNG, max 5MB)
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                style={{ display: 'none' }}
                id="doctor-photo-upload"
                disabled={uploadingPhoto || saving}
              />
              <Button
                variant="outlined"
                startIcon={<PhotoCamera />}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto || saving}
                component="label"
                htmlFor="doctor-photo-upload"
              >
                {photoFile ? 'Change Photo' : 'Upload Photo'}
              </Button>
              {uploadingPhoto && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, color: 'primary.main' }}>
                  <CircularProgress size={18} />
                  <Typography variant="body2">Uploading...</Typography>
                </Box>
              )}
              {photoPreview && !photoFile && !uploadingPhoto && (
                <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                  ✓ Photo will be updated on save
                </Typography>
              )}
            </Box>
          </Box>
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
              <TextField
                fullWidth
                type="number"
                label="Rating (0-5)"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                inputProps={{ min: 0, max: 5, step: 0.1 }}
                helperText="Set by admin only"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Review Count"
                value={formData.reviewCount}
                onChange={(e) => setFormData({ ...formData, reviewCount: Number(e.target.value) })}
                inputProps={{ min: 0 }}
                helperText="Set by admin only"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Default Visit Duration (minutes)"
                value={formData.defaultVisitDuration}
                onChange={(e) => setFormData({ ...formData, defaultVisitDuration: Number(e.target.value) })}
                inputProps={{ min: 5, max: 120, step: 5 }}
                helperText="Set by admin only"
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