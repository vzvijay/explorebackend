import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  FormLabel,
  Paper,
  Stepper,
  Step,
  StepLabel,

  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  LocationOn,
  Clear,
  PhotoCamera,
  Edit,
  Save,
  Send,
  Person,
  Home,
  Add,
  Delete
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { Base64ImageData } from '../types';
import { propertiesApi } from '../services/api';


// Interfaces
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
  address: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  ward_number_from_gps: string;
  area_from_gps: string;
  remarks: string;
  edit_comment: string;
}

interface PropertyUseDetails {
  halls: Room[];
  bedrooms: Room[];
  kitchens: Room[];
  shops: Room[];
  bathrooms: Room[];
}

interface Room {
  id: string;
  length: number;
  width: number;
  area: number;
}

interface PropertySurveyFormProps {
  editMode?: boolean;
  propertyToEdit?: any;
  onEditComplete?: () => void;
}

// Main Component
const PropertySurveyForm: React.FC<PropertySurveyFormProps> = ({ 
  editMode = false, 
  propertyToEdit = null, 
  onEditComplete 
}) => {


  // Constants
  const steps = [
    'Basic Information',
    'Property Details & Permissions', 
    'Area Measurements & Property Use',
    'Utilities & Connections',
    'Location, Photos & Signature',
    'Sketch Photo Capture',
    'Review & Submit'
  ];

  // State variables
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isEditMode] = useState(editMode);
  const [editingProperty] = useState(propertyToEdit);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [sketchPhotoDialogOpen, setSketchPhotoDialogOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [sketchPhoto, setSketchPhoto] = useState<string | null>(null);
  const [sketchPhotoBase64, setSketchPhotoBase64] = useState<Base64ImageData | null>(null);
  const [photoCapturing, setPhotoCapturing] = useState(false);
  const [sketchPhotoCapturing, setSketchPhotoCapturing] = useState(false);
  const [signatureData, setSignatureData] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Form data state
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

  // GPS and location state
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [capturedAddress, setCapturedAddress] = useState<string | null>(null);
  const [geocodingLoading, setGeocodingLoading] = useState(false);

  // Property use state
  const [propertyUse, setPropertyUse] = useState<PropertyUseDetails>({
    halls: [],
    bedrooms: [],
    kitchens: [],
    shops: [],
    bathrooms: []
  });

  // Data conversion helper functions for edit mode
  const safeDateConversion = (isoDate: string | null | undefined): string => {
    if (!isoDate) return '';
    try {
      return new Date(isoDate).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const safeNumberToString = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined) return '';
    return value.toString();
  };

  const safeBooleanConversion = (value: any): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    if (typeof value === 'number') return value !== 0;
    return false;
  };

  // useEffect to populate form data when editing property
  useEffect(() => {
    if (editingProperty && isEditMode) {
      console.log('🔄 Populating form with editing property data:', editingProperty);
      
      // Populate form data with fetched property data
      setFormData(prev => ({
        ...prev,
        // Basic information fields
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
        ward_number: safeNumberToString(editingProperty.ward_number),
        pincode: editingProperty.pincode || '',
        zone: editingProperty.zone || 'A',
        property_type: editingProperty.property_type || '',
        construction_type: editingProperty.construction_type || '',
        construction_year: safeNumberToString(editingProperty.construction_year),
        number_of_floors: editingProperty.number_of_floors || 1,
        building_permission: safeBooleanConversion(editingProperty.building_permission),
        bp_number: editingProperty.bp_number || '',
        bp_date: safeDateConversion(editingProperty.bp_date),
        plot_area: safeNumberToString(editingProperty.plot_area),
        built_up_area: safeNumberToString(editingProperty.built_up_area),
        carpet_area: safeNumberToString(editingProperty.carpet_area),
        water_connection: editingProperty.water_connection || 0,
        water_connection_number: editingProperty.water_connection_number || '',
        water_connection_date: safeDateConversion(editingProperty.water_connection_date),
        electricity_connection: safeBooleanConversion(editingProperty.electricity_connection),
        electricity_connection_number: editingProperty.electricity_connection_number || '',
        sewage_connection: safeBooleanConversion(editingProperty.sewage_connection),
        solar_panel: safeBooleanConversion(editingProperty.solar_panel),
        rain_water_harvesting: safeBooleanConversion(editingProperty.rain_water_harvesting),
        latitude: safeNumberToString(editingProperty.latitude),
        longitude: safeNumberToString(editingProperty.longitude),
        address: editingProperty.address || '',
        street_address: editingProperty.street_address || '',
        city: editingProperty.city || '',
        state: editingProperty.state || '',
        postal_code: editingProperty.postal_code || '',
        ward_number_from_gps: editingProperty.ward_number_from_gps || '',
        area_from_gps: editingProperty.area_from_gps || '',
        remarks: editingProperty.remarks || '',
        edit_comment: editingProperty.edit_comment || ''
      }));

      // Set GPS location state if coordinates exist
      if (editingProperty.latitude && editingProperty.longitude) {
        const lat = parseFloat(editingProperty.latitude);
        const lng = parseFloat(editingProperty.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          setLocation({ lat, lng });
          console.log('📍 GPS location set from editing property:', { lat, lng });
        }
      }

      // Set address from GPS data if available
      if (editingProperty.address) {
        setCapturedAddress(editingProperty.address);
        console.log('🏠 Address set from editing property:', editingProperty.address);
      }

      // Set property use details if available
      if (editingProperty.property_use_details) {
        setPropertyUse(editingProperty.property_use_details);
        console.log('🏗️ Property use details set from editing property:', editingProperty.property_use_details);
      }

      // Set signature data if available
      if (editingProperty.signature_data) {
        setSignatureData(editingProperty.signature_data);
        console.log('✍️ Signature data set from editing property');
      }

      // Set owner photo if available
      if (editingProperty.owner_tenant_photo) {
        setCapturedPhoto(editingProperty.owner_tenant_photo);
        console.log('📸 Owner photo set from editing property');
      }

      // Set sketch photo if available
      if (editingProperty.sketch_photo) {
        // ✅ SIMPLIFIED: sketch_photo is now a simple base64 string like owner_tenant_photo
        // Convert base64 string to displayable format for edit mode
        const dataUrl = `data:image/png;base64,${editingProperty.sketch_photo}`;
        setSketchPhoto(dataUrl);
        // Create Base64ImageData structure for compatibility
        setSketchPhotoBase64({
          data: editingProperty.sketch_photo,
          size: editingProperty.sketch_photo.length,
          type: 'image/png',
          filename: 'sketch_photo.png'
        });
        console.log('🎨 Sketch photo set from editing property (simplified)');
      }

      console.log('✅ Form data populated successfully for edit mode');
    }
  }, [editingProperty, isEditMode]);


  // Utility functions
  const validateAadhar = (aadhar: string): boolean => {
    const aadharRegex = /^\d{4}-\d{4}-\d{4}$/;
    return aadharRegex.test(aadhar);
  };

  const formatAadharNumber = (value: string): string => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Limit to 12 digits
    const limitedDigits = digits.slice(0, 12);
    
    // Format as 1234-5678-9012
    if (limitedDigits.length <= 4) {
      return limitedDigits;
    } else if (limitedDigits.length <= 8) {
      return `${limitedDigits.slice(0, 4)}-${limitedDigits.slice(4)}`;
    } else {
      return `${limitedDigits.slice(0, 4)}-${limitedDigits.slice(4, 8)}-${limitedDigits.slice(8)}`;
    }
  };

  const handleAadharChange = (value: string) => {
    const formatted = formatAadharNumber(value);
    handleInputChange('aadhar_number', formatted);
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.owner_name.trim()) errors.push('Property Owner Name');
    if (!formData.locality.trim()) errors.push('Locality');
    if (!formData.ward_number.trim()) errors.push('Ward Number');
    if (!formData.pincode.trim()) errors.push('Pincode');
    if (!formData.zone.trim()) errors.push('Zone');
    if (!formData.property_type.trim()) errors.push('Property Type');
    if (!formData.construction_type.trim()) errors.push('Construction Type');
    if (!formData.plot_area.trim()) errors.push('Plot Area');
    if (!formData.built_up_area.trim()) errors.push('Built-up Area');
    if (!formData.carpet_area.trim()) errors.push('Carpet Area');
    
    return errors;
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Enhanced GPS implementation with mobile-specific optimizations
  const getCurrentLocation = () => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser.');
      return;
    }

    // Check if we're on HTTPS (required for geolocation)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      toast.error('GPS requires HTTPS connection. Please access via https://');
      return;
    }

    console.log('🔍 Starting GPS location capture...');
    console.log('Browser:', navigator.userAgent);
    console.log('Protocol:', window.location.protocol);
    console.log('Hostname:', window.location.hostname);

    setLocationLoading(true);
    setLocationError(null);
    setCapturedAddress(null);

    // ✅ FIXED: Always attempt GPS capture directly (like your earlier working code)
    // This forces the permission popup to appear
    performLocationRequest();
  };

  const performLocationRequest = () => {
    // Progressive timeout strategy - start with longer timeout for mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    // iOS Safari often needs more time
    const timeout = isIOS ? 20000 : (isMobile ? 15000 : 10000);
    
    console.log(`📱 Device type - Mobile: ${isMobile}, iOS: ${isIOS}, Timeout: ${timeout}ms`);

    // First attempt with high accuracy
      navigator.geolocation.getCurrentPosition(
      (position) => {
        handleLocationSuccess(position, 'high-accuracy');
      },
      (error) => {
        console.warn('🔄 High accuracy failed, trying low accuracy mode...');
        console.error('High accuracy error:', error.code, error.message);
        
        // Fallback to low accuracy mode
        navigator.geolocation.getCurrentPosition(
          (position) => {
            handleLocationSuccess(position, 'low-accuracy');
          },
          (error) => {
            handleLocationError(error);
          },
          {
            enableHighAccuracy: false,  // Use network/WiFi positioning
            timeout: timeout,
            maximumAge: 60000          // Accept 1-minute old cached location
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: timeout,
        maximumAge: 0
      }
    );
  };

  const handleLocationSuccess = (position: any, mode: string) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy;
    const timestamp = new Date(position.timestamp);

    console.log(`✅ GPS position captured (${mode}):`, { 
      lat, 
      lng, 
      accuracy: `${Math.round(accuracy)}m`,
      timestamp: timestamp.toISOString(),
      altitude: position.coords.altitude,
      heading: position.coords.heading,
      speed: position.coords.speed
    });

    // Clear any previous errors
    setLocationError(null);

            // Update location state
            setLocation({ lat, lng });
            
            // Update form data with coordinates
            setFormData(prev => ({
              ...prev,
              latitude: lat.toString(),
      longitude: lng.toString(),
      gps_accuracy: accuracy ? Math.round(accuracy).toString() : 'unknown',
      gps_timestamp: timestamp.toISOString()
    }));

    // Determine accuracy description
    let accuracyText;
    if (accuracy) {
      if (accuracy <= 10) {
        accuracyText = `±${Math.round(accuracy)}m (Excellent)`;
      } else if (accuracy <= 50) {
        accuracyText = `±${Math.round(accuracy)}m (Good)`;
      } else if (accuracy <= 100) {
        accuracyText = `±${Math.round(accuracy)}m (Fair)`;
      } else {
        accuracyText = `±${Math.round(accuracy)}m (Poor)`;
      }
    } else {
      accuracyText = 'Unknown accuracy';
    }

    toast.success(`📍 GPS Location captured! Accuracy: ${accuracyText} (${mode})`);

    // Address lookup
    lookupAddressFromCoordinates(lat, lng);
    
            setLocationLoading(false);
  };

  const handleLocationError = (error: any) => {
    console.error('❌ GPS capture failed:', error.code, error.message);
    
    let errorMessage = 'Failed to capture GPS location';
    let troubleshootingTip = '';
    
    if (error.code) {
          switch (error.code) {
            case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied';
          troubleshootingTip = 'Please allow location access when prompted, or enable it in browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location services unavailable';
          troubleshootingTip = 'Please check if GPS/Location Services are enabled on your device.';
              break;
            case error.TIMEOUT:
          errorMessage = 'GPS request timed out';
          troubleshootingTip = 'Please ensure you have a clear view of the sky or move to an area with better signal.';
              break;
            default:
          errorMessage = `GPS error: ${error.message || 'Unknown error'}`;
          troubleshootingTip = 'Please try again or use manual coordinate entry.';
      }
          }
          
    setLocationError(`${errorMessage}. ${troubleshootingTip}`);
          toast.error(errorMessage);
    
    setLocationLoading(false);
  };

  // Enhanced address lookup with error handling and retries
  const lookupAddressFromCoordinates = async (lat: number, lng: number) => {
    setGeocodingLoading(true);
    
    let retryCount = 0;
    const maxRetries = 3;
    
    const attemptLookup = async () => {
      try {
        // Use different zoom levels based on retry count
        const zoom = retryCount === 0 ? 18 : retryCount === 1 ? 16 : 14;
        
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=${zoom}&addressdetails=1&accept-language=en`;
        
        console.log(`🌍 Address lookup attempt ${retryCount + 1}, URL:`, url);
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'YourAppName/1.0' // Nominatim requires User-Agent
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📍 Geocoding response:', data);
        
        if (data.display_name) {
          processAddressData(data);
          return true;
        } else {
          throw new Error('No address found in response');
        }
      } catch (error) {
        console.error(`Geocoding attempt ${retryCount + 1} failed:`, error);
        
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`Retrying in 1 second... (attempt ${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return attemptLookup();
        } else {
          throw error;
        }
      }
    };
    
    try {
      await attemptLookup();
    } catch (error) {
      console.error('All geocoding attempts failed:', error);
      toast.error('Failed to lookup address. Location coordinates saved successfully.');
      
      // Set a basic address format
      setCapturedAddress(`Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      setFormData(prev => ({
        ...prev,
        address: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
      }));
    } finally {
      setGeocodingLoading(false);
    }
  };



  const processAddressData = (data: any) => {
    const address = data.display_name;
    const addressParts = data.address;
    
    console.log('📍 Processing address data:', addressParts);
    
    // Extract address components with fallbacks
    const streetNumber = addressParts?.house_number || '';
    const streetName = addressParts?.road || addressParts?.street || '';
    const streetAddress = streetNumber && streetName ? 
      `${streetNumber}, ${streetName}` : 
      (streetName || addressParts?.pedestrian || addressParts?.path || '');
    
    const neighborhood = addressParts?.neighbourhood || addressParts?.suburb || '';
    const city = addressParts?.city || addressParts?.town || addressParts?.village || 
               addressParts?.municipality || addressParts?.county || '';
    const state = addressParts?.state || addressParts?.province || 
                 addressParts?.region || '';
    const country = addressParts?.country || '';
    const postalCode = addressParts?.postcode || '';
    
    // Indian specific fields
    const wardNumber = addressParts?.['addr:postcode'] || addressParts?.postcode || '';
    const area = neighborhood || addressParts?.residential || '';
    
    setCapturedAddress(address);
    
    setFormData(prev => ({
      ...prev,
      address,
      street_address: streetAddress,
      neighborhood,
      city,
      state,
      country,
      postal_code: postalCode,
      ward_number_from_gps: wardNumber,
      area_from_gps: area
    }));
    
    toast.success('📍 Address lookup completed successfully!');
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

  // Test GPS with detailed diagnostics
  const testGPSFunctionality = () => {
    console.log('🔍 Testing GPS functionality...');
    console.log('Navigator geolocation support:', !!navigator.geolocation);
    console.log('Current protocol:', window.location.protocol);
    console.log('User agent:', navigator.userAgent);
    
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by this browser');
      return;
    }
    
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      toast.error('GPS requires HTTPS. Current protocol: ' + window.location.protocol);
      return;
    }
    
    toast.info('Testing GPS... Check console for detailed logs');
    
    // Test with very permissive settings
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ GPS Test Success:', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          timestamp: new Date(position.timestamp).toISOString()
        });
        toast.success(`GPS test successful! Accuracy: ±${Math.round(position.coords.accuracy)}m`);
      },
      (error) => {
        console.error('❌ GPS Test Failed:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          PERMISSION_DENIED: error.PERMISSION_DENIED,
          POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
          TIMEOUT: error.TIMEOUT
        });
        toast.error(`GPS test failed: ${error.message} (Code: ${error.code})`);
      },
      {
        enableHighAccuracy: false,  // Less demanding for testing
        timeout: 30000,             // Longer timeout for testing
        maximumAge: 300000          // Accept 5-minute old cache for testing
      }
    );
  };

  // Debug information helper
  const getGPSDebugInfo = () => {
    const info = {
      geolocationSupport: !!navigator.geolocation,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      userAgent: navigator.userAgent,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
      isAndroid: /Android/i.test(navigator.userAgent),
      permissionsAPI: 'permissions' in navigator,
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 GPS Debug Info:', info);
    return info;
  };

  // Enhanced demo mode with more realistic behavior
  const enableDemoMode = () => {
    const demoLocations = [
      { lat: 18.5204, lng: 73.8567, name: 'Pune, Maharashtra, India' },
      { lat: 19.0760, lng: 72.8777, name: 'Mumbai, Maharashtra, India' },
      { lat: 12.9716, lng: 77.5946, name: 'Bangalore, Karnataka, India' },
      { lat: 28.7041, lng: 77.1025, name: 'Delhi, India' }
    ];
    
    const randomLocation = demoLocations[Math.floor(Math.random() * demoLocations.length)];
    
    // Add some random variation to make it more realistic
    const latVariation = (Math.random() - 0.5) * 0.01; // ±0.005 degrees (~500m)
    const lngVariation = (Math.random() - 0.5) * 0.01;
    
    const finalLat = randomLocation.lat + latVariation;
    const finalLng = randomLocation.lng + lngVariation;
    
      setFormData(prev => ({
        ...prev,
      latitude: finalLat.toString(),
      longitude: finalLng.toString(),
      gps_accuracy: '25',
      gps_timestamp: new Date().toISOString()
    }));
    
    setLocation({ lat: finalLat, lng: finalLng });
    setCapturedAddress(randomLocation.name);
    
    toast.success(`🎭 Demo mode enabled! Using ${randomLocation.name} with realistic GPS variation.`);
    
    // Simulate address lookup delay
    setTimeout(() => {
      lookupAddressFromCoordinates(finalLat, finalLng);
    }, 1000);
  };


  // Photo capture functions
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const capturePhoto = async () => {
    try {
      setPhotoCapturing(true);
      toast.info('Opening camera... Please wait.');
      
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: isMobileDevice() ? 'environment' : 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        
        const video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;
        video.play();
        
        await new Promise((resolve) => {
          video.onloadedmetadata = () => resolve(true);
        });
        
        toast.info('Camera ready! Position the person in frame and click capture.');
        
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert to data URL with 70% compression
          const photoDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setCapturedPhoto(photoDataUrl);
          
          stream.getTracks().forEach(track => track.stop());
          
          setPhotoDialogOpen(false);
          toast.success('Photo captured successfully from camera!');
        }
      } else {
        toast.info('Camera not supported. Opening file upload...');
        openFileInput();
      }
    } catch (error) {
      console.error('Camera access error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          toast.error('Camera access denied. Please allow camera permissions or use file upload.');
          openFileInput();
        } else if (error.name === 'NotFoundError') {
          toast.error('No camera found. Please use file upload.');
          openFileInput();
        } else {
          toast.error('Camera error. Please use file upload.');
          openFileInput();
        }
      } else {
        toast.error('Camera error. Please use file upload.');
        openFileInput();
      }
    } finally {
      setPhotoCapturing(false);
    }
  };

  const openFileInput = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    if (isMobileDevice()) {
      input.capture = 'environment';
    }
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error('File too large. Please select an image under 10MB.');
          return;
        }
        
        if (!file.type.startsWith('image/')) {
          toast.error('Please select a valid image file.');
          return;
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          setCapturedPhoto(result);
          setPhotoDialogOpen(false);
          toast.success('Photo uploaded successfully!');
        };
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  };

  const clearCapturedPhoto = () => {
    setCapturedPhoto(null);
    toast.info('Photo cleared. Please capture a new photo.');
  };

  // Sketch photo functions
  const closeSketchPhotoDialog = () => {
    setSketchPhotoDialogOpen(false);
  };

  const captureSketchPhoto = async () => {
    try {
      setSketchPhotoCapturing(true);
      toast.info('Opening camera for sketch... Please wait.');
      
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        
        const video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;
        video.play();
        
        await new Promise((resolve) => {
          video.onloadedmetadata = () => resolve(true);
        });
        
        toast.info('Camera ready! Position your sketch in frame and click capture.');
        
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert to data URL with 70% compression
          const sketchDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setSketchPhoto(sketchDataUrl);
          
          // Create Base64ImageData object
          const base64Data: Base64ImageData = {
            data: sketchDataUrl.split(',')[1],
            type: "image/jpeg",
            size: sketchDataUrl.length
          };
          setSketchPhotoBase64(base64Data);
          
          stream.getTracks().forEach(track => track.stop());
          
          setSketchPhotoDialogOpen(false);
          toast.success('Sketch photo captured successfully!');
        }
      } else {
        toast.error('Camera not supported on this device.');
      }
    } catch (error) {
      console.error('Sketch camera error:', error);
      toast.error('Failed to open camera for sketch capture.');
    } finally {
      setSketchPhotoCapturing(false);
    }
  };

  // ✅ SIMPLIFIED: Sketch photo is now handled directly in property data like owner_tenant_photo
  // No separate API call needed - sketch_photo is included in apiData


  // Signature functions - Enhanced Implementation
  const openSignatureDialog = () => {
    setSignatureOpen(true);
    
    // Clear canvas and set up drawing context when dialog opens
    setTimeout(() => {
    const canvas = canvasRef.current;
    if (canvas) {
        console.log('✍️ Signature: Setting up canvas...');
        
        // Set canvas dimensions
        canvas.width = 400;
        canvas.height = 200;
        
      const ctx = canvas.getContext('2d');
      if (ctx) {
          // Clear the canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Set default drawing style
        ctx.strokeStyle = '#000000'; // Black color
          ctx.lineWidth = 3; // Line thickness
        ctx.lineCap = 'round'; // Rounded line ends
        ctx.lineJoin = 'round'; // Rounded line joins
          
          console.log('✍️ Signature: Canvas setup complete');
        }
      }
    }, 100);
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
    toast.info('Signature cleared.');
  };

  const clearSignatureFromForm = () => {
    setSignatureData('');
    toast.info('Signature cleared from form.');
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('✍️ Signature: Starting to draw...');
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Set drawing style
        ctx.strokeStyle = '#000000'; // Black color
        ctx.lineWidth = 3; // Line thickness
        ctx.lineCap = 'round'; // Rounded line ends
        ctx.lineJoin = 'round'; // Rounded line joins
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        console.log('✍️ Signature: Starting at position:', x, y);
        
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    console.log('✍️ Signature: Stopping drawing...');
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.closePath();
      }
    }
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Check if anything was drawn
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hasContent = imageData.data.some(pixel => pixel !== 0);
        
        if (!hasContent) {
          toast.error('Please draw a signature before saving');
          return;
        }
        
        const dataURL = canvas.toDataURL();
        setSignatureData(dataURL);
        setSignatureOpen(false);
        toast.success('Signature saved successfully!');
        console.log('✍️ Signature: Saved successfully');
      }
    }
  };

  // Touch events for mobile - Enhanced Implementation
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    console.log('✍️ Signature: Touch start');
    
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    console.log('✍️ Signature: Touch end');
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.closePath();
      }
    }
  };

  // Property use management
  const addRoom = (roomType: keyof PropertyUseDetails) => {
    const newRoom: Room = {
      id: Date.now().toString(),
      length: 0,
      width: 0,
      area: 0
    };
    
    setPropertyUse(prev => ({
      ...prev,
      [roomType]: [...prev[roomType], newRoom]
    }));
  };

  const updateRoom = (roomType: keyof PropertyUseDetails, index: number, field: keyof Room, value: number) => {
    setPropertyUse(prev => {
      const updatedRooms = [...prev[roomType]];
      updatedRooms[index] = { ...updatedRooms[index], [field]: value };
      
      // Recalculate area
      if (field === 'length' || field === 'width') {
        updatedRooms[index].area = updatedRooms[index].length * updatedRooms[index].width;
      }
      
      return { ...prev, [roomType]: updatedRooms };
    });
  };

  const removeRoom = (roomType: keyof PropertyUseDetails, index: number) => {
    setPropertyUse(prev => ({
      ...prev,
      [roomType]: prev[roomType].filter((_, i) => i !== index)
    }));
  };


  // Stepper navigation
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
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
      if (!sketchPhoto && !sketchPhotoBase64) {
        toast.error('Please capture a sketch photo before proceeding');
        return;
      }
    }
    
    // Clear validation errors when moving to next step
    setValidationErrors([]);
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  // Form submission functions
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
        sketch_photo: sketchPhotoBase64?.data || null,
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
      const validationErrors = validateForm();
      
      if (validationErrors.length > 0) {
        setValidationErrors(validationErrors);
        toast.error(`Please fill required fields: ${validationErrors.join(', ')}`);
        setLoading(false);
        return;
      }

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
        sketch_photo: sketchPhotoBase64?.data || null,
        property_type: formData.property_type as any,
        construction_type: formData.construction_type as any
      };

      // Add debugging
      console.log('📤 Sending API data:', JSON.stringify(apiData, null, 2));
      console.log('📤 Key fields validation:');
      console.log('- ward_number:', apiData.ward_number, typeof apiData.ward_number);
      console.log('- pincode:', apiData.pincode, typeof apiData.pincode);
      console.log('- plot_area:', apiData.plot_area, typeof apiData.plot_area);
      console.log('- built_up_area:', apiData.built_up_area, typeof apiData.built_up_area);
      console.log('- carpet_area:', apiData.carpet_area, typeof apiData.carpet_area);

      let response;
      
      if (isEditMode && editingProperty) {
        response = await propertiesApi.updateProperty(editingProperty.id, apiData);
        toast.success(`Property survey updated successfully! Survey ID: ${formData.survey_number}`);
        
        // ✅ SIMPLIFIED: Sketch photo is now handled directly in property data
        // No separate API call needed - sketch_photo is included in apiData
        
        try {
          const submitResponse = await propertiesApi.submitProperty(editingProperty.id);
          console.log('✅ Property submitted successfully:', submitResponse);
          toast.success(`Property survey submitted for review successfully! Survey ID: ${formData.survey_number}`);
        } catch (submitError: any) {
          console.error('❌ Error submitting property:', submitError);
          toast.error(`Failed to submit survey: ${submitError.response?.data?.message || 'Unknown error'}`);
        }
        
        if (onEditComplete) {
          onEditComplete();
        }
      } else {
        response = await propertiesApi.createProperty(apiData);
        
        // ✅ SIMPLIFIED: Sketch photo is now handled directly in property data
        // No separate API call needed - sketch_photo is included in apiData
        
        if (response.data && response.data.property && response.data.property.id) {
          await propertiesApi.submitProperty(response.data.property.id);
          toast.success(`Property survey submitted successfully! Survey ID: ${formData.survey_number}`);
        }
        
        // Reset form for new surveys
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
        setSketchPhotoBase64(null);
        setActiveStep(0);
      }
    } catch (error: any) {
      console.error('Error submitting survey:', error);
      console.error('Full error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || 'Unknown error';
      const validationErrors = error.response?.data?.errors;
      
      if (validationErrors && Array.isArray(validationErrors)) {
        const errorDetails = validationErrors.map((err: any) => err.msg || err.message).join(', ');
        toast.error(`Validation errors: ${errorDetails}`);
      } else {
        toast.error('Failed to submit survey: ' + errorMessage);
      }
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


  // Function to render step content
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
                onChange={(e) => handleAadharChange(e.target.value)}
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
                  
                  {/* Debug Button */}
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => {
                        getGPSDebugInfo();
                        toast.info('GPS debug info logged to console');
                      }}
                      fullWidth
                    >
                      🐛 Debug GPS
                    </Button>
                  </Grid>
                  
                  {/* GPS Testing Buttons */}
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      color="info"
                      onClick={testGPSFunctionality}
                      fullWidth
                      sx={{ mt: 1 }}
                    >
                      🧪 Test GPS
                    </Button>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      color="success"
                      onClick={enableDemoMode}
                      fullWidth
                      sx={{ mt: 1 }}
                    >
                      🎯 Demo Mode
                    </Button>
                  </Grid>
                </Grid>
                
                {/* Manual GPS Input */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    📍 Manual GPS Input (if automatic fails)
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Manual Latitude"
                        value={formData.latitude}
                        onChange={(e) => handleInputChange('latitude', e.target.value)}
                        placeholder="18.5204"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Manual Longitude"
                        value={formData.longitude}
                        onChange={(e) => handleInputChange('longitude', e.target.value)}
                        placeholder="73.8567"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleManualCoordinateEntry}
                        disabled={!formData.latitude || !formData.longitude}
                        fullWidth
                        sx={{ height: '40px' }}
                      >
                        🔍 Lookup Address
                      </Button>
                    </Grid>
                  </Grid>
                </Grid>
              </Paper>
                </Grid>
                
                {/* Location Status */}
                {locationLoading && (
              <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                    <Typography variant="body2">
                      📡 Acquiring GPS signal... Please wait (may take 30 seconds)
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Ensure you're outdoors with clear sky view for best accuracy
                    </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  <strong>Mobile Tip:</strong> Make sure location services are enabled in your device settings
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  <strong>Browser Tip:</strong> Check browser console (F12) for detailed GPS logs
                    </Typography>
                  </Alert>
                )}
                
                {geocodingLoading && (
              <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                    <Typography variant="body2">
                      🔍 Looking up address from coordinates...
                    </Typography>
                  </Alert>
                )}
                
                {location && (
              <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>✅ GPS Location Captured Successfully!</strong>
                    </Typography>
                <Typography variant="body2">
                  Latitude: {location.lat.toFixed(6)}, Longitude: {location.lng.toFixed(6)}
                    </Typography>
                {capturedAddress && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Address: {capturedAddress}
                    </Typography>
                )}
                  </Alert>
                )}
                
                {/* Error Display */}
                {locationError && (
              <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>⚠️ Location Error:</strong>
                    </Typography>
                    <Typography variant="body2">
                      {locationError}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      You can still enter coordinates and address manually
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  <strong>Troubleshooting:</strong> Check browser console (F12) for detailed error logs
                  </Typography>
                </Alert>
            )}
            
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
                      startIcon={photoCapturing ? <CircularProgress size={20} /> : <PhotoCamera />}
                      onClick={() => setPhotoDialogOpen(true)}
                      disabled={photoCapturing}
                      fullWidth
                      sx={{ p: 3 }}
                    >
                      {capturedPhoto ? '📸 Retake Owner Photo' : '📸 Capture Owner Photo'}
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
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<Clear />}
                          onClick={clearCapturedPhoto}
                          sx={{ mt: 1 }}
                        >
                          Clear Photo
                        </Button>
                      </Box>
                    </Grid>
                  )}
                </Grid>
                
                {capturedPhoto && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>✅ Owner/Tenant Photo Captured Successfully!</strong>
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      The photo will be included in your survey submission. You can retake it anytime.
                    </Typography>
                  </Alert>
                )}
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
                  onClick={openSignatureDialog}
                  sx={{ mb: 2 }}
                >
                  {signatureData ? '✍️ Edit Signature' : '✍️ Add Signature'}
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
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<Clear />}
                      onClick={clearSignature}
                      sx={{ mt: 1 }}
                    >
                      Clear Signature
                    </Button>
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
                🏠 Sketch Photo Capture
              </Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                Capture a photo of your property sketch or drawing. This helps in property identification and assessment.
              </Alert>
            </Grid>
            
            <Grid item xs={12}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  📸 Sketch Photo
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      startIcon={sketchPhotoCapturing ? <CircularProgress size={20} /> : <PhotoCamera />}
                      onClick={() => setSketchPhotoDialogOpen(true)}
                      disabled={sketchPhotoCapturing}
                      fullWidth
                      sx={{ p: 3 }}
                    >
                      {(sketchPhoto || sketchPhotoBase64) ? '📸 Retake Sketch Photo' : '📸 Capture Sketch Photo'}
                    </Button>
                  </Grid>
                  
                                    {(sketchPhoto || sketchPhotoBase64) && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ textAlign: 'center' }}>
                          <img 
                            src={sketchPhoto || (sketchPhotoBase64 ? `data:${sketchPhotoBase64.type};base64,${sketchPhotoBase64.data}` : '')} 
                          alt="Sketch" 
                          style={{ maxWidth: '100%', maxHeight: '200px', border: '1px solid #ccc' }}
                        />
                        <Typography variant="caption" display="block">
                          {sketchPhoto ? 'Sketch photo captured successfully' : 'Existing sketch photo loaded'}
                          </Typography>
                          <Button
                            variant="outlined"
                          color="error"
                            size="small"
                            startIcon={<Clear />}
                            onClick={() => {
                              setSketchPhoto(null);
                            setSketchPhotoBase64(null);
                            }}
                            sx={{ mt: 1 }}
                          >
                          Clear Photo
                          </Button>
                        </Box>
                    </Grid>
                  )}
                </Grid>
                
                {(sketchPhoto || sketchPhotoBase64) && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>✅ Sketch Photo {sketchPhoto ? 'Captured' : 'Loaded'} Successfully!</strong>
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      The sketch photo will be included in your survey submission. You can retake it anytime.
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
                📋 Review & Submit
              </Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                Please review all the information before submitting. Once submitted, the survey will be sent for review.
              </Alert>
            </Grid>
            
            {/* Summary Cards */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    �� Basic Information
                  </Typography>
                  <Typography variant="body2">
                    <strong>Survey Number:</strong> {formData.survey_number}
                      </Typography>
                  <Typography variant="body2">
                    <strong>Owner Name:</strong> {formData.owner_name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Address:</strong> {formData.house_number} {formData.street_name}, {formData.locality}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Ward:</strong> {formData.ward_number} | <strong>Zone:</strong> {formData.zone}
                  </Typography>
                </CardContent>
              </Card>
                    </Grid>
                    
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🏠 Property Details
                        </Typography>
                  <Typography variant="body2">
                    <strong>Type:</strong> {formData.property_type}
                              </Typography>
                  <Typography variant="body2">
                    <strong>Construction:</strong> {formData.construction_type}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Floors:</strong> {formData.number_of_floors}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Plot Area:</strong> {formData.plot_area} sq ft
                  </Typography>
                </CardContent>
              </Card>
                            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📍 Location & Media
                  </Typography>
                  <Typography variant="body2">
                    <strong>GPS:</strong> {formData.latitude}, {formData.longitude}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Photo:</strong> {capturedPhoto ? '✅ Captured' : '❌ Missing'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Signature:</strong> {signatureData ? '✅ Captured' : '❌ Missing'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Sketch:</strong> {(sketchPhoto || sketchPhotoBase64) ? '✅ Captured' : '❌ Missing'}
                  </Typography>
                </CardContent>
              </Card>
                    </Grid>
                    
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🔌 Utilities
                        </Typography>
                  <Typography variant="body2">
                    <strong>Water:</strong> {formData.water_connection > 0 ? `${formData.water_connection} connection(s)` : 'No connection'}
                          </Typography>
                  <Typography variant="body2">
                    <strong>Electricity:</strong> {formData.electricity_connection ? '✅ Connected' : '❌ Not connected'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Sewage:</strong> {formData.sewage_connection ? '✅ Connected' : '❌ Not connected'}
                  </Typography>
                </CardContent>
              </Card>
            
            {/* Edit Comment for Edit Mode */}
            {isEditMode && editingProperty && editingProperty.survey_status !== 'draft' && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                  label="Edit Comment *"
                        multiline
                        rows={3}
                        value={formData.edit_comment}
                  onChange={(e) => handleInputChange('edit_comment', e.target.value)}
                  placeholder="Please provide a reason for editing this survey..."
                        required
                  helperText="Edit comment is required for post-submission edits"
                      />
                    </Grid>
            )}
            
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Grid item xs={12}>
                <Alert severity="error">
                  <Typography variant="body2" gutterBottom>
                    <strong>Please fix the following issues:</strong>
                  </Typography>
                  <ul>
                    {validationErrors.map((error, index) => (
                      <li key={index}>
                        <Typography variant="body2">{error}</Typography>
                      </li>
                    ))}
                  </ul>
                </Alert>
                  </Grid>
            )}
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };


  // Main return statement
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom align="center">
            {isEditMode ? '✏️ Edit Property Survey' : '🏠 New Property Survey'}
      </Typography>
      
      {isEditMode && editingProperty && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
                <strong>Editing Survey:</strong> {editingProperty.survey_number} | 
                Status: {editingProperty.survey_status} | 
                Created: {new Date(editingProperty.created_at).toLocaleDateString()}
          </Typography>
        </Alert>
      )}

          {/* Stepper */}
          <Stepper activeStep={activeStep} orientation="horizontal" sx={{ mb: 4 }}>
            {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {/* Step Content */}
          <Box sx={{ mb: 4 }}>
            {renderStepContent(activeStep)}
              </Box>
              
          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
              disabled={activeStep === 0}
                  onClick={handleBack}
              sx={{ mr: 1 }}
                >
                  Back
                </Button>
                
            <Box>
              {activeStep === steps.length - 1 ? (
                <>
                <Button
                  variant="outlined"
                  onClick={saveDraft}
                  disabled={loading}
                    sx={{ mr: 1 }}
                >
                  {loading ? <CircularProgress size={20} /> : 'Save Draft'}
                </Button>
                  <Button
                    variant="contained"
                    onClick={submitSurvey}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                  >
                    {loading ? 'Submitting...' : 'Submit Survey'}
                  </Button>
                </>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                  startIcon={<Save />}
                  >
                    Next
                  </Button>
                )}
              </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Photo Capture Dialog */}
      <Dialog 
        open={photoDialogOpen} 
        onClose={() => setPhotoDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          📸 Capture Owner/Tenant Photo
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <Typography variant="body1" gutterBottom>
              Choose how you want to capture the photo:
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="contained"
                  startIcon={<PhotoCamera />}
                  onClick={capturePhoto}
                  disabled={photoCapturing}
                  fullWidth
                  sx={{ p: 2 }}
                >
                  {photoCapturing ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Opening Camera...
                    </>
                  ) : (
                    '📸 Use Camera'
                  )}
                </Button>
              </Grid>
                
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  startIcon={<PhotoCamera />}
                  onClick={openFileInput}
                  fullWidth
                  sx={{ p: 2 }}
                >
                  📁 Upload File
                </Button>
              </Grid>
            </Grid>
            
            {photoCapturing && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Opening camera... Please wait and grant camera permissions when prompted.
                </Typography>
              </Alert>
            )}
                </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPhotoDialogOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Sketch Photo Dialog */}
      <Dialog 
        open={sketchPhotoDialogOpen} 
        onClose={closeSketchPhotoDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          🏠 Capture Sketch Photo
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <Typography variant="body1" gutterBottom>
              Position your sketch or drawing in front of the camera:
            </Typography>
                  
                  <Button
              variant="contained"
                    startIcon={<PhotoCamera />}
              onClick={captureSketchPhoto}
              disabled={sketchPhotoCapturing}
              fullWidth
              sx={{ p: 2, mt: 2 }}
            >
              {sketchPhotoCapturing ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Opening Camera...
                </>
              ) : (
                '📸 Capture Sketch Photo'
              )}
                  </Button>
                  
            {sketchPhotoCapturing && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Opening camera... Please wait and grant camera permissions when prompted.
                </Typography>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeSketchPhotoDialog}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Signature Dialog */}
      <Dialog 
        open={signatureOpen} 
        onClose={() => setSignatureOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          ✍️ Digital Signature
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <Typography variant="body2" gutterBottom>
              Draw your signature below:
            </Typography>
            
            <Box sx={{ border: '1px solid #ccc', borderRadius: 1, p: 2, mb: 2 }}>
            <canvas
              ref={canvasRef}
              width={400}
              height={200}
                style={{ border: '1px solid #ddd', cursor: 'crosshair' }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
            </Box>
            
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                onClick={clearSignatureFromForm}
                startIcon={<Clear />}
                >
                Clear
                </Button>
                <Button
                variant="contained"
                onClick={saveSignature}
                startIcon={<Save />}
              >
                Save Signature
                </Button>
              </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSignatureOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PropertySurveyForm; 
