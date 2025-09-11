import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  Image as ImageIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { Property } from '../types';
import api from '../services/api';

const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoDialog, setPhotoDialog] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadPropertyDetails();
    }
  }, [id]);

  const loadPropertyDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/properties/${id}`);
      
      if (response.data.success) {
        setProperty(response.data.data.property);
      } else {
        setError(response.data.message || 'Failed to load property details');
      }
    } catch (error) {
      console.error('Error loading property details:', error);
      setError('Failed to load property details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/properties/${id}/edit`);
  };

  const handlePhotoView = (photoPath: string) => {
    setSelectedPhoto(photoPath);
    setPhotoDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'submitted':
        return 'warning';
      case 'under_review':
        return 'info';
      case 'draft':
        return 'default';
      default:
        return 'default';
    }
  };

  const getApprovalStatusColor = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending_approval':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !property) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error || 'Property not found'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/properties')}
          sx={{ mt: 2 }}
        >
          Back to Properties
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <IconButton onClick={() => navigate('/properties')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">
            Property Details
          </Typography>
          <Chip 
            label={property.survey_number} 
            color="primary" 
            variant="outlined"
          />
        </Stack>
        
        <Typography variant="body1" color="text.secondary">
          Complete property information and survey details
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Property Information */}
        <Grid item xs={12} md={8}>
          {/* Basic Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1 }} />
                Basic Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Owner Name</Typography>
                  <Typography variant="body1">{property.owner_name}</Typography>
                </Grid>
                
                {property.owner_father_name && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Father's Name</Typography>
                    <Typography variant="body1">{property.owner_father_name}</Typography>
                  </Grid>
                )}
                
                {property.owner_phone && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1">{property.owner_phone}</Typography>
                  </Grid>
                )}
                
                {property.owner_email && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{property.owner_email}</Typography>
                  </Grid>
                )}
                
                {property.aadhar_number && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Aadhar Number</Typography>
                    <Typography variant="body1">{property.aadhar_number}</Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <HomeIcon sx={{ mr: 1 }} />
                Property Details
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Property Type</Typography>
                  <Chip 
                    label={property.property_type} 
                    color="secondary" 
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Construction Type</Typography>
                  <Typography variant="body1">
                    {property.construction_type ? property.construction_type.toUpperCase() : 'Not specified'}
                  </Typography>
                </Grid>
                
                {property.construction_year && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Construction Year</Typography>
                    <Typography variant="body1">{property.construction_year}</Typography>
                  </Grid>
                )}
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Number of Floors</Typography>
                  <Typography variant="body1">{property.number_of_floors}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Building Permission</Typography>
                  <Chip 
                    label={property.building_permission ? 'Yes' : 'No'} 
                    color={property.building_permission ? 'success' : 'error'} 
                    size="small"
                  />
                </Grid>
                
                {property.bp_number && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">BP Number</Typography>
                    <Typography variant="body1">{property.bp_number}</Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Area Measurements */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Area Measurements
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">Plot Area</Typography>
                  <Typography variant="h6">{property.plot_area} sq ft</Typography>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">Built-up Area</Typography>
                  <Typography variant="h6">{property.built_up_area} sq ft</Typography>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">Carpet Area</Typography>
                  <Typography variant="h6">{property.carpet_area} sq ft</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Utility Connections */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Utility Connections
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Water Connection</Typography>
                  <Typography variant="body1">
                    {property.water_connection ? `${property.water_connection} connection(s)` : 'No connection'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Electricity</Typography>
                  <Chip 
                    label={property.electricity_connection ? 'Connected' : 'Not Connected'} 
                    color={property.electricity_connection ? 'success' : 'error'} 
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Sewage</Typography>
                  <Chip 
                    label={property.sewage_connection ? 'Connected' : 'Not Connected'} 
                    color={property.sewage_connection ? 'success' : 'error'} 
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Solar Panel</Typography>
                  <Chip 
                    label={property.solar_panel ? 'Installed' : 'Not Installed'} 
                    color={property.solar_panel ? 'success' : 'error'} 
                    size="small"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Photos, Status, and Actions */}
        <Grid item xs={12} md={4}>
          {/* Status Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AssignmentIcon sx={{ mr: 1 }} />
                Survey Status
              </Typography>
              
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Survey Status</Typography>
                  <Chip 
                    label={property.survey_status} 
                    color={getStatusColor(property.survey_status) as any} 
                    size="small"
                  />
                </Box>
                
                {property.approval_status && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Approval Status</Typography>
                    <Chip 
                      label={property.approval_status.replace('_', ' ')} 
                      color={getApprovalStatusColor(property.approval_status) as any} 
                      size="small"
                    />
                  </Box>
                )}
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Survey Date</Typography>
                  <Typography variant="body1">{formatDate(property.survey_date)}</Typography>
                </Box>
                
                {property.estimated_tax && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Estimated Tax</Typography>
                    <Typography variant="h6" color="primary">
                      ₹{property.estimated_tax.toLocaleString()}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Sketch Photo Section */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <PhotoCameraIcon sx={{ mr: 1 }} />
                Sketch Photo
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                {property.images?.find(img => img.image_type === 'sketch_photo') ? (
                  <img
                    src={property.images.find(img => img.image_type === 'sketch_photo')?.gitlab_url}
                    alt={`Sketch photo for survey ${property.survey_number}`}
                    style={{
                      width: '200px',
                      height: '150px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: '2px solid #e0e0e0'
                    }}
                    onClick={() => handlePhotoView(property.images?.find(img => img.image_type === 'sketch_photo')?.gitlab_url!)}
                    onError={(e) => {
                      console.error('❌ Error loading sketch photo:', e);
                    }}
                    onLoad={() => {
                      console.log('✅ Sketch photo loaded successfully from GitLab');
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: '200px',
                      height: '150px',
                      border: '2px dashed #ccc',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f5f5f5'
                    }}
                  >
                    <PhotoCameraIcon sx={{ fontSize: 40, color: '#999', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      No Sketch Photo
                    </Typography>
                  </Box>
                )}
              </Box>
              
              {property.sketch_photo_captured_at && (
                <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                  Captured: {formatDateTime(property.sketch_photo_captured_at)}
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Owner Photo */}
          {property.images?.find(img => img.image_type === 'owner_photo') && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <ImageIcon sx={{ mr: 1 }} />
                  Owner Photo
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <img
                    src={property.images?.find(img => img.image_type === 'owner_photo')?.gitlab_url}
                    alt="Owner/Tenant Photo"
                    style={{
                      width: '100%',
                      maxWidth: '200px',
                      height: 'auto',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                    onClick={() => handlePhotoView(property.images?.find(img => img.image_type === 'owner_photo')?.gitlab_url!)}
                  />
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Signature */}
          {property.images?.find(img => img.image_type === 'signature') && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <AssignmentIcon sx={{ mr: 1 }} />
                  Signature
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <img
                    src={property.images?.find(img => img.image_type === 'signature')?.gitlab_url}
                    alt="Owner Signature"
                    style={{
                      width: '100%',
                      maxWidth: '200px',
                      height: 'auto',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: '2px solid #e0e0e0'
                    }}
                    onClick={() => handlePhotoView(property.images?.find(img => img.image_type === 'signature')?.gitlab_url!)}
                    onError={(e) => {
                      console.error('❌ Error loading signature:', e);
                    }}
                    onLoad={() => {
                      console.log('✅ Signature loaded successfully from GitLab');
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>
              
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                  fullWidth
                >
                  Edit Property
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => navigate('/properties')}
                  fullWidth
                >
                  Back to Properties
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Photo View Dialog */}
      <Dialog
        open={photoDialog}
        onClose={() => setPhotoDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Photo View</DialogTitle>
        <DialogContent>
          {selectedPhoto && (
            <img
              src={selectedPhoto}
              alt="Property Photo"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '70vh',
                objectFit: 'contain'
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPhotoDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PropertyDetailPage; 