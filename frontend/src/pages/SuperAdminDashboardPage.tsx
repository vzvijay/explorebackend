import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  Tooltip,
  TablePagination
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import superAdminApi, { DeletableProperty } from '../services/superAdminApi';

/**
 * Super Admin Dashboard Page
 * 
 * This page provides hard delete functionality for super admin users
 * 
 * IMPORTANT: This page is for LOCAL TESTING ONLY
 * DO NOT DEPLOY TO PRODUCTION
 */

const SuperAdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<DeletableProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<DeletableProperty | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Check if user is super admin
  useEffect(() => {
    if (user && user.role !== 'super_admin') {
      toast.error('Access denied. Super admin role required.');
      // Redirect or show error
    }
  }, [user]);

  // Load deletable properties
  const loadProperties = async () => {
    try {
      setLoading(true);
      const response = await superAdminApi.getDeletableProperties({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm
      });

      if (response.success) {
        setProperties(response.data.properties);
        setTotalCount(response.data.pagination.total);
      }
    } catch (error) {
      console.error('Error loading properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, [page, rowsPerPage, searchTerm]);

  // Handle hard delete
  const handleHardDelete = async () => {
    if (!selectedProperty) return;

    try {
      setDeleting(true);
      const response = await superAdminApi.hardDeleteProperty(selectedProperty.property_id);

      if (response.success) {
        toast.success(`Property ${response.data.survey_number} hard deleted successfully!`);
        setDeleteDialogOpen(false);
        setSelectedProperty(null);
        loadProperties(); // Refresh the list
      }
    } catch (error) {
      console.error('Error hard deleting property:', error);
      toast.error('Failed to hard delete property');
    } finally {
      setDeleting(false);
    }
  };

  // Handle page change
  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  if (user?.role !== 'super_admin') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="h6">Access Denied</Typography>
          <Typography>Super admin role required to access this page.</Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🗑️ Super Admin Dashboard
      </Typography>
      
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="h6">⚠️ Hard Delete Operations</Typography>
        <Typography>
          This page provides permanent deletion functionality. All data will be removed from 
          database and GitLab. This action cannot be undone.
        </Typography>
      </Alert>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="Search Properties"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by survey number, owner name, or property ID..."
            sx={{ minWidth: 300 }}
          />
          <Button
            variant="outlined"
            onClick={loadProperties}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Search'}
          </Button>
        </Stack>
      </Paper>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Survey Number</TableCell>
                <TableCell>Owner Name</TableCell>
                <TableCell>Locality</TableCell>
                <TableCell>Zone</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Surveyor</TableCell>
                <TableCell>Images</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : properties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No properties found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {property.survey_number}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {property.property_id}
                      </Typography>
                    </TableCell>
                    <TableCell>{property.owner_name}</TableCell>
                    <TableCell>{property.locality}</TableCell>
                    <TableCell>
                      <Chip label={property.zone} size="small" />
                    </TableCell>
                    <TableCell>{property.property_type}</TableCell>
                    <TableCell>
                      {property.surveyor ? (
                        <Box>
                          <Typography variant="body2">{property.surveyor.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {property.surveyor.email}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Unknown
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${property.image_count} images`}
                        size="small"
                        color={property.has_images ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(property.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Hard Delete (Permanent)">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setSelectedProperty(property);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* Hard Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <WarningIcon color="error" />
            <Typography variant="h6">Hard Delete Property</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedProperty && (
            <Box>
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="h6">⚠️ PERMANENT DELETION</Typography>
                <Typography>
                  This action will permanently remove the property and all associated data 
                  from the database and GitLab. This action cannot be undone.
                </Typography>
              </Alert>
              
              <Typography variant="subtitle2" gutterBottom>
                Property Details:
              </Typography>
              <Box sx={{ ml: 2 }}>
                <Typography variant="body2">
                  <strong>Survey Number:</strong> {selectedProperty.survey_number}
                </Typography>
                <Typography variant="body2">
                  <strong>Property ID:</strong> {selectedProperty.property_id}
                </Typography>
                <Typography variant="body2">
                  <strong>Owner:</strong> {selectedProperty.owner_name}
                </Typography>
                <Typography variant="body2">
                  <strong>Location:</strong> {selectedProperty.locality}, Zone {selectedProperty.zone}
                </Typography>
                <Typography variant="body2">
                  <strong>Images:</strong> {selectedProperty.image_count} images will be deleted
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleHardDelete}
            variant="contained"
            color="error"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deleting ? 'Deleting...' : 'Hard Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SuperAdminDashboardPage;
