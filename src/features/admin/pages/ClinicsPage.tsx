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
} from '@mui/material';
import { LocalHospital, Add, Edit, Delete, Visibility, Schedule, Save, Close, LocationOn, Phone, AccessTime } from '@mui/icons-material';
import { clinicService, firestoreService } from '../../../services/firestore';
import type { Clinic, ClinicSettings } from '../../../types';
import { useAuth } from '../../../features/auth/hooks';

export function ClinicsPage() {
  const { user } = useAuth();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [formData, setFormData] = useState<Partial<Clinic> & { settings: Partial<ClinicSettings> }>({
    name: '',
    address: '',
    phone: '',
    timezone: 'Asia/Kolkata',
    settings: {},
  });

  useEffect(() => {
    loadClinics();
  }, []);

  const loadClinics = async () => {
    setLoading(true);
    try {
      const data = await clinicService.getAll();
      setClinics(data);
    } catch (err) {
      setError('Failed to load clinics');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (clinic?: Clinic) => {
    if (clinic) {
      setEditingClinic(clinic);
      setFormData({
        name: clinic.name,
        address: clinic.address,
        phone: clinic.phone,
        timezone: clinic.timezone,
        settings: clinic.settings,
      });
    } else {
      setEditingClinic(null);
      setFormData({
        name: '',
        address: '',
        phone: '',
        timezone: 'Asia/Kolkata',
        settings: {},
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingClinic(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const data = {
        ...formData,
        settings: {
          tokenPrefix: formData.settings?.tokenPrefix,
          slotDurationDefault: formData.settings?.slotDurationDefault || 15,
          maxAdvanceBookingDays: formData.settings?.maxAdvanceBookingDays || 30,
          allowWalkIns: formData.settings?.allowWalkIns || false,
        },
      };
      
      if (editingClinic) {
        await clinicService.update(editingClinic.id, data);
      } else {
        await clinicService.create(data as any);
      }
      await loadClinics();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.message || 'Failed to save clinic');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (clinic: Clinic) => {
    if (!window.confirm(`Delete clinic "${clinic.name}"? This action cannot be undone.`)) return;
    try {
      await clinicService.delete(clinic.id);
      await loadClinics();
    } catch (err) {
      setError('Failed to delete clinic');
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
            Clinic Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage clinic locations and settings
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Add Clinic
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

      <Card elevation={1}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Clinic</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Timezone</TableCell>
                <TableCell>Settings</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clinics.map((clinic) => (
                <TableRow key={clinic.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                        <LocalHospital fontSize="small" />
                      </Avatar>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>{clinic.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{clinic.address}</TableCell>
                  <TableCell>{clinic.phone}</TableCell>
                  <TableCell>{clinic.timezone}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      <Chip label={`Default: ${clinic.settings.slotDurationDefault || 15}min`} size="small" variant="outlined" />
                      <Chip label={`Advance: ${clinic.settings.maxAdvanceBookingDays || 30}d`} size="small" variant="outlined" />
                      {clinic.settings.allowWalkIns && <Chip label="Walk-ins" size="small" color="success" variant="outlined" />}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View">
                      <IconButton size="small" onClick={() => handleOpenDialog(clinic)}><Visibility /></IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpenDialog(clinic)}><Edit /></IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(clinic)}><Delete /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {clinics.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">No clinics configured</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={showDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingClinic ? 'Edit Clinic' : 'Add New Clinic'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Clinic Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
              <FormControl fullWidth>
                <InputLabel>Timezone</InputLabel>
                <Select
                  value={formData.timezone}
                  label="Timezone"
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                >
                  <MenuItem value="Asia/Kolkata">Asia/Kolkata (IST)</MenuItem>
                  <MenuItem value="Asia/Dubai">Asia/Dubai</MenuItem>
                  <MenuItem value="Asia/Singapore">Asia/Singapore</MenuItem>
                  <MenuItem value="UTC">UTC</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="h6" component="h3" gutterBottom>
                Settings
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Token Prefix"
                value={formData.settings.tokenPrefix || ''}
                onChange={(e) => setFormData({ ...formData, settings: { ...formData.settings, tokenPrefix: e.target.value } })}
                placeholder="e.g., A, B, C1"
                helperText="Prefix for daily token numbers"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Default Slot Duration</InputLabel>
                <Select
                  value={formData.settings.slotDurationDefault || 15}
                  label="Default Slot Duration"
                  onChange={(e) => setFormData({ ...formData, settings: { ...formData.settings, slotDurationDefault: Number(e.target.value) } })}
                >
                  <MenuItem value={10}>10 minutes</MenuItem>
                  <MenuItem value={15}>15 minutes</MenuItem>
                  <MenuItem value={20}>20 minutes</MenuItem>
                  <MenuItem value={30}>30 minutes</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Max Advance Booking (days)"
                value={formData.settings.maxAdvanceBookingDays || 30}
                onChange={(e) => setFormData({ ...formData, settings: { ...formData.settings, maxAdvanceBookingDays: Number(e.target.value) } })}
                InputProps={{ inputProps: { min: 1, max: 365 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.settings.allowWalkIns || false}
                    onChange={(e) => setFormData({ ...formData, settings: { ...formData.settings, allowWalkIns: e.target.checked } })}
                  />
                }
                label="Allow Walk-in Appointments"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}>
            {saving ? 'Saving...' : editingClinic ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}