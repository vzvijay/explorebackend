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
  // New address fields from reverse geocoding
  address: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  ward_number_from_gps: string;
  area_from_gps: string;
  remarks: string;
  edit_comment?: string; // Comment required for post-submission edits
  sketch_photo?: string; // Hand-drawn sketch photo path
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
  const [sketchPhoto, setSketchPhoto] = useState<string | null>(null);
  const [sketchPhotoFile, setSketchPhotoFile] = useState<File | null>(null);
  
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
    // New address fields
    address: '',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    ward_number_from_gps: '',
    area_from_gps: '',
    remarks: '',
    edit_comment: ''
  });

  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [capturedAddress, setCapturedAddress] = useState<string | null>(null);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [propertyUse, setPropertyUse] = useState<PropertyUseDetails>({
    halls: [],
    bedrooms: [],
    kitchens: [],
    shops: [],
    bathrooms: []
  });
  const [signatureData, setSignatureData] = useState<string>('');

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
        // New address fields
        address: editingProperty.address || '',
        street_address: editingProperty.street_address || '',
        city: editingProperty.city || '',
        state: editingProperty.state || '',
        postal_code: editingProperty.postal_code || '',
        ward_number_from_gps: editingProperty.ward_number_from_gps || '',
        area_from_gps: editingProperty.area_from_gps || '',
        remarks: editingProperty.remarks || '',
        edit_comment: '',
        sketch_photo: editingProperty.sketch_photo || ''
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

      // Load captured address if available
      if (editingProperty.address) {
        setCapturedAddress(editingProperty.address);
      }
    }
  }, [isEditMode, editingProperty]);

  const steps = [
    'Basic Information',
    'Property Details & Permissions',
    'Area Measurements & Property Use',
    'Utilities & Connections', 
    'Location, Photos & Signature',
    'Sketch Photo Capture',
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

  // Test GPS functionality (debug function)
  const testGPSFunctionality = () => {
    console.log('🔍 Testing GPS functionality...');
    
    if (!navigator.geolocation) {
      console.error('❌ Geolocation not supported');
      toast.error('Geolocation not supported by this browser');
      return;
    }
    
    console.log('✅ Geolocation API available');
    console.log('📍 Testing basic location request...');
    
    // Simple location test
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ GPS Test Success:', position);
        toast.success('GPS test successful!');
      },
      (error) => {
        console.error('❌ GPS Test Failed:', error);
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        
        let detailedMessage = 'GPS test failed';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            detailedMessage = 'Location permission denied. Please allow location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            detailedMessage = 'Location unavailable. Check device location services.';
            break;
          case error.TIMEOUT:
            detailedMessage = 'Location request timed out.';
            break;
          default:
            detailedMessage = `GPS error: ${error.message}`;
        }
        
        toast.error(detailedMessage);
      },
      {
        enableHighAccuracy: false,  // Start with low accuracy for testing
        timeout: 10000,            // 10 second timeout for testing
        maximumAge: 300000         // Accept cached location up to 5 minutes
      }
    );
  };

  // Demo mode for testing (bypasses GPS issues)
  const enableDemoMode = () => {
    console.log('🎯 Enabling demo mode for testing...');
    
    // Set demo coordinates (Pune, Maharashtra)
    const demoLat = 18.5204;
    const demoLng = 73.8567;
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      latitude: demoLat.toString(),
      longitude: demoLng.toString()
    }));
    
    // Set location state
    setLocation({ lat: demoLat, lng: demoLng });
    
    // Simulate address lookup
    setCapturedAddress('Pune, Maharashtra, India');
    
    toast.success('Demo mode enabled! Testing with Pune coordinates.');
    console.log('✅ Demo mode enabled with coordinates:', demoLat, demoLng);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser.');
      return;
    }

    setLocationLoading(true);
    setLocationError(null);
    setCapturedAddress(null);

    // Try different accuracy modes for better compatibility
    const tryLocationCapture = (highAccuracy: boolean) => {
      const options = {
        enableHighAccuracy: highAccuracy,  // Start with requested accuracy
        timeout: highAccuracy ? 30000 : 15000,  // Shorter timeout for low accuracy
        maximumAge: highAccuracy ? 60000 : 300000  // Accept older cached locations for low accuracy
      };

      console.log(`🔍 Trying location capture with ${highAccuracy ? 'high' : 'low'} accuracy...`);
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy;

            console.log('✅ Location captured successfully:', { lat, lng, accuracy });

            // Update location state
            setLocation({ lat, lng });
            
            // Update form data with coordinates
            setFormData(prev => ({
              ...prev,
              latitude: lat.toString(),
              longitude: lng.toString()
            }));

            const accuracyText = highAccuracy ? `±${Math.round(accuracy)}m` : '±100m-1km (network)';
            toast.success(`Location captured! Accuracy: ${accuracyText}`);

            // Step 2: Address Lookup using OpenStreetMap (FREE)
            await lookupAddressFromCoordinates(lat, lng);

          } catch (error) {
            console.error('Error in location capture:', error);
            setLocationError('Failed to process location data');
            toast.error('Location captured but address lookup failed');
          } finally {
            setLocationLoading(false);
          }
        },
        (error) => {
          console.error('GPS Error:', error);
          
          if (highAccuracy && error.code === error.POSITION_UNAVAILABLE) {
            console.log('🔄 High accuracy failed, trying low accuracy...');
            // Try again with low accuracy
            tryLocationCapture(false);
            return;
          }
          
          setLocationLoading(false);
          
          let errorMessage = 'Failed to capture location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location services and try again.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location unavailable on this device. Try demo mode or manual entry.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
            default:
              errorMessage = 'Unknown location error occurred.';
          }
          
          setLocationError(errorMessage);
          toast.error(errorMessage);
        },
        options
      );
    };

    // Start with high accuracy, fall back to low accuracy
    tryLocationCapture(true);
  };

  // Manual coordinate entry with address lookup
  const handleManualCoordinateEntry = async () => {
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast.error('Please enter valid coordinates');
      return;
    }
    
    if (lat < -90 || lat > 90) {
      toast.error('Latitude must be between -90 and 90');
      return;
    }
    
    if (lng < -180 || lng > 180) {
      toast.error('Longitude must be between -180 and 180');
      return;
    }
    
    // Set location state
    setLocation({ lat, lng });
    
    // Look up address
    await lookupAddressFromCoordinates(lat, lng);
  };

  // OpenStreetMap reverse geocoding (FREE)
  const lookupAddressFromCoordinates = async (lat: number, lng: number) => {
    setGeocodingLoading(true);
    
    try {
      // OpenStreetMap Nominatim API (FREE, no API key required)
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.display_name) {
        // Parse address components
        const address = data.display_name;
        const addressParts = data.address;
        
        // Extract address components
        const streetAddress = addressParts?.road ? 
          (addressParts.house_number ? `${addressParts.house_number} ${addressParts.road}` : addressParts.road).trim() : '';
        const city = addressParts?.city || addressParts?.town || addressParts?.village || '';
        const state = addressParts?.state || '';
        const postalCode = addressParts?.postcode || '';
        const ward = addressParts?.['addr:city_district'] || addressParts?.suburb || '';
        const area = addressParts?.neighbourhood || addressParts?.suburb || '';
        
        // Update form data with address information
        setFormData(prev => ({
          ...prev,
          address: address,
          street_address: streetAddress,
          city: city,
          state: state,
          postal_code: postalCode,
          ward_number_from_gps: ward,
          area_from_gps: area
        }));
        
        // Set captured address for display
        setCapturedAddress(address);
        
        toast.success('Address detected successfully!');
        
        // Auto-fill some form fields if they're empty
        if (!formData.locality && area) {
          setFormData(prev => ({ ...prev, locality: area }));
        }
        if (!formData.city && city) {
          setFormData(prev => ({ ...prev, city: city }));
        }
        if (!formData.pincode && postalCode) {
          setFormData(prev => ({ ...prev, pincode: postalCode }));
        }
        
      } else {
        throw new Error('No address data received');
      }
      
    } catch (error) {
      console.error('Geocoding error:', error);
      setLocationError('Address lookup failed. You can enter address manually.');
      toast.warning('Address lookup failed. Please enter address manually.');
    } finally {
      setGeocodingLoading(false);
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

  const handleNext = () => {
    // Validation for specific steps
    if (activeStep === 0) {
      if (!formData.owner_name || !formData.locality || !formData.ward_number || !formData.pincode || !formData.zone) {
        toast.error('Please fill all required fields in Basic Information');
        return;
      }
      if (formData.aadhar_number && !validateAadhar(formData.aadhar_number)) {
        toast.error('Please enter a valid Aadhar number in format: 1234-5678-9012');
        return;
      }
    }
    
    if (activeStep === 2) {
      if (!formData.plot_area || !formData.built_up_area || !formData.carpet_area) {
        toast.error('Please fill all area measurements');
        return;
      }
    }
    
    if (activeStep === 4) {
      if (!formData.latitude || !formData.longitude) {
        toast.error('Please capture GPS location before proceeding');
        return;
      }
      if (!capturedPhoto) {
        toast.error('Please capture owner/tenant photo before proceeding');
        return;
      }
      if (!signatureData) {
        toast.error('Please add digital signature before proceeding');
        return;
      }
    }
    
    if (activeStep === 5) {
      if (!sketchPhoto) {
        toast.error('Please capture a sketch photo before proceeding');
        return;
      }
    }
    
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

  // Upload sketch photo to backend
  const uploadSketchPhoto = async (propertyId: string): Promise<string | null> => {
    if (!sketchPhotoFile) {
      return null;
    }

    try {
      const formData = new FormData();
      formData.append('sketch_photo', sketchPhotoFile);

      const response = await fetch(`http://localhost:3000/api/sketch-photo/${propertyId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload sketch photo');
      }

      const result = await response.json();
      toast.success('Sketch photo uploaded successfully!');
      return result.data.sketch_photo;
    } catch (error: any) {
      console.error('Error uploading sketch photo:', error);
      toast.error(`Failed to upload sketch photo: ${error.message}`);
      return null;
    }
  };

  const submitSurvey = async () => {
    setLoading(true);
    try {
      // Final validation
      if (!formData.owner_name || !formData.locality || !formData.property_type || 
          !formData.plot_area || !formData.built_up_area || !formData.carpet_area ||
          !formData.ward_number || !formData.pincode || !formData.zone) {
        toast.error('Please fill all required fields marked with *');
        setLoading(false);
        return;
      }

      // Validate edit comment for post-submission edits (if this is an edit)
      if (isEditMode && editingProperty && editingProperty.survey_status !== 'draft') {
        if (!formData.edit_comment || formData.edit_comment.trim() === '') {
          toast.error('Edit comment is required for post-submission edits');
          setLoading(false);
          return;
        }
      }

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
        
        // Upload sketch photo if there's a new one
        if (sketchPhotoFile) {
          const uploadedPhotoPath = await uploadSketchPhoto(editingProperty.id);
          if (uploadedPhotoPath) {
            // Update the property with the new sketch photo path
            await propertiesApi.updateProperty(editingProperty.id, {
              sketch_photo: uploadedPhotoPath,
              sketch_photo_captured_at: new Date().toISOString(),
              edit_comment: formData.edit_comment // Include edit comment to pass validation
            } as any); // Type assertion to bypass Property interface limitation
          }
        }
        
        // Submit the updated property for review (Always Editable System)
        console.log('🔄 Attempting to submit property:', editingProperty.id);
        try {
          const submitResponse = await propertiesApi.submitProperty(editingProperty.id);
          console.log('✅ Property submitted successfully:', submitResponse);
          toast.success(`Property survey submitted for review successfully! Survey ID: ${formData.survey_number}`);
        } catch (submitError: any) {
          console.error('❌ Error submitting property:', submitError);
          toast.error(`Failed to submit survey: ${submitError.response?.data?.message || 'Unknown error'}`);
          // Don't return here, let the edit complete
        }
        
        // Call callback if provided
        if (onEditComplete) {
          onEditComplete();
        }
      } else {
        // Create new property
        response = await propertiesApi.createProperty(apiData);
        
        if (response.data && response.data.property && response.data.property.id) {
          // Upload sketch photo if there's one
          if (sketchPhotoFile) {
            const uploadedPhotoPath = await uploadSketchPhoto(response.data.property.id);
            if (uploadedPhotoPath) {
              // Update the property with the sketch photo path
              await propertiesApi.updateProperty(response.data.property.id, {
                sketch_photo: uploadedPhotoPath,
                sketch_photo_captured_at: new Date().toISOString()
              });
            }
          }
          
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
          // New address fields
          address: '',
          street_address: '',
          city: '',
          state: '',
          postal_code: '',
          ward_number_from_gps: '',
          area_from_gps: '',
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
        setSketchPhoto(null);
        setSketchPhotoFile(null);
        setFormData(prev => ({ ...prev, sketch_photo: '' }));
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
              <FormControl fullWidth>
                <InputLabel>Construction Type</InputLabel>
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
                  📍 GPS Location & Address
                </Typography>
                
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Latitude"
                      value={formData.latitude}
                      onChange={(e) => handleInputChange('latitude', e.target.value)}
                      placeholder="18.5204"
                      disabled={locationLoading}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Longitude"
                      value={formData.longitude}
                      onChange={(e) => handleInputChange('longitude', e.target.value)}
                      placeholder="73.8567"
                      disabled={locationLoading}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="contained"
                      startIcon={<LocationOn />}
                      onClick={getCurrentLocation}
                      fullWidth
                      disabled={locationLoading}
                    >
                      {locationLoading ? (
                        <>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Capturing...
                        </>
                      ) : (
                        '📍 Capture GPS Location'
                      )}
                    </Button>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      startIcon={<LocationOn />}
                      onClick={handleManualCoordinateEntry}
                      fullWidth
                      disabled={geocodingLoading || !formData.latitude || !formData.longitude}
                    >
                      {geocodingLoading ? (
                        <>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Looking up...
                        </>
                      ) : (
                        '🔍 Lookup Address'
                      )}
                    </Button>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={testGPSFunctionality}
                      fullWidth
                      sx={{ mt: 1 }}
                    >
                      🧪 Test GPS Functionality (Debug)
                    </Button>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      color="success"
                      onClick={enableDemoMode}
                      fullWidth
                      sx={{ mt: 1 }}
                    >
                      🎯 Enable Demo Mode (Test with Pune Coordinates)
                    </Button>
                  </Grid>
                </Grid>
                
                {/* Location Status */}
                {locationLoading && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      📡 Acquiring GPS signal... Please wait (may take 30 seconds)
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Ensure you're outdoors with clear sky view for best accuracy
                    </Typography>
                  </Alert>
                )}
                
                {geocodingLoading && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      🔍 Looking up address from coordinates...
                    </Typography>
                  </Alert>
                )}
                
                {location && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>✅ GPS Location Captured Successfully!</strong>
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        cursor: 'pointer',
                        userSelect: 'none',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                      onClick={() => {
                        const coords = `${location.lat.toFixed(6)}°N, ${location.lng.toFixed(6)}°E`;
                        navigator.clipboard.writeText(coords);
                        toast.success('Coordinates copied to clipboard!');
                      }}
                    >
                      <strong>Coordinates:</strong> {location.lat.toFixed(6)}°N, {location.lng.toFixed(6)}°E
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Click coordinates to copy to clipboard
                    </Typography>
                  </Alert>
                )}
                
                {/* Captured Address Display */}
                {capturedAddress && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>🏠 Detected Address:</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                      {capturedAddress}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Address components have been auto-filled in the form above
                    </Typography>
                  </Alert>
                )}
                
                {/* Error Display */}
                {locationError && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>⚠️ Location Error:</strong>
                    </Typography>
                    <Typography variant="body2">
                      {locationError}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      You can still enter coordinates and address manually
                    </Typography>
                  </Alert>
                )}
                
                {/* Manual Entry Instructions */}
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    <strong>💡 Location Capture Instructions:</strong>
                  </Typography>
                  <Typography variant="body2">
                    • <strong>Mobile Devices:</strong> Use built-in GPS for high accuracy (±3-10m)
                  </Typography>
                  <Typography variant="body2">
                    • <strong>Desktop Browsers:</strong> Uses network location (less accurate)
                  </Typography>
                  <Typography variant="body2">
                    • <strong>Manual Entry:</strong> You can always enter coordinates manually
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    GPS works best outdoors with clear sky view. Address lookup uses free OpenStreetMap service.
                  </Typography>
                </Alert>
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

      case 5: // Sketch Photo Capture
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                🎨 Sketch Photo Capture
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                Draw your hand-drawn sketch on paper, then capture it with your device camera. This sketch will be part of your survey documentation.
              </Alert>
            </Grid>
            
            {/* Sketch Photo Capture */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  📸 Hand-Drawn Sketch Photo
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ textAlign: 'center', p: 3, border: '2px dashed #ccc', borderRadius: 2 }}>
                      <Typography variant="body1" gutterBottom>
                        📝 Instructions:
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        1. Draw your property sketch on paper
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        2. Include property boundaries, measurements
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        3. Take a clear photo of your sketch
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        4. Upload the photo below
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      {sketchPhoto ? (
                        <Box>
                          <img 
                            src={sketchPhoto} 
                            alt="Sketch Photo" 
                            style={{ 
                              maxWidth: '100%', 
                              maxHeight: '300px', 
                              border: '2px solid #4caf50',
                              borderRadius: '8px'
                            }}
                          />
                          <Typography variant="caption" display="block" sx={{ mt: 1, color: 'success.main' }}>
                            ✅ Sketch photo captured successfully
                          </Typography>
                          <Button
                            variant="outlined"
                            color="secondary"
                            onClick={() => {
                              setSketchPhoto(null);
                              setSketchPhotoFile(null);
                            }}
                            sx={{ mt: 1 }}
                          >
                            Remove Photo
                          </Button>
                        </Box>
                      ) : (
                        <Box>
                          <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="sketch-photo-input"
                            type="file"
                            capture="environment"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleSketchPhotoCapture(file);
                              }
                            }}
                          />
                          <label htmlFor="sketch-photo-input">
                            <Button
                              variant="contained"
                              color="primary"
                              component="span"
                              startIcon={<PhotoCamera />}
                              sx={{ p: 3, fontSize: '1.1rem' }}
                              fullWidth
                            >
                              📸 Capture Sketch Photo
                            </Button>
                          </label>
                          <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                            Tap to open camera or select from gallery
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </Grid>
                
                {sketchPhoto && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Sketch Photo Ready!</strong> Your hand-drawn sketch has been captured and will be included in the survey.
                    </Typography>
                  </Alert>
                )}
              </Paper>
            </Grid>
          </Grid>
        );

      case 6: // Review & Submit
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
                        <Typography>{sketchPhoto ? '✅' : '⚠️'} Sketch Photo {!sketchPhoto && '(Required)'}</Typography>
                      </Box>
                    </Grid>
                    
                    {/* Sketch Photo Information */}
                    {sketchPhoto && (
                      <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom sx={{ mt: 2, color: 'primary.main' }}>
                          🎨 Sketch Photo Captured
                        </Typography>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <img 
                            src={sketchPhoto} 
                            alt="Sketch Photo" 
                            style={{ 
                              maxWidth: '100%', 
                              maxHeight: '200px', 
                              border: '1px solid #4caf50',
                              borderRadius: '8px'
                            }}
                          />
                          <Typography variant="body2" sx={{ mt: 1, color: 'success.main' }}>
                            ✅ Hand-drawn sketch photo ready for submission
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    
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

  // Handle immediate sketch photo upload after capture
  const handleSketchPhotoCapture = async (file: File) => {
    setSketchPhotoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setSketchPhoto(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Show success message
    toast.success('Sketch photo captured successfully! It will be uploaded when you submit the survey.');
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