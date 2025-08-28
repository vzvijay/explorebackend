import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
  Stack
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import adminApi, { 
  PendingApproval, 
  ApprovalStats, 
  PropertyForApproval 
} from '../services/adminApi';
import SketchPhotoDisplay from '../components/Common/SketchPhotoDisplay';

interface Filters {
  zone: string;
  property_type: string;
  date_from: string;
  date_to: string;
  has_sketch_photo: boolean;
}

const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [approvalStats, setApprovalStats] = useState<ApprovalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    zone: '',
    property_type: '',
    date_from: '',
    date_to: '',
    has_sketch_photo: false
  });

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Dialog states
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [rejectionDialog, setRejectionDialog] = useState(false);
  const [propertyDetailsDialog, setPropertyDetailsDialog] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PendingApproval | null>(null);
  const [propertyDetails, setPropertyDetails] = useState<PropertyForApproval | null>(null);

  // Form states
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Check if user has admin access
  useEffect(() => {
    if (user && !['admin', 'municipal_officer', 'engineer'].includes(user.role)) {
      toast.error('Access denied. Admin privileges required.');
      // Redirect to dashboard or show access denied message
    }
  }, [user]);

  // Load initial data
  useEffect(() => {
    if (user && ['admin', 'municipal_officer', 'engineer'].includes(user.role)) {
      loadPendingApprovals();
      loadApprovalStats();
    }
  }, [user, page, rowsPerPage, filters]);

  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getPendingApprovals({
        zone: filters.zone || undefined,
        property_type: filters.property_type || undefined,
        page: page + 1,
        limit: rowsPerPage,
        sort_by: 'created_at',
        sort_order: 'DESC'
      });

      if (response.success) {
        setPendingApprovals(response.data.properties);
        setTotalCount(response.data.pagination.total_count);
      }
    } catch (error) {
      console.error('Error loading pending approvals:', error);
      toast.error('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const loadApprovalStats = async () => {
    try {
      setStatsLoading(true);
      const stats = await adminApi.getApprovalStats({
        zone: filters.zone || undefined,
        property_type: filters.property_type || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined
      });
      setApprovalStats(stats);
    } catch (error) {
      console.error('Error loading approval stats:', error);
      toast.error('Failed to load approval statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedProperty) return;

    try {
      setActionLoading(true);
      const response = await adminApi.approveProperty(selectedProperty.id, adminNotes);
      
      if (response.success) {
        toast.success(`Property ${response.data.survey_number} approved successfully!`);
        setApprovalDialog(false);
        setAdminNotes('');
        setSelectedProperty(null);
        loadPendingApprovals();
        loadApprovalStats();
      }
    } catch (error) {
      console.error('Error approving property:', error);
      toast.error('Failed to approve property');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedProperty || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(true);
      const response = await adminApi.rejectProperty(
        selectedProperty.id, 
        rejectionReason.trim(), 
        rejectionNotes
      );
      
      if (response.success) {
        toast.success(`Property ${response.data.survey_number} rejected successfully!`);
        setRejectionDialog(false);
        setRejectionReason('');
        setRejectionNotes('');
        setSelectedProperty(null);
        loadPendingApprovals();
        loadApprovalStats();
      }
    } catch (error) {
      console.error('Error rejecting property:', error);
      toast.error('Failed to reject property');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = async (property: PendingApproval) => {
    try {
      setSelectedProperty(property);
      const response = await adminApi.getPropertyForApproval(property.id);
      if (response.success) {
        setPropertyDetails(response.data.property);
        setPropertyDetailsDialog(true);
      }
    } catch (error) {
      console.error('Error loading property details:', error);
      toast.error('Failed to load property details');
    }
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field: keyof Filters, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const resetFilters = () => {
    setFilters({
      zone: '',
      property_type: '',
      date_from: '',
      date_to: '',
      has_sketch_photo: false
    });
    setPage(0);
  };

  const refreshData = () => {
    loadPendingApprovals();
    loadApprovalStats();
  };

  if (!user || !['admin', 'municipal_officer', 'engineer'].includes(user.role)) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error">
          Access denied. Admin privileges required.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage property survey approvals and monitor system statistics
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ScheduleIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {statsLoading ? '...' : approvalStats?.summary.pending || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Approvals
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircleIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {statsLoading ? '...' : approvalStats?.summary.approved || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approved
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CancelIcon color="error" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {statsLoading ? '...' : approvalStats?.summary.rejected || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rejected
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon color="info" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {statsLoading ? '...' : approvalStats?.summary.approval_rate || '0'}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approval Rate
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Sketch Photo Statistics */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AssignmentIcon color="secondary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {statsLoading ? '...' : 
                      pendingApprovals.filter(p => p.sketch_photo).length || 0
                    }
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    With Sketch Photos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterListIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Filters</Typography>
        </Box>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Zone</InputLabel>
              <Select
                value={filters.zone}
                label="Zone"
                onChange={(e) => handleFilterChange('zone', e.target.value)}
              >
                <MenuItem value="">All Zones</MenuItem>
                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'].map((zone) => (
                  <MenuItem key={zone} value={zone}>Zone {zone}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Property Type</InputLabel>
              <Select
                value={filters.property_type}
                label="Property Type"
                onChange={(e) => handleFilterChange('property_type', e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="residential">Residential</MenuItem>
                <MenuItem value="commercial">Commercial</MenuItem>
                <MenuItem value="industrial">Industrial</MenuItem>
                <MenuItem value="mixed">Mixed</MenuItem>
                <MenuItem value="institutional">Institutional</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="From Date"
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="To Date"
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Sketch Photo</InputLabel>
              <Select
                value={filters.has_sketch_photo ? 'true' : 'false'}
                label="Sketch Photo"
                onChange={(e) => handleFilterChange('has_sketch_photo', e.target.value === 'true')}
              >
                <MenuItem value="false">All Properties</MenuItem>
                <MenuItem value="true">With Sketch Photos</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                onClick={resetFilters}
                size="small"
              >
                Reset
              </Button>
              <Button
                variant="contained"
                onClick={refreshData}
                startIcon={<RefreshIcon />}
                size="small"
              >
                Refresh
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Pending Approvals Table */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">
            Pending Approvals ({totalCount})
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Survey #</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Zone</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Sketch Photo</TableCell>
                <TableCell>Surveyor</TableCell>
                <TableCell>Date</TableCell>
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
                             ) : pendingApprovals.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={9} align="center">
                     <Typography variant="body2" color="text.secondary">
                       No pending approvals found
                     </Typography>
                   </TableCell>
                 </TableRow>
              ) : (
                pendingApprovals.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {property.survey_number}
                      </Typography>
                    </TableCell>
                    <TableCell>{property.owner_name}</TableCell>
                    <TableCell>{property.locality}</TableCell>
                    <TableCell>
                      <Chip 
                        label={`Zone ${property.zone}`} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={property.property_type} 
                        size="small" 
                        color="secondary"
                      />
                    </TableCell>
                    <TableCell>
                      <SketchPhotoDisplay
                        sketchPhotoPath={property.sketch_photo}
                        sketchPhotoBase64={property.sketch_photo_base64}
                        capturedAt={property.sketch_photo_captured_at}
                        surveyNumber={property.survey_number}
                        ownerName={property.owner_name}
                        size="small"
                        showMetadata={false}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {property.surveyor.first_name} {property.surveyor.last_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {property.surveyor.employee_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(property.survey_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(property)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Approve">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => {
                              setSelectedProperty(property);
                              setApprovalDialog(true);
                            }}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setSelectedProperty(property);
                              setRejectionDialog(true);
                            }}
                          >
                            <CancelIcon />
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

      {/* Approval Dialog */}
      <Dialog open={approvalDialog} onClose={() => setApprovalDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Property Survey</DialogTitle>
        <DialogContent>
          {selectedProperty && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Survey Number: <strong>{selectedProperty.survey_number}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Owner: <strong>{selectedProperty.owner_name}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Location: <strong>{selectedProperty.locality}</strong>
              </Typography>
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Admin Notes (Optional)"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Add any additional notes or comments..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialog(false)}>Cancel</Button>
          <Button
            onClick={handleApprove}
            variant="contained"
            color="success"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          >
            {actionLoading ? 'Approving...' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialog} onClose={() => setRejectionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Property Survey</DialogTitle>
        <DialogContent>
          {selectedProperty && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Survey Number: <strong>{selectedProperty.survey_number}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Owner: <strong>{selectedProperty.owner_name}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Location: <strong>{selectedProperty.locality}</strong>
              </Typography>
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rejection Reason *"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Please provide a clear reason for rejection..."
            required
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Admin Notes (Optional)"
            value={rejectionNotes}
            onChange={(e) => setRejectionNotes(e.target.value)}
            placeholder="Add any additional notes or guidance..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectionDialog(false)}>Cancel</Button>
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
            disabled={actionLoading || !rejectionReason.trim()}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <CancelIcon />}
          >
            {actionLoading ? 'Rejecting...' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Property Details Dialog */}
      <Dialog open={propertyDetailsDialog} onClose={() => setPropertyDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Property Details</DialogTitle>
        <DialogContent>
          {propertyDetails && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Survey Number</Typography>
                  <Typography variant="body1">{propertyDetails.survey_number}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Owner Name</Typography>
                  <Typography variant="body1">{propertyDetails.owner_name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Zone</Typography>
                  <Typography variant="body1">Zone {propertyDetails.zone}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Property Type</Typography>
                  <Typography variant="body1">{propertyDetails.property_type}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Locality</Typography>
                  <Typography variant="body1">{propertyDetails.locality}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Survey Date</Typography>
                  <Typography variant="body1">
                    {new Date(propertyDetails.survey_date).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary">Surveyor Information</Typography>
                  <Typography variant="body1">
                    {propertyDetails.surveyor.first_name} {propertyDetails.surveyor.last_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ID: {propertyDetails.surveyor.employee_id} | Role: {propertyDetails.surveyor.role}
                  </Typography>
                  {propertyDetails.surveyor.department && (
                    <Typography variant="body2" color="text.secondary">
                      Department: {propertyDetails.surveyor.department}
                    </Typography>
                  )}
                </Grid>
                
                {/* Sketch Photo Section */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Sketch Photo
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <SketchPhotoDisplay
                      sketchPhotoPath={propertyDetails.sketch_photo}
                      sketchPhotoBase64={propertyDetails.sketch_photo_base64}
                      capturedAt={propertyDetails.sketch_photo_captured_at}
                      surveyNumber={propertyDetails.survey_number}
                      ownerName={propertyDetails.owner_name}
                      size="large"
                      showMetadata={true}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPropertyDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboardPage;
