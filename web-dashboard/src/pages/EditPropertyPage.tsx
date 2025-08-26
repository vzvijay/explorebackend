import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Grid
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { propertiesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import PropertySurveyForm from './PropertySurveyForm';

const EditPropertyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadProperty();
    }
  }, [id]);

  const loadProperty = async () => {
    try {
      setLoading(true);
      const response = await propertiesApi.getProperty(id!);
      setProperty(response.data.property);
    } catch (error: any) {
      console.error('Error loading property:', error);
      setError('Failed to load property data');
      toast.error('Failed to load property data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditComplete = () => {
    toast.success('Property updated successfully!');
    navigate('/properties');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !property) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Property not found'}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/properties')}
        >
          Back to Properties
        </Button>
      </Box>
    );
  }

  // Check if user can edit this property
  if (user?.role === 'field_executive' && property.surveyed_by !== user.id) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          You can only edit properties that you have surveyed.
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/properties')}
        >
          Back to Properties
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBack />}
        onClick={() => navigate('/properties')}
        sx={{ mb: 2 }}
      >
        Back to Properties
      </Button>
      
      {/* Edit Tracking Summary */}
      {property.edit_count > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            📝 Edit History Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2">
                <strong>Total Edits:</strong> {property.edit_count}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2">
                <strong>Last Edit:</strong> {property.last_edit_date ? new Date(property.last_edit_date).toLocaleDateString() : 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2">
                <strong>Current Status:</strong> {property.survey_status}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2">
                <strong>Survey Number:</strong> {property.survey_number}
              </Typography>
            </Grid>
          </Grid>
          {property.last_edit_comment && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Last Edit Comment:</strong> "{property.last_edit_comment}"
              </Typography>
            </Box>
          )}
        </Box>
      )}
      
      <PropertySurveyForm
        editMode={true}
        propertyToEdit={property}
        onEditComplete={handleEditComplete}
      />
    </Box>
  );
};

export default EditPropertyPage;
