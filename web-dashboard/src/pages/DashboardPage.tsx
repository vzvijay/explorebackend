import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import {
  Refresh,
  TrendingUp,
  Assignment,
  CheckCircle,
  Schedule,
  Cancel,
  Edit,
  Visibility
} from '@mui/icons-material';
import { propertiesApi } from '../services/api';
import { Property } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    approved: 0,
    rejected: 0,
    draft: 0
  });

  useEffect(() => {
    loadDashboardData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load recent properties
      const response = await propertiesApi.getProperties({
        page: 1,
        limit: 50 // Get more data for accurate stats
      });
      
      const propertiesData = response.data?.properties || [];
      setProperties(propertiesData);
      
      // Calculate statistics
      const newStats = {
        total: propertiesData.length,
        submitted: propertiesData.filter(p => p.survey_status === 'submitted').length,
        approved: propertiesData.filter(p => p.survey_status === 'approved').length,
        rejected: propertiesData.filter(p => p.survey_status === 'rejected').length,
        draft: propertiesData.filter(p => p.survey_status === 'draft').length
      };
      
      setStats(newStats);
      
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
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

  const calculateTax = (carpetArea: number, propertyType: string) => {
    const baseRate = propertyType === 'commercial' ? 50 : propertyType === 'industrial' ? 40 : 30;
    return (carpetArea * baseRate).toFixed(2);
  };

  const totalTaxRevenue = properties
    .filter(p => p.survey_status === 'approved')
    .reduce((sum, p) => sum + parseFloat(calculateTax(p.carpet_area, p.property_type)), 0);

  const handleEditProperty = (property: Property) => {
    // Navigate to edit form
    window.location.href = `/properties/${property.id}/edit`;
  };

  const handleViewProperty = (property: Property) => {
    // Navigate to property detail view
    window.location.href = `/properties/${property.id}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h4" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome, {user?.first_name} {user?.last_name}! Here's your survey management overview.
          </Typography>
        </div>
        
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
          onClick={loadDashboardData}
          disabled={loading}
        >
          Refresh Data
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Typography color="inherit" gutterBottom variant="h6">
                    Total Surveys
                  </Typography>
                  <Typography variant="h3" color="inherit">
                    {stats.total}
                  </Typography>
                </div>
                <Assignment sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'warning.main', color: 'warning.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Typography color="inherit" gutterBottom variant="h6">
                    Pending Review
                  </Typography>
                  <Typography variant="h3" color="inherit">
                    {stats.submitted}
                  </Typography>
                </div>
                <Schedule sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'success.main', color: 'success.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Typography color="inherit" gutterBottom variant="h6">
                    Approved
                  </Typography>
                  <Typography variant="h3" color="inherit">
                    {stats.approved}
                  </Typography>
                </div>
                <CheckCircle sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'error.main', color: 'error.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Typography color="inherit" gutterBottom variant="h6">
                    Rejected
                  </Typography>
                  <Typography variant="h3" color="inherit">
                    {stats.rejected}
                  </Typography>
                </div>
                <Cancel sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'secondary.main', color: 'secondary.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Typography color="inherit" gutterBottom variant="h6">
                    Tax Revenue
                  </Typography>
                  <Typography variant="h5" color="inherit">
                    ₹{totalTaxRevenue.toFixed(0)}
                  </Typography>
                </div>
                <TrendingUp sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {user?.role === 'field_executive' && (
                  <Button
                    variant="contained"
                    onClick={() => navigate('/survey')}
                    sx={{ minWidth: 150 }}
                  >
                    New Survey
                  </Button>
                )}
                <Button
                  variant="outlined"
                  onClick={() => navigate('/properties')}
                  sx={{ minWidth: 150 }}
                >
                  View All Properties
                </Button>
                {stats.submitted > 0 && user?.role === 'municipal_officer' && (
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={() => navigate('/properties?status=submitted')}
                    sx={{ minWidth: 150 }}
                  >
                    Review Pending ({stats.submitted})
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Status
              </Typography>
              <Alert severity="success" sx={{ mb: 1 }}>
                ✅ Database Connected
              </Alert>
              <Alert severity="info">
                🔄 Auto-refresh: Every 30 seconds
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Survey Activity
          </Typography>
          
          {properties.length === 0 ? (
            <Alert severity="info">
              No survey data available. Start by submitting your first property survey!
            </Alert>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Survey Number</TableCell>
                    <TableCell>Owner Name</TableCell>
                    <TableCell>Property Type</TableCell>
                    <TableCell>Carpet Area</TableCell>
                    <TableCell>Est. Tax</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Ward</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {properties.slice(0, 10).map((property) => (
                    <TableRow key={property.id} hover>
                      <TableCell>{property.survey_number}</TableCell>
                      <TableCell>{property.owner_name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={property.property_type} 
                          size="small" 
                          variant="outlined" 
                        />
                      </TableCell>
                      <TableCell>{property.carpet_area} sq ft</TableCell>
                      <TableCell>₹{calculateTax(property.carpet_area, property.property_type)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={getStatusLabel(property.survey_status)} 
                          color={getStatusColor(property.survey_status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{property.ward_number}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {/* View Button - Available for all users */}
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Visibility />}
                            onClick={() => handleViewProperty(property)}
                          >
                            View
                          </Button>
                          
                          {/* Edit Button for Field Executives (Always Editable System) */}
                          {user?.role === 'field_executive' && property.surveyed_by === user.id && (
                            <Button
                              size="small"
                              color="primary"
                              variant="outlined"
                              startIcon={<Edit />}
                              onClick={() => handleEditProperty(property)}
                            >
                              Edit
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          {properties.length > 10 && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/properties')}
              >
                View All {properties.length} Surveys
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default DashboardPage; 