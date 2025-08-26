import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Pagination
} from '@mui/material';
import {
  Visibility,
  CheckCircle,
  Cancel,
  LocationOn,
  Home,
  Person
} from '@mui/icons-material';
import { propertiesApi } from '../services/api';
import { Property } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const PropertiesPage: React.FC = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<{
    survey_status: string;
    property_type: string;
    ward_number: string;
  }>({
    survey_status: '',
    property_type: '',
    ward_number: ''
  });

  useEffect(() => {
    loadProperties();
  }, [page, filters]);

  const loadProperties = async () => {
    setLoading(true);
    try {
      // Convert filters to match PropertyFilters interface
      const apiFilters = {
        page,
        limit: 10,
        survey_status: filters.survey_status || undefined,
        property_type: filters.property_type || undefined,
        ward_number: filters.ward_number ? parseInt(filters.ward_number) : undefined
      };
      
      const response = await propertiesApi.getProperties(apiFilters);
      
      setProperties(response.data.properties || []);
      setTotalPages(response.data.pagination?.total_pages || 1);
    } catch (error: any) {
      console.error('Error loading properties:', error);
      toast.error('Failed to load properties');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'submitted': return 'warning';
      case 'under_review': return 'info';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'submitted': return 'Submitted';
      case 'under_review': return 'Under Review';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const handleViewProperty = (property: Property) => {
    setSelectedProperty(property);
  };

  const handleReviewProperty = (property: Property, action: 'approve' | 'reject') => {
    setSelectedProperty(property);
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  const submitReview = async () => {
    if (!selectedProperty) return;

    try {
      await propertiesApi.reviewProperty(selectedProperty.id, reviewAction, reviewRemarks);
      toast.success(`Property ${reviewAction}d successfully!`);
      setReviewDialogOpen(false);
      setReviewRemarks('');
      loadProperties();
    } catch (error: any) {
      console.error('Error reviewing property:', error);
      toast.error(`Failed to ${reviewAction} property`);
    }
  };

  const calculateTax = (carpetArea: number, propertyType: string) => {
    // Simple tax calculation based on carpet area and property type
    const baseRate = propertyType === 'commercial' ? 50 : propertyType === 'industrial' ? 40 : 30;
    return (carpetArea * baseRate).toFixed(2);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Property Surveys Management
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage property surveys submitted by field executives. Review, approve, or reject surveys for tax assessment.
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Survey Status</InputLabel>
                <Select
                  value={filters.survey_status}
                  onChange={(e) => setFilters(prev => ({ ...prev, survey_status: e.target.value }))}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="submitted">Submitted</MenuItem>
                  <MenuItem value="under_review">Under Review</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Property Type</InputLabel>
                <Select
                  value={filters.property_type}
                  onChange={(e) => setFilters(prev => ({ ...prev, property_type: e.target.value }))}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="residential">Residential</MenuItem>
                  <MenuItem value="commercial">Commercial</MenuItem>
                  <MenuItem value="industrial">Industrial</MenuItem>
                  <MenuItem value="mixed">Mixed Use</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Ward Number"
                type="number"
                value={filters.ward_number}
                onChange={(e) => setFilters(prev => ({ ...prev, ward_number: e.target.value }))}
                placeholder="Filter by ward"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Surveys
              </Typography>
              <Typography variant="h4">
                {properties.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Review
              </Typography>
              <Typography variant="h4" color="warning.main">
                {properties.filter(p => p.survey_status === 'submitted').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Approved
              </Typography>
              <Typography variant="h4" color="success.main">
                {properties.filter(p => p.survey_status === 'approved').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Rejected
              </Typography>
              <Typography variant="h4" color="error.main">
                {properties.filter(p => p.survey_status === 'rejected').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Properties Table */}
      {properties.length === 0 ? (
        <Alert severity="info">
          No property surveys found. Field executives haven't submitted any surveys yet.
        </Alert>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Survey Number</TableCell>
                  <TableCell>Property Owner</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Property Type</TableCell>
                  <TableCell>Carpet Area (sq ft)</TableCell>
                  <TableCell>Estimated Tax (₹)</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Field Executive</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>{property.survey_number}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {property.owner_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {property.owner_phone}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {property.house_number} {property.street_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {property.locality}, Ward {property.ward_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={property.property_type} 
                        size="small" 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell>{property.carpet_area}</TableCell>
                    <TableCell>
                      ₹{calculateTax(property.carpet_area, property.property_type)}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getStatusLabel(property.survey_status)} 
                        color={getStatusColor(property.survey_status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        Surveyed by field executive
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => handleViewProperty(property)}
                        >
                          View
                        </Button>
                        
                        {user?.role === 'municipal_officer' && property.survey_status === 'submitted' && (
                          <>
                            <Button
                              size="small"
                              color="success"
                              startIcon={<CheckCircle />}
                              onClick={() => handleReviewProperty(property, 'approve')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              startIcon={<Cancel />}
                              onClick={() => handleReviewProperty(property, 'reject')}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        </>
      )}

      {/* Property Details Dialog */}
      <Dialog open={!!selectedProperty} onClose={() => setSelectedProperty(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          Property Survey Details - {selectedProperty?.survey_number}
        </DialogTitle>
        <DialogContent>
          {selectedProperty && (
            <Grid container spacing={3}>
              {/* Owner Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Owner Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography><strong>Name:</strong> {selectedProperty.owner_name}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography><strong>Father's Name:</strong> {selectedProperty.owner_father_name || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography><strong>Phone:</strong> {selectedProperty.owner_phone || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography><strong>Email:</strong> {selectedProperty.owner_email || 'N/A'}</Typography>
                  </Grid>
                </Grid>
              </Grid>

              {/* Property Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  <Home sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Property Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography><strong>Address:</strong> {selectedProperty.house_number} {selectedProperty.street_name}, {selectedProperty.locality}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography><strong>Ward:</strong> {selectedProperty.ward_number}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography><strong>Pincode:</strong> {selectedProperty.pincode}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography><strong>Type:</strong> {selectedProperty.property_type}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography><strong>Construction:</strong> {selectedProperty.construction_type}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography><strong>Year Built:</strong> {selectedProperty.construction_year || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography><strong>Floors:</strong> {selectedProperty.number_of_floors}</Typography>
                  </Grid>
                </Grid>
              </Grid>

              {/* Area Measurements */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  📏 Area Measurements
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography><strong>Plot Area:</strong> {selectedProperty.plot_area} sq ft</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography><strong>Built-up Area:</strong> {selectedProperty.built_up_area} sq ft</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography><strong>Carpet Area:</strong> {selectedProperty.carpet_area} sq ft</Typography>
                  </Grid>
                </Grid>
              </Grid>

              {/* Utilities */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  🔌 Utility Connections
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography>
                      <strong>Water:</strong> {selectedProperty.water_connection ? '✅ Yes' : '❌ No'}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography>
                      <strong>Electricity:</strong> {selectedProperty.electricity_connection ? '✅ Yes' : '❌ No'}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography>
                      <strong>Sewage:</strong> {selectedProperty.sewage_connection ? '✅ Yes' : '❌ No'}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>

              {/* Location */}
              {selectedProperty.latitude && selectedProperty.longitude && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
                    GPS Location
                  </Typography>
                  <Typography>
                    <strong>Coordinates:</strong> {selectedProperty.latitude}, {selectedProperty.longitude}
                  </Typography>
                </Grid>
              )}

              {/* Tax Calculation */}
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="h6" gutterBottom>
                    💰 Tax Assessment
                  </Typography>
                  <Typography>
                    <strong>Estimated Annual Tax:</strong> ₹{calculateTax(selectedProperty.carpet_area, selectedProperty.property_type)}
                  </Typography>
                  <Typography variant="caption">
                    Based on carpet area ({selectedProperty.carpet_area} sq ft) and property type ({selectedProperty.property_type})
                  </Typography>
                </Alert>
              </Grid>

              {/* Remarks */}
              {selectedProperty.remarks && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    📝 Remarks
                  </Typography>
                  <Typography>{selectedProperty.remarks}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedProperty(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {reviewAction === 'approve' ? 'Approve' : 'Reject'} Property Survey
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to {reviewAction} the property survey for {selectedProperty?.owner_name}?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Remarks (Optional)"
            value={reviewRemarks}
            onChange={(e) => setReviewRemarks(e.target.value)}
            margin="normal"
            placeholder={`Add any remarks for ${reviewAction}ing this survey...`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={submitReview} 
            color={reviewAction === 'approve' ? 'success' : 'error'}
            variant="contained"
          >
            {reviewAction === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PropertiesPage; 