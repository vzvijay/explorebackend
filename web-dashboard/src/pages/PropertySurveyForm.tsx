import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Button,
  Checkbox,
  FormControlLabel,
  Divider,
  Alert,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormLabel
} from '@mui/material';
import {
  LocationOn,
  Save,
  Send,
  Home,
  Person,
  Assessment,
  Add,
  Delete,
  PhotoCamera,
  Edit,
  Clear
} from '@mui/icons-material';
import { propertiesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { RoomDetail, PropertyUseDetails } from '../types';

interface FormData {
  survey_number: string;
  old_mc_property_number: string;
  register_no: string;
  owner_name: string;
  owner_father_name: string;
  owner_phone: string;
  owner_email: string;
  aadhar_number: string;
  house_number: string;
  street_name: string;
  locality: string;
  ward_number: string;
  pincode: string;
  zone: string;
  property_type: string;
  construction_type: string;
  construction_year: string | null;
  number_of_floors: number;
  building_permission: boolean;
  bp_number: string;
  bp_date: string;
  plot_area: string;
  built_up_area: string;
  carpet_area: string;
  water_connection: number;
  water_connection_number: string;
  water_connection_date: string;
  electricity_connection: boolean;
  electricity_connection_number: string;
  sewage_connection: boolean;
  solar_panel: boolean;
  rain_water_harvesting: boolean;
  latitude: string;
  longitude: string;
  remarks: string;
  edit_comment?: string; // Comment required for post-submission edits
}

interface PropertySurveyFormProps {
  editMode?: boolean;
  propertyToEdit?: any;
  onEditComplete?: () => void;
}

const PropertySurveyForm: React.FC<PropertySurveyFormProps> = ({ 
  editMode = false, 
  propertyToEdit = null, 
  onEditComplete 
}) => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isEditMode] = useState(editMode);
  const [editingProperty] = useState(propertyToEdit);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    survey_number: `SUR-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
    old_mc_property_number: '',
    register_no: '',
    owner_name: '',
    owner_father_name: '',
    owner_phone: '',
    owner_email: '',
    aadhar_number: '',
    house_number: '',
    street_name: '',
    locality: '',
    ward_number: '',
    pincode: '',
    zone: 'A',
    property_type: '',
    construction_type: '',
    construction_year: '',
    number_of_floors: 1,
    building_permission: false,
    bp_number: '',
    bp_date: '',
    plot_area: '',
    built_up_area: '',
    carpet_area: '',
    water_connection: 0,
    water_connection_number: '',
    water_connection_date: '',
    electricity_connection: false,
    electricity_connection_number: '',
    sewage_connection: false,
    solar_panel: false,
    rain_water_harvesting: false,
    latitude: '',
    longitude: '',
    remarks: '',
    edit_comment: ''
  });

  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [propertyUse, setPropertyUse] = useState<PropertyUseDetails>({
    halls: [],
    bedrooms: [],
    kitchens: [],
    shops: [],
    bathrooms: []
  });
  const [signatureData, setSignatureData] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Load existing property data when in edit mode
  React.useEffect(() => {
    if (isEditMode && editingProperty) {
      setFormData({
        survey_number: editingProperty.survey_number || '',
        old_mc_property_number: editingProperty.old_mc_property_number || '',
        register_no: editingProperty.register_no || '',
        owner_name: editingProperty.owner_name || '',
        owner_father_name: editingProperty.owner_father_name || '',
        owner_phone: editingProperty.owner_phone || '',
        owner_email: editingProperty.owner_email || '',
        aadhar_number: editingProperty.aadhar_number || '',
        house_number: editingProperty.house_number || '',
        street_name: editingProperty.street_name || '',
        locality: editingProperty.locality || '',
        ward_number: editingProperty.ward_number?.toString() || '',
        pincode: editingProperty.pincode || '',
        zone: editingProperty.zone || 'A',
        property_type: editingProperty.property_type || '',
        construction_type: editingProperty.construction_type || '',
        construction_year: editingProperty.construction_year?.toString() || '',
        number_of_floors: editingProperty.number_of_floors || 1,
        building_permission: editingProperty.building_permission || false,
        bp_number: editingProperty.bp_number || '',
        bp_date: formatDateForInput(editingProperty.bp_date),
        plot_area: editingProperty.plot_area?.toString() || '',
        built_up_area: editingProperty.built_up_area?.toString() || '',
        carpet_area: editingProperty.carpet_area?.toString() || '',
        water_connection: editingProperty.water_connection || 0,
        water_connection_number: editingProperty.water_connection_number || '',
        water_connection_date: formatDateForInput(editingProperty.water_connection_date),
        electricity_connection: editingProperty.electricity_connection || false,
        electricity_connection_number: editingProperty.electricity_connection_number || '',
        sewage_connection: editingProperty.sewage_connection || false,
        solar_panel: editingProperty.solar_panel || false,
        rain_water_harvesting: editingProperty.rain_water_harvesting || false,
        latitude: editingProperty.latitude?.toString() || '',
        longitude: editingProperty.longitude?.toString() || '',
        remarks: editingProperty.remarks || '',
        edit_comment: ''
      });

      // Load property use details if available
      if (editingProperty.property_use_details) {
        setPropertyUse(editingProperty.property_use_details);
      }

      // Load signature if available
      if (editingProperty.signature_data) {
        setSignatureData(editingProperty.signature_data);
      }

      // Load photo if available
      if (editingProperty.owner_tenant_photo) {
        setCapturedPhoto(editingProperty.owner_tenant_photo);
      }

      // Load location if available
      if (editingProperty.latitude && editingProperty.longitude) {
        setLocation({
          lat: parseFloat(editingProperty.latitude),
          lng: parseFloat(editingProperty.longitude)
        });
      }
    }
  }, [isEditMode, editingProperty]);

  const steps = [
    'Basic Information',
    'Property Details & Permissions',
    'Area Measurements & Property Use',
    'Utilities & Connections', 
    'Location, Photos & Signature',
    'Review & Submit'
  ];

  const validateAadhar = (aadhar: string) => {
    const aadharRegex = /^\d{4}-\d{4}-\d{4}$/;
    return aadharRegex.test(aadhar);
  };

  const formatAadhar = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 4) return digits;
    if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}`;
  };

  const formatDateForInput = (dateValue: string | Date | null): string => {
    if (!dateValue) return '';
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch (error) {
      return '';
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocation({ lat, lng });
          setFormData(prev => ({
            ...prev,
            latitude: lat.toString(),
            longitude: lng.toString()
          }));
          toast.success('Location captured successfully!');
        },
        (error) => {
          console.error('Error getting location:', error);
          setFormData(prev => ({
            ...prev,
            latitude: '18.5204',
            longitude: '73.8567'
          }));
          toast.info('Demo location set (Pune, Maharashtra)');
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser.');
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    if (field === 'aadhar_number') {
      const formatted = formatAadhar(value);
      setFormData(prev => ({
        ...prev,
        [field]: formatted
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const addRoom = (roomType: keyof PropertyUseDetails) => {
    const newRoom: RoomDetail = {
      id: `${roomType}_${Date.now()}`,
      length: 0,
      width: 0,
      area: 0
    };
    setPropertyUse(prev => ({
      ...prev,
      [roomType]: [...prev[roomType], newRoom]
    }));
  };

  const updateRoom = (roomType: keyof PropertyUseDetails, index: number, field: keyof RoomDetail, value: any) => {
    setPropertyUse(prev => {
      const updatedRooms = [...prev[roomType]];
      updatedRooms[index] = {
        ...updatedRooms[index],
        [field]: value
      };
      
      // Auto-calculate area when length or width changes
      if (field === 'length' || field === 'width') {
        const room = updatedRooms[index];
        updatedRooms[index].area = room.length * room.width;
      }
      
      return {
        ...prev,
        [roomType]: updatedRooms
      };
    });
  };

  const removeRoom = (roomType: keyof PropertyUseDetails, index: number) => {
    setPropertyUse(prev => ({
      ...prev,
      [roomType]: prev[roomType].filter((_, i) => i !== index)
    }));
  };

  const capturePhoto = () => {
    // In a real app, this would open the device camera
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, 300, 200);
      ctx.fillStyle = '#666';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Demo Photo Captured', 150, 100);
      ctx.fillText(new Date().toLocaleString(), 150, 120);
      setCapturedPhoto(canvas.toDataURL());
      setPhotoDialogOpen(false);
      toast.success('Photo captured successfully!');
    }
  };

  // Signature Canvas Functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setSignatureData('');
  };

  // Enhanced validation function with detailed field checking
  const validateForm = () => {
    const errors: string[] = [];
    
    // Basic Information validation
    if (!formData.owner_name?.trim()) {
      errors.push('Property Owner Name');
    }
    if (!formData.locality?.trim()) {
      errors.push('Locality');
    }
    if (!formData.ward_number?.trim()) {
      errors.push('Ward Number');
    }
    if (!formData.pincode?.trim()) {
      errors.push('Pincode');
    }
    if (!formData.zone?.trim()) {
      errors.push('Zone');
    }
    
    // Property Details validation
    if (!formData.property_type?.trim()) {
      errors.push('Property Type');
    }
    if (!formData.construction_type?.trim()) {
      errors.push('Construction Type');
    }
    
    // Area measurements validation
    if (!formData.plot_area?.trim()) {
      errors.push('Plot Area');
    }
    if (!formData.built_up_area?.trim()) {
      errors.push('Built-up Area');
    }
    if (!formData.carpet_area?.trim()) {
      errors.push('Carpet Area');
    }
    
    // Aadhar validation if provided
    if (formData.aadhar_number && !validateAadhar(formData.aadhar_number)) {
      errors.push('Valid Aadhar Number (format: 1234-5678-9012)');
    }
    
    // Edit comment validation for post-submission edits
    const isNewSurvey = formData.survey_number === `SUR-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
    if (!isNewSurvey && (!formData.edit_comment || formData.edit_comment.trim() === '')) {
      errors.push('Edit Comment');
    }
    
    return errors;
  };

  const handleNext = () => {
    // Validation for specific steps
    if (activeStep === 0) {
      const errors = validateForm().filter(error => 
        ['Property Owner Name', 'Locality', 'Ward Number', 'Pincode', 'Zone'].includes(error)
      );
      
      if (errors.length > 0) {
        setValidationErrors(errors);
        toast.error(`Please fill required fields: ${errors.join(', ')}`);
        return;
      }
      
      if (formData.aadhar_number && !validateAadhar(formData.aadhar_number)) {
        setValidationErrors(['Valid Aadhar Number (format: 1234-5678-9012)']);
        toast.error('Please enter a valid Aadhar number in format: 1234-5678-9012');
        return;
      }
    }
    
    if (activeStep === 2) {
      const errors = validateForm().filter(error => 
        ['Plot Area', 'Built-up Area', 'Carpet Area'].includes(error)
      );
      
      if (errors.length > 0) {
        setValidationErrors(errors);
        toast.error(`Please fill required fields: ${errors.join(', ')}`);
        return;
      }
    }
    
    // Clear validation errors when moving to next step
    setValidationErrors([]);
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const saveDraft = async () => {
    setLoading(true);
    try {
      const apiData = {
        ...formData,
        ward_number: parseInt(formData.ward_number),
        construction_year: formData.construction_year ? parseInt(formData.construction_year) : null,
        plot_area: parseFloat(formData.plot_area),
        built_up_area: parseFloat(formData.built_up_area),
        carpet_area: parseFloat(formData.carpet_area),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        assessment_year: new Date().getFullYear(),
        property_use_details: propertyUse,
        signature_data: signatureData,
        owner_tenant_photo: capturedPhoto,
        property_type: formData.property_type as any,
        construction_type: formData.construction_type as any
      };

      await propertiesApi.createProperty(apiData);
      toast.success('Survey saved as draft successfully!');
    } catch (error: any) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const submitSurvey = async () => {
    setLoading(true);
    try {
      // Use enhanced validation function
      const validationErrors = validateForm();
      
      if (validationErrors.length > 0) {
        setValidationErrors(validationErrors);
        toast.error(`Please fill required fields: ${validationErrors.join(', ')}`);
        setLoading(false);
        return;
      }

      // Clear validation errors when submission succeeds
      setValidationErrors([]);

      const apiData = {
        ...formData,
        ward_number: parseInt(formData.ward_number),
        construction_year: formData.construction_year ? parseInt(formData.construction_year) : null,
        plot_area: parseFloat(formData.plot_area),
        built_up_area: parseFloat(formData.built_up_area),
        carpet_area: parseFloat(formData.carpet_area),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        assessment_year: new Date().getFullYear(),
        property_use_details: propertyUse,
        signature_data: signatureData,
        owner_tenant_photo: capturedPhoto,
        property_type: formData.property_type as any,
        construction_type: formData.construction_type as any
      };

      let response;
      
      if (isEditMode && editingProperty) {
        // Update existing property
        response = await propertiesApi.updateProperty(editingProperty.id, apiData);
        toast.success(`Property survey updated successfully! Survey ID: ${formData.survey_number}`);
        
        // Call callback if provided
        if (onEditComplete) {
          onEditComplete();
        }
      } else {
        // Create new property
        response = await propertiesApi.createProperty(apiData);
        
        if (response.data && response.data.property && response.data.property.id) {
          await propertiesApi.submitProperty(response.data.property.id);
          toast.success(`Property survey submitted successfully! Survey ID: ${formData.survey_number}`);
        }
        
        // Reset form only for new surveys
        setFormData({
          survey_number: `SUR-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
          old_mc_property_number: '',
          register_no: '',
          owner_name: '',
          owner_father_name: '',
          owner_phone: '',
          owner_email: '',
          aadhar_number: '',
          house_number: '',
          street_name: '',
          locality: '',
          ward_number: '',
          pincode: '',
          zone: 'A',
          property_type: '',
          construction_type: '',
          construction_year: '',
          number_of_floors: 1,
          building_permission: false,
          bp_number: '',
          bp_date: '',
          plot_area: '',
          built_up_area: '',
          carpet_area: '',
          water_connection: 0,
          water_connection_number: '',
          water_connection_date: '',
          electricity_connection: false,
          electricity_connection_number: '',
          sewage_connection: false,
          solar_panel: false,
          rain_water_harvesting: false,
          latitude: '',
          longitude: '',
          remarks: '',
          edit_comment: ''
        });
        setPropertyUse({
          halls: [],
          bedrooms: [],
          kitchens: [],
          shops: [],
          bathrooms: []
        });
        setSignatureData('');
        setCapturedPhoto(null);
        setActiveStep(0);
      }
    } catch (error: any) {
      console.error('Error submitting survey:', error);
      toast.error('Failed to submit survey: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const renderPropertyUseSection = () => {
    const roomTypes: { key: keyof PropertyUseDetails; label: string }[] = [
      { key: 'halls', label: 'Hall' },
      { key: 'bedrooms', label: 'Bedroom' },
      { key: 'kitchens', label: 'Kitchen' },
      { key: 'shops', label: 'Shop' },
      { key: 'bathrooms', label: 'Bathroom' }
    ];

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          📐 Property Use Calculator
        </Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          Add rooms and calculate individual areas. Length × Width = Area will be calculated automatically.
        </Alert>
        
        {roomTypes.map(({ key, label }) => (
          <Card key={key} sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">{label}s ({propertyUse[key].length})</Typography>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => addRoom(key)}
                  size="small"
                >
                  Add {label}
                </Button>
              </Box>
              
              {propertyUse[key].length > 0 && (
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>No.</TableCell>
                        <TableCell>Length (ft)</TableCell>
                        <TableCell>Width (ft)</TableCell>
                        <TableCell>Area (sq ft)</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {propertyUse[key].map((room, index) => (
                        <TableRow key={room.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={room.length}
                              onChange={(e) => updateRoom(key, index, 'length', parseFloat(e.target.value) || 0)}
                              inputProps={{ min: 0, step: 0.1 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={room.width}
                              onChange={(e) => updateRoom(key, index, 'width', parseFloat(e.target.value) || 0)}
                              inputProps={{ min: 0, step: 0.1 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {room.area.toFixed(1)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeRoom(key, index)}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3}><strong>Total {label} Area:</strong></TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {propertyUse[key].reduce((sum, room) => sum + room.area, 0).toFixed(1)} sq ft
                          </Typography>
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        ))}
        
        <Alert severity="success">
          <Typography variant="h6">
            Total Calculated Area: {
              Object.values(propertyUse).flat().reduce((sum, room) => sum + room.area, 0).toFixed(1)
            } sq ft
          </Typography>
        </Alert>
      </Box>
    );
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0: // Basic Information
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                Basic Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Survey Number *"
                value={formData.survey_number}
                onChange={(e) => handleInputChange('survey_number', e.target.value)}
                placeholder="e.g., SUR-2024-001"
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Old M.C Property Number"
                value={formData.old_mc_property_number}
                onChange={(e) => handleInputChange('old_mc_property_number', e.target.value)}
                placeholder="Previous municipal property ID"
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Register Number"
                value={formData.register_no}
                onChange={(e) => handleInputChange('register_no', e.target.value)}
                placeholder="Property register number"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Owner Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Property Owner Name *"
                value={formData.owner_name}
                onChange={(e) => handleInputChange('owner_name', e.target.value)}
                placeholder="Full name of property owner"
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Father's Name"
                value={formData.owner_father_name}
                onChange={(e) => handleInputChange('owner_father_name', e.target.value)}
                placeholder="Father's full name"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.owner_phone}
                onChange={(e) => handleInputChange('owner_phone', e.target.value)}
                placeholder="+91 9876543210"
                inputProps={{ maxLength: 15 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.owner_email}
                onChange={(e) => handleInputChange('owner_email', e.target.value)}
                placeholder="owner@example.com"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Aadhar Number (12 digits)"
                value={formData.aadhar_number}
                onChange={(e) => handleInputChange('aadhar_number', e.target.value)}
                placeholder="1234-5678-9012"
                inputProps={{ maxLength: 14 }}
                helperText="Format: 1234-5678-9012"
                error={!!(formData.aadhar_number && !validateAadhar(formData.aadhar_number))}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Property Address
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="House Number"
                value={formData.house_number}
                onChange={(e) => handleInputChange('house_number', e.target.value)}
                placeholder="123, A-1"
              />
            </Grid>
            
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Street Name"
                value={formData.street_name}
                onChange={(e) => handleInputChange('street_name', e.target.value)}
                placeholder="MG Road, Shivaji Nagar"
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Locality *"
                value={formData.locality}
                onChange={(e) => handleInputChange('locality', e.target.value)}
                placeholder="Area/Locality name"
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                label="Ward Number *"
                type="number"
                value={formData.ward_number}
                onChange={(e) => handleInputChange('ward_number', e.target.value)}
                placeholder="1-50"
                required
                inputProps={{ min: 1, max: 100 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Pincode *"
                value={formData.pincode}
                onChange={(e) => handleInputChange('pincode', e.target.value)}
                placeholder="411001"
                required
                inputProps={{ maxLength: 6 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth required>
                <InputLabel>Zone *</InputLabel>
                <Select
                  value={formData.zone}
                  onChange={(e) => handleInputChange('zone', e.target.value)}
                >
                  <MenuItem value="A">Zone A</MenuItem>
                  <MenuItem value="B">Zone B</MenuItem>
                  <MenuItem value="C">Zone C</MenuItem>
                  <MenuItem value="D">Zone D</MenuItem>
                  <MenuItem value="E">Zone E</MenuItem>
                  <MenuItem value="F">Zone F</MenuItem>
                  <MenuItem value="G">Zone G</MenuItem>
                  <MenuItem value="H">Zone H</MenuItem>
                  <MenuItem value="I">Zone I</MenuItem>
                  <MenuItem value="J">Zone J</MenuItem>
                  <MenuItem value="K">Zone K</MenuItem>
                  <MenuItem value="L">Zone L</MenuItem>
                  <MenuItem value="M">Zone M</MenuItem>
                  <MenuItem value="N">Zone N</MenuItem>
                  <MenuItem value="O">Zone O</MenuItem>
                  <MenuItem value="P">Zone P</MenuItem>
                  <MenuItem value="Q">Zone Q</MenuItem>
                  <MenuItem value="R">Zone R</MenuItem>
                  <MenuItem value="S">Zone S</MenuItem>
                  <MenuItem value="T">Zone T</MenuItem>
                  <MenuItem value="U">Zone U</MenuItem>
                  <MenuItem value="V">Zone V</MenuItem>
                  <MenuItem value="W">Zone W</MenuItem>
                  <MenuItem value="X">Zone X</MenuItem>
                  <MenuItem value="Y">Zone Y</MenuItem>
                  <MenuItem value="Z">Zone Z</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 1: // Property Details & Permissions
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                <Home sx={{ mr: 1, verticalAlign: 'middle' }} />
                Property Details & Permissions
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Property Type *</InputLabel>
                <Select
                  value={formData.property_type}
                  onChange={(e) => handleInputChange('property_type', e.target.value)}
                >
                  <MenuItem value="residential">Residential</MenuItem>
                  <MenuItem value="commercial">Commercial</MenuItem>
                  <MenuItem value="industrial">Industrial</MenuItem>
                  <MenuItem value="mixed">Mixed Use</MenuItem>
                  <MenuItem value="institutional">Institutional</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Construction Type *</InputLabel>
                <Select
                  value={formData.construction_type}
                  onChange={(e) => handleInputChange('construction_type', e.target.value)}
                >
                  <MenuItem value="rcc">R.C.C (Reinforced Cement Concrete)</MenuItem>
                  <MenuItem value="load_bearing">Load Bearing</MenuItem>
                  <MenuItem value="tin_patra">Tin Patra</MenuItem>
                  <MenuItem value="kaccha">Kaccha</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Construction Year"
                type="number"
                value={formData.construction_year}
                onChange={(e) => handleInputChange('construction_year', e.target.value)}
                placeholder="2015"
                inputProps={{ min: 1900, max: new Date().getFullYear() }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Number of Floors"
                type="number"
                value={formData.number_of_floors}
                onChange={(e) => handleInputChange('number_of_floors', parseInt(e.target.value))}
                inputProps={{ min: 1, max: 20 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Building Permission Details
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Building Permission</FormLabel>
                <RadioGroup
                  value={formData.building_permission ? 'yes' : 'no'}
                  onChange={(e) => handleInputChange('building_permission', e.target.value === 'yes')}
                >
                  <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                  <FormControlLabel value="no" control={<Radio />} label="No" />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            {formData.building_permission && (
              <>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="B.P Number"
                    value={formData.bp_number}
                    onChange={(e) => handleInputChange('bp_number', e.target.value)}
                    placeholder="Building permission number"
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="B.P Date"
                    type="date"
                    value={formData.bp_date}
                    onChange={(e) => handleInputChange('bp_date', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    helperText={isEditMode && editingProperty?.bp_date ? "Previously set date - you can update this" : ""}
                  />
                </Grid>
              </>
            )}
          </Grid>
        );

      case 2: // Area Measurements & Property Use
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                📏 Area Measurements
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                All measurements should be in square feet. Ensure accuracy as this affects tax calculation.
              </Alert>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Plot Area (sq ft) *"
                type="number"
                value={formData.plot_area}
                onChange={(e) => handleInputChange('plot_area', e.target.value)}
                placeholder="1200"
                required
                inputProps={{ min: 0, step: 0.1 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Built-up Area (sq ft) *"
                type="number"
                value={formData.built_up_area}
                onChange={(e) => handleInputChange('built_up_area', e.target.value)}
                placeholder="1000"
                required
                inputProps={{ min: 0, step: 0.1 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Carpet Area (sq ft) *"
                type="number"
                value={formData.carpet_area}
                onChange={(e) => handleInputChange('carpet_area', e.target.value)}
                placeholder="850"
                required
                inputProps={{ min: 0, step: 0.1 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 3 }} />
              {renderPropertyUseSection()}
            </Grid>
          </Grid>
        );

      case 3: // Utilities & Connections
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                🔌 Utility Connections
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Water Connection
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth>
                        <InputLabel>Water Connection Type</InputLabel>
                        <Select
                          value={formData.water_connection}
                          onChange={(e) => handleInputChange('water_connection', e.target.value)}
                        >
                          <MenuItem value={0}>No Connection</MenuItem>
                          <MenuItem value={1}>Single Connection</MenuItem>
                          <MenuItem value={2}>Double Connection</MenuItem>
                          <MenuItem value={3}>Triple Connection</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    {formData.water_connection > 0 && (
                      <>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="Water Connection Number"
                            value={formData.water_connection_number}
                            onChange={(e) => handleInputChange('water_connection_number', e.target.value)}
                            placeholder="WC123456"
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="Connection Date"
                            type="date"
                            value={formData.water_connection_date}
                            onChange={(e) => handleInputChange('water_connection_date', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            helperText={isEditMode && editingProperty?.water_connection_date ? "Previously set date - you can update this" : ""}
                          />
                        </Grid>
                      </>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.electricity_connection}
                    onChange={(e) => handleInputChange('electricity_connection', e.target.checked)}
                  />
                }
                label="Electricity Connection"
              />
              {formData.electricity_connection && (
                <TextField
                  fullWidth
                  label="Electricity Connection Number"
                  value={formData.electricity_connection_number}
                  onChange={(e) => handleInputChange('electricity_connection_number', e.target.value)}
                  placeholder="EC123456"
                  sx={{ mt: 1 }}
                />
              )}
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.sewage_connection}
                    onChange={(e) => handleInputChange('sewage_connection', e.target.checked)}
                  />
                }
                label="Sewage Connection"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.solar_panel}
                    onChange={(e) => handleInputChange('solar_panel', e.target.checked)}
                  />
                }
                label="Solar Panel"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.rain_water_harvesting}
                    onChange={(e) => handleInputChange('rain_water_harvesting', e.target.checked)}
                  />
                }
                label="Rain Water Harvesting"
              />
            </Grid>
          </Grid>
        );

      case 4: // Location, Photos & Signature
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
                Location, Photos & Signature
              </Typography>
            </Grid>
            
            {/* GPS Location */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  📍 GPS Location
                </Typography>
                
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Latitude"
                      value={formData.latitude}
                      onChange={(e) => handleInputChange('latitude', e.target.value)}
                      placeholder="18.5204"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Longitude"
                      value={formData.longitude}
                      onChange={(e) => handleInputChange('longitude', e.target.value)}
                      placeholder="73.8567"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Button
                      variant="contained"
                      startIcon={<LocationOn />}
                      onClick={getCurrentLocation}
                      fullWidth
                    >
                      Capture GPS
                    </Button>
                  </Grid>
                </Grid>
                
                {location && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    Location captured: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </Alert>
                )}
              </Paper>
            </Grid>
            
            {/* Photo Capture */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  📸 Owner/Tenant Photo
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      startIcon={<PhotoCamera />}
                      onClick={() => setPhotoDialogOpen(true)}
                      fullWidth
                      sx={{ p: 3 }}
                    >
                      {capturedPhoto ? 'Retake Photo' : 'Capture Photo'}
                    </Button>
                  </Grid>
                  
                  {capturedPhoto && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <img 
                          src={capturedPhoto} 
                          alt="Captured" 
                          style={{ maxWidth: '100%', maxHeight: '200px', border: '1px solid #ccc' }}
                        />
                        <Typography variant="caption" display="block">
                          Photo captured successfully
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>
            
            {/* Signature */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  ✍️ Digital Signature
                </Typography>
                
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => setSignatureOpen(true)}
                  sx={{ mb: 2 }}
                >
                  {signatureData ? 'Edit Signature' : 'Add Signature'}
                </Button>
                
                {signatureData && (
                  <Box sx={{ textAlign: 'center' }}>
                    <img 
                      src={signatureData} 
                      alt="Signature" 
                      style={{ border: '1px solid #ccc', maxWidth: '300px' }}
                    />
                    <Typography variant="caption" display="block">
                      Signature captured
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Remarks"
                multiline
                rows={4}
                value={formData.remarks}
                onChange={(e) => handleInputChange('remarks', e.target.value)}
                placeholder="Any additional observations or notes about the property..."
              />
            </Grid>
          </Grid>
        );

      case 5: // Review & Submit
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                Review & Submit
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                Please review all information before submitting. Once submitted, this survey will be sent for review by municipal officers.
              </Alert>
            </Grid>
            
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📋 Complete Survey Summary
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography><strong>Survey Number:</strong> {formData.survey_number}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography><strong>Owner:</strong> {formData.owner_name}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography><strong>Aadhar:</strong> {formData.aadhar_number || 'Not provided'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography><strong>Property Type:</strong> {formData.property_type}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography><strong>Construction Type:</strong> {formData.construction_type || 'Not specified'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography><strong>Ward:</strong> {formData.ward_number}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography><strong>Zone:</strong> {formData.zone}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography><strong>Plot Area:</strong> {formData.plot_area} sq ft</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography><strong>Built-up Area:</strong> {formData.built_up_area} sq ft</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography><strong>Carpet Area:</strong> {formData.carpet_area} sq ft</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography><strong>Building Permission:</strong> {formData.building_permission ? 'Yes' : 'No'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography><strong>Water Connection:</strong> {formData.water_connection > 0 ? `${formData.water_connection} connection(s)` : 'None'}</Typography>
                    </Grid>
                    {formData.bp_date && (
                      <Grid item xs={6}>
                        <Typography><strong>BP Date:</strong> {new Date(formData.bp_date).toLocaleDateString()}</Typography>
                      </Grid>
                    )}
                    {formData.water_connection_date && (
                      <Grid item xs={6}>
                        <Typography><strong>Water Connection Date:</strong> {new Date(formData.water_connection_date).toLocaleDateString()}</Typography>
                      </Grid>
                    )}
                    <Grid item xs={6}>
                      <Typography><strong>Utilities:</strong> 
                        {[
                          formData.electricity_connection && 'Electricity',
                          formData.sewage_connection && 'Sewage',
                          formData.solar_panel && 'Solar',
                          formData.rain_water_harvesting && 'RWH'
                        ].filter(Boolean).join(', ') || 'None'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography><strong>Total Property Use Area:</strong> {
                        Object.values(propertyUse).flat().reduce((sum, room) => sum + room.area, 0).toFixed(1)
                      } sq ft</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography><strong>Field Executive:</strong> {user?.first_name} {user?.last_name}</Typography>
                    </Grid>
                    
                    {/* Edit Tracking Information (Only shown in edit mode) */}
                    {isEditMode && editingProperty && (
                      <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom sx={{ mt: 2, color: 'primary.main' }}>
                          📝 Edit History
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography><strong>Total Edits:</strong> {editingProperty.edit_count || 0}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography><strong>Last Edit Date:</strong> {
                              editingProperty.last_edit_date 
                                ? new Date(editingProperty.last_edit_date).toLocaleDateString() 
                                : 'No previous edits'
                            }</Typography>
                          </Grid>
                          {editingProperty.last_edit_comment && (
                            <Grid item xs={12}>
                              <Typography><strong>Last Edit Comment:</strong></Typography>
                              <Typography variant="body2" sx={{ ml: 2, fontStyle: 'italic', color: 'text.secondary' }}>
                                "{editingProperty.last_edit_comment}"
                              </Typography>
                            </Grid>
                          )}
                          {editingProperty.last_edit_by && (
                            <Grid item xs={6}>
                              <Typography><strong>Last Edited By:</strong> {
                                editingProperty.last_edit_by === user?.id 
                                  ? 'You' 
                                  : 'Another user'
                              }</Typography>
                            </Grid>
                          )}
                        </Grid>
                      </Grid>
                    )}
                    
                    <Grid item xs={12}>
                      <Typography><strong>Completeness:</strong></Typography>
                      <Box sx={{ ml: 2 }}>
                        <Typography>✅ Basic Information</Typography>
                        <Typography>✅ Property Details</Typography>
                        <Typography>✅ Area Measurements</Typography>
                        <Typography>✅ Utility Connections</Typography>
                        <Typography>{formData.latitude ? '✅' : '⚠️'} GPS Location {!formData.latitude && '(Optional)'}</Typography>
                        <Typography>{capturedPhoto ? '✅' : '⚠️'} Owner Photo {!capturedPhoto && '(Optional)'}</Typography>
                        <Typography>{signatureData ? '✅' : '⚠️'} Digital Signature {!signatureData && '(Optional)'}</Typography>
                      </Box>
                    </Grid>
                    
                    {/* Edit Comment Field for Post-Submission Edits */}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Edit Comment (Required for post-submission edits)"
                        value={formData.edit_comment}
                        onChange={(e) => setFormData(prev => ({ ...prev, edit_comment: e.target.value }))}
                        placeholder="Please provide a reason for this edit..."
                        helperText="This comment is mandatory when editing submitted, approved, or rejected surveys"
                        required
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {isEditMode ? '✏️ Edit Property Survey' : '🏛️ Comprehensive Property Survey Form'}
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {isEditMode 
          ? `Editing survey: ${editingProperty?.survey_number}. All fields marked with * are mandatory.`
          : 'Complete digital survey form with all required fields for Maharashtra Municipal Corporation. Fields marked with * are mandatory.'
        }
      </Typography>
      
      {/* Required Fields Summary */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Required Fields Summary:</strong> The following fields are mandatory and must be filled:
        </Typography>
        <Box sx={{ mt: 1, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
          <Typography variant="body2">• Property Owner Name</Typography>
          <Typography variant="body2">• Locality</Typography>
          <Typography variant="body2">• Ward Number</Typography>
          <Typography variant="body2">• Pincode</Typography>
          <Typography variant="body2">• Zone</Typography>
          <Typography variant="body2">• Property Type</Typography>
          <Typography variant="body2">• Construction Type</Typography>
          <Typography variant="body2">• Plot Area</Typography>
          <Typography variant="body2">• Built-up Area</Typography>
          <Typography variant="body2">• Carpet Area</Typography>
        </Box>
      </Alert>
      
      {/* Validation Errors Display */}
      {validationErrors.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Please fix the following errors:</strong>
          </Typography>
          <Box sx={{ mt: 1 }}>
            {validationErrors.map((error, index) => (
              <Typography key={index} variant="body2" sx={{ ml: 2 }}>
                ❌ {error}
              </Typography>
            ))}
          </Box>
        </Alert>
      )}

      {/* Edit Mode Alert */}
      {isEditMode && editingProperty && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Edit Mode:</strong> You are editing an existing property survey. 
            {editingProperty.edit_count > 0 && (
              <> This property has been edited {editingProperty.edit_count} time(s) before.</>
            )}
            {editingProperty.survey_status !== 'draft' && (
              <> <strong>Note:</strong> Edit comment is required for post-submission edits.</>
            )}
          </Typography>
        </Alert>
      )}

      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
            <StepContent>
              <Box sx={{ mb: 3 }}>
                {renderStepContent(index)}
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  disabled={index === 0}
                  onClick={handleBack}
                >
                  Back
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Save />}
                  onClick={saveDraft}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={20} /> : 'Save Draft'}
                </Button>
                
                {index === steps.length - 1 ? (
                  <Button
                    variant="contained"
                    startIcon={<Send />}
                    onClick={submitSurvey}
                    disabled={loading}
                    color="success"
                    size="large"
                  >
                    {loading ? <CircularProgress size={20} /> : (isEditMode ? 'Update Survey' : 'Submit for Review')}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                  >
                    Next
                  </Button>
                )}
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {/* Photo Capture Dialog */}
      <Dialog open={photoDialogOpen} onClose={() => setPhotoDialogOpen(false)}>
        <DialogTitle>Capture Owner/Tenant Photo</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            In a real application, this would activate your device camera to capture a photo of the property owner or tenant.
          </Alert>
          <Button
            variant="contained"
            startIcon={<PhotoCamera />}
            onClick={capturePhoto}
            fullWidth
            sx={{ p: 2 }}
          >
            Capture Photo
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPhotoDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Signature Dialog */}
      <Dialog open={signatureOpen} onClose={() => setSignatureOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Digital Signature</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Draw your signature in the box below using mouse or touch.
          </Alert>
          <Box sx={{ textAlign: 'center', border: '2px dashed #ccc', p: 2 }}>
            <canvas
              ref={canvasRef}
              width={400}
              height={200}
              style={{ border: '1px solid #000', cursor: 'crosshair' }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={clearSignature} startIcon={<Clear />}>
            Clear
          </Button>
          <Button onClick={() => setSignatureOpen(false)}>Cancel</Button>
          <Button
            onClick={() => setSignatureOpen(false)}
            variant="contained"
            disabled={!signatureData}
          >
            Save Signature
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PropertySurveyForm; 