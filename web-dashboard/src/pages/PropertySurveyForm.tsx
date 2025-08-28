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

// Utility function to get API base URL
const getApiBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  console.log('🌐 Environment API URL:', apiUrl);
  
  if (apiUrl) {
    return apiUrl;
  }
  
  // Fallback for development
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const fallbackUrl = isDevelopment ? 'http://localhost:3000/api' : 'https://your-railway-app-name.railway.app/api';
  
  console.log('🔄 Using fallback API URL:', fallbackUrl);
  return fallbackUrl;
};

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
  const [photoCapturing, setPhotoCapturing] = useState(false);
  
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

      // Load owner photo if available
      if (editingProperty.owner_tenant_photo) {
        setCapturedPhoto(editingProperty.owner_tenant_photo);
      }

      // Load sketch photo if available
      if (editingProperty.sketch_photo) {
        setSketchPhoto(editingProperty.sketch_photo);
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

  // Initialize signature canvas when dialog opens
  React.useEffect(() => {
    if (signatureOpen) {
      // Small delay to ensure canvas is rendered
      const timer = setTimeout(() => {
        initializeSignatureCanvas();
        // Load existing signature if available
        if (signatureData) {
          loadExistingSignature();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [signatureOpen, signatureData]);

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

  const capturePhoto = async () => {
    try {
      setPhotoCapturing(true);
      // Show loading state
      toast.info('Opening camera... Please wait.');
      
      // Try to access camera first
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: isMobileDevice() ? 'environment' : 'user', // Back camera on mobile, front on desktop
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        
        // Create video element to capture from camera
        const video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true; // Mute to avoid audio feedback
        video.play();
        
        // Wait for video to be ready
        await new Promise((resolve) => {
          video.onloadedmetadata = () => resolve(true);
        });
        
        // Show capture instruction
        toast.info('Camera ready! Position the person in frame and click capture.');
        
        // Create canvas to capture the photo
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Draw video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert to data URL
          const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setCapturedPhoto(photoDataUrl);
          
          // Stop camera stream
          stream.getTracks().forEach(track => track.stop());
          
          setPhotoDialogOpen(false);
          toast.success('Photo captured successfully from camera!');
        }
      } else {
        // Fallback: Open file input for photo selection
        toast.info('Camera not supported. Opening file upload...');
        openFileInput();
      }
    } catch (error) {
      console.error('Camera access error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          toast.error('Camera access denied. Please allow camera permissions or use file upload.');
          // Fallback to file input
          openFileInput();
        } else if (error.name === 'NotFoundError') {
          toast.error('No camera found. Please use file upload.');
          // Fallback to file input
          openFileInput();
        } else if (error.name === 'NotReadableError') {
          toast.error('Camera is busy. Please use file upload.');
          // Fallback to file input
          openFileInput();
        } else {
          toast.error('Camera error. Please use file upload.');
          // Fallback to file input
          openFileInput();
        }
      } else {
        toast.error('Camera error. Please use file upload.');
        // Fallback to file input
        openFileInput();
      }
    } finally {
      setPhotoCapturing(false);
    }
  };

  // Fallback function to open file input
  const openFileInput = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    // Use appropriate capture mode based on device
    if (isMobileDevice()) {
      input.capture = 'environment'; // Use back camera if available
    }
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error('File too large. Please select an image under 10MB.');
          return;
        }
        
        // Validate file type
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

  // Function to clear captured photo
  const clearCapturedPhoto = () => {
    setCapturedPhoto(null);
    toast.info('Photo cleared. Please capture a new photo.');
  };

  // Function to check camera support
  const checkCameraSupport = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  };

  // Function to check if device is mobile
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Function to initialize signature canvas
  const initializeSignatureCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Set initial canvas context properties
        ctx.strokeStyle = '#000000'; // Black color
        ctx.lineWidth = 3; // 3px line width
        ctx.lineCap = 'round'; // Rounded line ends
        ctx.lineJoin = 'round'; // Rounded line joins
        ctx.globalAlpha = 1.0; // Full opacity
        
        // Clear any existing content
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        console.log('Signature canvas initialized with:', {
          strokeStyle: ctx.strokeStyle,
          lineWidth: ctx.lineWidth,
          lineCap: ctx.lineCap,
          lineJoin: ctx.lineJoin,
          globalAlpha: ctx.globalAlpha
        });
      }
    }
  };

  // Function to handle touch events smoothly
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent default touch behaviors
    startDrawing(e);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent default touch behaviors
    draw(e);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent default touch behaviors
    stopDrawing();
  };

  // Signature Canvas Functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Configure canvas context for proper drawing
        ctx.strokeStyle = '#000000'; // Black color
        ctx.lineWidth = 3; // 3px line width
        ctx.lineCap = 'round'; // Rounded line ends
        ctx.lineJoin = 'round'; // Rounded line joins
        ctx.globalAlpha = 1.0; // Full opacity
        
        ctx.beginPath();
        
        // Handle both mouse and touch events
        let clientX: number, clientY: number;
        if ('touches' in e) {
          // Touch event
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else {
          // Mouse event
          clientX = e.clientX;
          clientY = e.clientY;
        }
        
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Handle both mouse and touch events
        let clientX: number, clientY: number;
        if ('touches' in e) {
          // Touch event
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else {
          // Mouse event
          clientX = e.clientX;
          clientY = e.clientY;
        }
        
        ctx.lineTo(clientX - rect.left, clientY - rect.top);
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
        // Clear the entire canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Reset canvas context to default state
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 1.0;
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

  // Upload sketch photo to backend
  const uploadSketchPhoto = async (propertyId: string): Promise<string | null> => {
    if (!sketchPhotoFile) {
      return null;
    }

    // File validation
    if (sketchPhotoFile.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('Sketch photo too large. Please select an image under 10MB.');
      return null;
    }

    if (!sketchPhotoFile.type.startsWith('image/')) {
      toast.error('Please select a valid image file for the sketch photo.');
      return null;
    }

    try {
      const formData = new FormData();
      formData.append('sketch_photo', sketchPhotoFile);

      // Get API URL from environment or fallback
      const API_BASE_URL = getApiBaseUrl();
      const uploadUrl = `${API_BASE_URL}/sketch-photo/${propertyId}`;
      
      console.log('🔄 Uploading sketch photo to:', uploadUrl);
      console.log('📁 File details:', {
        name: sketchPhotoFile.name,
        size: `${(sketchPhotoFile.size / 1024 / 1024).toFixed(2)}MB`,
        type: sketchPhotoFile.type
      });

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      toast.success('Sketch photo uploaded successfully!');
      return result.data.sketch_photo;
    } catch (error: any) {
      console.error('❌ Error uploading sketch photo:', error);
      
      // Provide specific error messages based on error type
      let errorMessage = 'Failed to upload sketch photo';
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Network error: Cannot connect to server. Please check your internet connection.';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Upload timeout: Please try again.';
      } else if (error.message.includes('HTTP 401')) {
        errorMessage = 'Authentication error: Please log in again.';
      } else if (error.message.includes('HTTP 413')) {
        errorMessage = 'File too large: Please select a smaller image.';
      } else if (error.message.includes('HTTP 500')) {
        errorMessage = 'Server error: Please try again later.';
      } else if (error.message) {
        errorMessage = `Upload failed: ${error.message}`;
      }
      
      toast.error(errorMessage);
      return null;
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
          console.log('📤 Starting sketch photo upload for property:', editingProperty.id);
          const uploadedPhotoPath = await uploadSketchPhoto(editingProperty.id);
          if (uploadedPhotoPath) {
            console.log('✅ Sketch photo uploaded successfully, updating property...');
            // Update the property with the new sketch photo path
            await propertiesApi.updateProperty(editingProperty.id, {
              sketch_photo: uploadedPhotoPath,
              sketch_photo_captured_at: new Date().toISOString(),
              edit_comment: formData.edit_comment // Include edit comment to pass validation
            } as any); // Type assertion to bypass Property interface limitation
          } else {
            console.warn('⚠️ Sketch photo upload failed, but continuing with property update');
            toast.warning('Sketch photo upload failed, but property was updated successfully.');
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
            console.log('📤 Starting sketch photo upload for new property:', response.data.property.id);
            const uploadedPhotoPath = await uploadSketchPhoto(response.data.property.id);
            if (uploadedPhotoPath) {
              console.log('✅ Sketch photo uploaded successfully, updating new property...');
              // Update the property with the sketch photo path
              await propertiesApi.updateProperty(response.data.property.id, {
                sketch_photo: uploadedPhotoPath,
                sketch_photo_captured_at: new Date().toISOString()
              });
            } else {
              console.warn('⚠️ Sketch photo upload failed for new property, but property was created successfully');
              toast.warning('Sketch photo upload failed, but property was created successfully.');
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
    try {
      // File validation
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File too large. Please select an image under 10MB.');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file.');
        return;
      }

      // Log file details for debugging
      console.log('📸 Sketch photo captured:', {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        type: file.type,
        lastModified: new Date(file.lastModified).toLocaleString()
      });

      setSketchPhotoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setSketchPhoto(e.target?.result as string);
      };
      reader.onerror = () => {
        console.error('❌ Error reading sketch photo file');
        toast.error('Error reading photo file. Please try again.');
      };
      reader.readAsDataURL(file);
      
      // Show success message
      toast.success('Sketch photo captured successfully! It will be uploaded when you submit the survey.');
    } catch (error: any) {
      console.error('❌ Error capturing sketch photo:', error);
      toast.error('Error capturing photo. Please try again.');
    }
  };

  // Function to open signature dialog and load existing signature if available
  const openSignatureDialog = () => {
    setSignatureOpen(true);
  };

  // Function to save signature and close dialog
  const saveSignature = () => {
    if (signatureData) {
      setSignatureOpen(false);
      toast.success('Signature saved successfully!');
    } else {
      toast.error('Please draw a signature before saving.');
    }
  };

  // Function to clear signature from main form
  const clearSignatureFromForm = () => {
    clearSignature();
    toast.info('Signature cleared. Please add a new signature.');
  };

  // Function to load existing signature into canvas
  const loadExistingSignature = () => {
    if (signatureData) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Clear canvas first
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Load existing signature image
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = signatureData;
        }
      }
    }
  };

  // Function to test signature drawing (draws a simple test line)
  const testSignatureDrawing = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw a test line to verify drawing is working
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 1.0;
        
        ctx.beginPath();
        ctx.moveTo(50, 100);
        ctx.lineTo(350, 100);
        ctx.stroke();
        
        toast.success('Test line drawn! Your signature drawing is working.');
      }
    }
  };

  // Function to adjust drawing settings
  const adjustDrawingSettings = (setting: 'thicker' | 'thinner' | 'darker' | 'lighter') => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        switch (setting) {
          case 'thicker':
            ctx.lineWidth = Math.min(ctx.lineWidth + 1, 8);
            toast.info(`Line thickness: ${ctx.lineWidth}px`);
            break;
          case 'thinner':
            ctx.lineWidth = Math.max(ctx.lineWidth - 1, 1);
            toast.info(`Line thickness: ${ctx.lineWidth}px`);
            break;
          case 'darker':
            ctx.globalAlpha = Math.min(ctx.globalAlpha + 0.1, 1.0);
            toast.info(`Opacity: ${Math.round(ctx.globalAlpha * 100)}%`);
            break;
          case 'lighter':
            ctx.globalAlpha = Math.max(ctx.globalAlpha - 0.1, 0.3);
            toast.info(`Opacity: ${Math.round(ctx.globalAlpha * 100)}%`);
            break;
        }
      }
    }
  };

  // Function to reset drawing settings to default
  const resetDrawingSettings = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 1.0;
        toast.info('Drawing settings reset to default');
      }
    }
  };

  // Function to undo last drawing action
  const undoLastDrawing = () => {
    // For now, we'll just clear and reload the existing signature
    // In a more advanced implementation, we could store drawing history
    if (signatureData) {
      loadExistingSignature();
      toast.info('Last action undone');
    } else {
      clearSignature();
      toast.info('Canvas cleared');
    }
  };

  // Function to handle zoom functionality
  const handleZoom = (direction: 'in' | 'out') => {
    const canvas = canvasRef.current;
    if (canvas) {
      const currentWidth = canvas.width;
      const currentHeight = canvas.height;
      
      if (direction === 'in' && currentWidth < 800) {
        canvas.width = currentWidth * 1.2;
        canvas.height = currentHeight * 1.2;
        toast.info(`Zoomed in: ${Math.round(canvas.width)}x${Math.round(canvas.height)}`);
      } else if (direction === 'out' && currentWidth > 200) {
        canvas.width = currentWidth / 1.2;
        canvas.height = currentHeight / 1.2;
        toast.info(`Zoomed out: ${Math.round(canvas.width)}x${Math.round(canvas.height)}`);
      }
      
      // Reinitialize canvas after zoom
      initializeSignatureCanvas();
      if (signatureData) {
        loadExistingSignature();
      }
    }
  };

  // Function to export signature in different formats
  const exportSignature = (format: 'png' | 'jpeg' | 'svg') => {
    const canvas = canvasRef.current;
    if (canvas && signatureData) {
      try {
        let dataUrl: string;
        let filename: string;
        
        switch (format) {
          case 'png':
            dataUrl = canvas.toDataURL('image/png');
            filename = 'signature.png';
            break;
          case 'jpeg':
            dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            filename = 'signature.jpg';
            break;
          case 'svg':
            // For SVG, we'll create a simple SVG representation
            const svgContent = `<svg width="${canvas.width}" height="${canvas.height}" xmlns="http://www.w3.org/2000/svg">
              <rect width="100%" height="100%" fill="white"/>
              <image href="${signatureData}" width="100%" height="100%"/>
            </svg>`;
            const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
            const svgUrl = URL.createObjectURL(svgBlob);
            dataUrl = svgUrl;
            filename = 'signature.svg';
            break;
        }
        
        // Create download link
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up SVG URL if created
        if (format === 'svg') {
          URL.revokeObjectURL(dataUrl);
        }
        
        toast.success(`Signature exported as ${format.toUpperCase()}`);
      } catch (error) {
        console.error('Export error:', error);
        toast.error('Failed to export signature');
      }
    } else {
      toast.error('No signature to export');
    }
  };

  // Function to import existing signature image
  const importSignature = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error('File too large. Please select an image under 5MB.');
          return;
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error('Please select a valid image file.');
          return;
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          setSignatureData(result);
          
          // Load the imported image into canvas
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              
              const img = new Image();
              img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              };
              img.src = result;
            }
          }
          
          toast.success('Signature imported successfully!');
        };
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  };

  // Function to show signature preview in different sizes
  const showSignaturePreview = () => {
    if (!signatureData) {
      toast.error('No signature to preview');
      return;
    }
    
    // Create a preview dialog
    const previewWindow = window.open('', '_blank', 'width=600,height=400');
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Signature Preview</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            .preview-container { margin: 20px 0; }
            .preview-item { margin: 20px 0; padding: 10px; border: 1px solid #ccc; border-radius: 8px; }
            .preview-item h3 { margin: 0 0 10px 0; color: #333; }
            img { max-width: 100%; border: 1px solid #ddd; border-radius: 4px; }
            .close-btn { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
            .close-btn:hover { background: #0056b3; }
          </style>
        </head>
        <body>
          <h1>📝 Signature Preview</h1>
          <p>Preview of your signature in different display sizes:</p>
          
          <div class="preview-container">
            <div class="preview-item">
              <h3>🖼️ Full Size (400x200)</h3>
              <img src="${signatureData}" alt="Full Size Signature" width="400" height="200">
            </div>
            
            <div class="preview-item">
              <h3>📱 Medium Size (200x100)</h3>
              <img src="${signatureData}" alt="Medium Size Signature" width="200" height="100">
            </div>
            
            <div class="preview-item">
              <h3>🔍 Small Size (100x50)</h3>
              <img src="${signatureData}" alt="Small Size Signature" width="100" height="50">
            </div>
          </div>
          
          <button class="close-btn" onclick="window.close()">Close Preview</button>
        </body>
        </html>
      `);
      previewWindow.document.close();
    } else {
      toast.error('Popup blocked. Please allow popups for this site.');
    }
  };

  // Function to reset canvas to default size
  const resetCanvasSize = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Reset to default size
      canvas.width = 400;
      canvas.height = 200;
      
      // Reinitialize canvas
      initializeSignatureCanvas();
      
      // Load existing signature if available
      if (signatureData) {
        loadExistingSignature();
      }
      
      toast.info('Canvas reset to default size (400x200)');
    }
  };

  // Function to show drawing statistics
  const showDrawingStats = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const stats = {
          canvasSize: `${canvas.width}x${canvas.width}`,
          strokeStyle: ctx.strokeStyle,
          lineWidth: `${ctx.lineWidth}px`,
          lineCap: ctx.lineCap,
          lineJoin: ctx.lineJoin,
          globalAlpha: `${Math.round(ctx.globalAlpha * 100)}%`,
          hasSignature: !!signatureData,
          signatureSize: signatureData ? `${Math.round(signatureData.length / 1024)}KB` : 'N/A'
        };
        
        const statsMessage = `📊 Drawing Statistics:
• Canvas: ${stats.canvasSize}
• Color: ${stats.strokeStyle}
• Line Width: ${stats.lineWidth}
• Line Cap: ${stats.lineCap}
• Line Join: ${stats.lineJoin}
• Opacity: ${stats.globalAlpha}
• Has Signature: ${stats.hasSignature ? 'Yes' : 'No'}
• Signature Size: ${stats.signatureSize}`;
        
        toast.info(statsMessage, {
          autoClose: 5000,
          position: 'top-center'
        });
      }
    }
  };

  // Function to show help information
  const showHelp = () => {
    const helpMessage = `📚 Signature Drawing Help:

🎨 Drawing:
• Use mouse or touch to draw your signature
• Draw slowly and deliberately for best results
• Release to finish drawing

⚙️ Controls:
• Thinner/Thicker: Adjust line width
• Lighter/Darker: Adjust opacity
• Reset: Restore default settings

🔍 Zoom:
• Zoom In/Out: Adjust canvas size
• Reset Size: Return to default dimensions

📁 File Operations:
• Import: Load existing signature image
• Export: Save in PNG, JPEG, or SVG format
• Preview: See signature in different sizes

💡 Tips:
• Good lighting helps with accuracy
• Practice on paper first if needed
• Use the Test Drawing button to verify functionality
• Clear and redraw if not satisfied

🆘 Troubleshooting:
• If drawing isn't visible, check line width and opacity
• If touch isn't working, ensure touch events are enabled
• If import fails, check file size (max 5MB) and format`;
    
    toast.info(helpMessage, {
      autoClose: 8000,
      position: 'top-center'
    });
  };

  // Function to toggle full screen mode for signature canvas
  const toggleFullScreen = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      if (!document.fullscreenElement) {
        // Enter full screen
        if (canvas.requestFullscreen) {
          canvas.requestFullscreen();
          toast.info('Full screen mode activated. Press ESC to exit.');
        } else if ((canvas as any).webkitRequestFullscreen) {
          (canvas as any).webkitRequestFullscreen();
          toast.info('Full screen mode activated. Press ESC to exit.');
        } else if ((canvas as any).msRequestFullscreen) {
          (canvas as any).msRequestFullscreen();
          toast.info('Full screen mode activated. Press ESC to exit.');
        }
      } else {
        // Exit full screen
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
        toast.info('Exited full screen mode');
      }
    }
  };

  // Function to change signature color
  const changeSignatureColor = (color: string) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = color;
        toast.info(`Signature color changed to ${color}`);
      }
    }
  };

  // Function to change signature style
  const changeSignatureStyle = (style: 'normal' | 'bold' | 'thin' | 'calligraphy') => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        switch (style) {
          case 'normal':
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            toast.info('Signature style: Normal');
            break;
          case 'bold':
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            toast.info('Signature style: Bold');
            break;
          case 'thin':
            ctx.lineWidth = 1;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            toast.info('Signature style: Thin');
            break;
          case 'calligraphy':
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            toast.info('Signature style: Calligraphy');
            break;
        }
      }
    }
  };

  // Function to change signature background
  const changeSignatureBackground = (background: 'white' | 'light' | 'dark' | 'transparent') => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Save current drawing
        const currentSignature = signatureData;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set background
        switch (background) {
          case 'white':
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            toast.info('Background: White');
            break;
          case 'light':
            ctx.fillStyle = '#f5f5f5';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            toast.info('Background: Light Gray');
            break;
          case 'dark':
            ctx.fillStyle = '#2c2c2c';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            toast.info('Background: Dark Gray');
            break;
          case 'transparent':
            // No background fill
            toast.info('Background: Transparent');
            break;
        }
        
        // Restore signature if exists
        if (currentSignature) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = currentSignature;
        }
      }
    }
  };

  // Function to change signature paper size
  const changePaperSize = (size: 'small' | 'medium' | 'large' | 'custom') => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Save current signature
      const currentSignature = signatureData;
      
      // Set new dimensions
      switch (size) {
        case 'small':
          canvas.width = 300;
          canvas.height = 150;
          toast.info('Paper size: Small (300x150)');
          break;
        case 'medium':
          canvas.width = 400;
          canvas.height = 200;
          toast.info('Paper size: Medium (400x200)');
          break;
        case 'large':
          canvas.width = 600;
          canvas.height = 300;
          toast.info('Paper size: Large (600x300)');
          break;
        case 'custom':
          // For custom size, we'll use a prompt (simplified)
          const width = prompt('Enter width (100-800):', '400');
          const height = prompt('Enter height (50-600):', '200');
          if (width && height) {
            const w = parseInt(width);
            const h = parseInt(height);
            if (w >= 100 && w <= 800 && h >= 50 && h <= 600) {
              canvas.width = w;
              canvas.height = h;
              toast.info(`Paper size: Custom (${w}x${h})`);
            } else {
              toast.error('Invalid dimensions. Using medium size.');
              canvas.width = 400;
              canvas.height = 200;
            }
          }
          break;
      }
      
      // Reinitialize canvas
      initializeSignatureCanvas();
      
      // Restore signature if exists
      if (currentSignature) {
        loadExistingSignature();
      }
    }
  };

  // Function to change signature orientation
  const changeSignatureOrientation = (orientation: 'landscape' | 'portrait' | 'square') => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Save current signature
      const currentSignature = signatureData;
      
      // Set new dimensions based on orientation
      switch (orientation) {
        case 'landscape':
          canvas.width = 500;
          canvas.height = 250;
          toast.info('Orientation: Landscape (500x250)');
          break;
        case 'portrait':
          canvas.width = 300;
          canvas.height = 400;
          toast.info('Orientation: Portrait (300x400)');
          break;
        case 'square':
          canvas.width = 400;
          canvas.height = 400;
          toast.info('Orientation: Square (400x400)');
          break;
      }
      
      // Reinitialize canvas
      initializeSignatureCanvas();
      
      // Restore signature if exists
      if (currentSignature) {
        loadExistingSignature();
      }
    }
  };

  // Function to change signature paper type
  const changePaperType = (type: 'plain' | 'lined' | 'grid' | 'dotted') => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Save current signature
        const currentSignature = signatureData;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw paper pattern based on type
        switch (type) {
          case 'plain':
            // No pattern
            toast.info('Paper type: Plain');
            break;
          case 'lined':
            // Draw horizontal lines
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 1;
            for (let y = 20; y < canvas.height; y += 20) {
              ctx.beginPath();
              ctx.moveTo(0, y);
              ctx.lineTo(canvas.width, y);
              ctx.stroke();
            }
            toast.info('Paper type: Lined');
            break;
          case 'grid':
            // Draw grid pattern
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 1;
            for (let x = 0; x < canvas.width; x += 20) {
              ctx.beginPath();
              ctx.moveTo(x, 0);
              ctx.lineTo(x, canvas.height);
              ctx.stroke();
            }
            for (let y = 0; y < canvas.height; y += 20) {
              ctx.beginPath();
              ctx.moveTo(0, y);
              ctx.lineTo(canvas.width, y);
              ctx.stroke();
            }
            toast.info('Paper type: Grid');
            break;
          case 'dotted':
            // Draw dotted pattern
            ctx.fillStyle = '#e0e0e0';
            for (let x = 10; x < canvas.width; x += 20) {
              for (let y = 10; y < canvas.height; y += 20) {
                ctx.beginPath();
                ctx.arc(x, y, 1, 0, 2 * Math.PI);
                ctx.fill();
              }
            }
            toast.info('Paper type: Dotted');
            break;
        }
        
        // Restore signature if exists
        if (currentSignature) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = currentSignature;
        }
      }
    }
  };

  // Function to change signature margins
  const changeSignatureMargins = (margin: 'none' | 'small' | 'medium' | 'large') => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Save current signature
        const currentSignature = signatureData;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw margins based on type
        switch (margin) {
          case 'none':
            // No margins
            toast.info('Margins: None');
            break;
          case 'small':
            // Small margins (10px)
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 2;
            ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
            toast.info('Margins: Small (10px)');
            break;
          case 'medium':
            // Medium margins (20px)
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 2;
            ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
            toast.info('Margins: Medium (20px)');
            break;
          case 'large':
            // Large margins (30px)
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 2;
            ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
            toast.info('Margins: Large (30px)');
            break;
        }
        
        // Restore signature if exists
        if (currentSignature) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = currentSignature;
        }
      }
    }
  };

  // Function to change signature watermark
  const changeSignatureWatermark = (watermark: 'none' | 'draft' | 'confidential' | 'approved' | 'custom') => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Save current signature
        const currentSignature = signatureData;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw watermark based on type
        switch (watermark) {
          case 'none':
            // No watermark
            toast.info('Watermark: None');
            break;
          case 'draft':
            // Draft watermark
            ctx.fillStyle = '#f0f0f0';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('DRAFT', canvas.width / 2, canvas.height / 2);
            toast.info('Watermark: Draft');
            break;
          case 'confidential':
            // Confidential watermark
            ctx.fillStyle = '#f0f0f0';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('CONFIDENTIAL', canvas.width / 2, canvas.height / 2);
            toast.info('Watermark: Confidential');
            break;
          case 'approved':
            // Approved watermark
            ctx.fillStyle = '#e8f5e8';
            ctx.font = 'bold 22px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('APPROVED', canvas.width / 2, canvas.height / 2);
            toast.info('Watermark: Approved');
            break;
          case 'custom':
            // Custom watermark
            const customText = prompt('Enter custom watermark text:', 'CUSTOM');
            if (customText) {
              ctx.fillStyle = '#f0f0f0';
              ctx.font = 'bold 20px Arial';
              ctx.textAlign = 'center';
              ctx.fillText(customText.toUpperCase(), canvas.width / 2, canvas.height / 2);
              toast.info(`Watermark: ${customText}`);
            }
            break;
        }
        
        // Restore signature if exists
        if (currentSignature) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = currentSignature;
        }
      }
    }
  };

  // Function to change signature border style
  const changeSignatureBorder = (border: 'none' | 'solid' | 'dashed' | 'dotted' | 'double') => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Save current signature
        const currentSignature = signatureData;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw border based on type
        switch (border) {
          case 'none':
            // No border
            toast.info('Border: None');
            break;
          case 'solid':
            // Solid border
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, canvas.width, canvas.height);
            toast.info('Border: Solid');
            break;
          case 'dashed':
            // Dashed border
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 5]);
            ctx.strokeRect(0, 0, canvas.width, canvas.height);
            ctx.setLineDash([]); // Reset line dash
            toast.info('Border: Dashed');
            break;
          case 'dotted':
            // Dotted border
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.setLineDash([2, 2]);
            ctx.strokeRect(0, 0, canvas.width, canvas.height);
            ctx.setLineDash([]); // Reset line dash
            toast.info('Border: Dotted');
            break;
          case 'double':
            // Double border
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
            ctx.strokeRect(0, 0, canvas.width, canvas.height);
            toast.info('Border: Double');
            break;
        }
        
        // Restore signature if exists
        if (currentSignature) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = currentSignature;
        }
      }
    }
  };

  // Function to change signature corner style
  const changeSignatureCorner = (corner: 'square' | 'rounded' | 'beveled' | 'decorative') => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Save current signature
        const currentSignature = signatureData;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw corner style based on type
        switch (corner) {
          case 'square':
            // Square corners (default)
            toast.info('Corner style: Square');
            break;
          case 'rounded':
            // Rounded corners
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(0, 0, canvas.width, canvas.height, 10);
            ctx.stroke();
            toast.info('Corner style: Rounded');
            break;
          case 'beveled':
            // Beveled corners
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(canvas.width - 10, 0);
            ctx.lineTo(canvas.width, 10);
            ctx.lineTo(canvas.width, canvas.height - 10);
            ctx.lineTo(canvas.width - 10, canvas.height);
            ctx.lineTo(10, canvas.height);
            ctx.lineTo(0, canvas.height - 10);
            ctx.lineTo(0, 10);
            ctx.closePath();
            ctx.stroke();
            toast.info('Corner style: Beveled');
            break;
          case 'decorative':
            // Decorative corners
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            // Draw decorative corner elements
            const cornerSize = 15;
            // Top-left corner
            ctx.beginPath();
            ctx.moveTo(cornerSize, 0);
            ctx.lineTo(0, 0);
            ctx.lineTo(0, cornerSize);
            ctx.stroke();
            // Top-right corner
            ctx.beginPath();
            ctx.moveTo(canvas.width - cornerSize, 0);
            ctx.lineTo(canvas.width, 0);
            ctx.lineTo(canvas.width, cornerSize);
            ctx.stroke();
            // Bottom-right corner
            ctx.beginPath();
            ctx.moveTo(canvas.width, canvas.height - cornerSize);
            ctx.lineTo(canvas.width, canvas.height);
            ctx.lineTo(canvas.width - cornerSize, canvas.height);
            ctx.stroke();
            // Bottom-left corner
            ctx.beginPath();
            ctx.moveTo(cornerSize, canvas.height);
            ctx.lineTo(0, canvas.height);
            ctx.lineTo(0, canvas.height - cornerSize);
            ctx.stroke();
            toast.info('Corner style: Decorative');
            break;
        }
        
        // Restore signature if exists
        if (currentSignature) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = currentSignature;
        }
      }
    }
  };

  // Function to change signature shadow style
  const changeSignatureShadow = (shadow: 'none' | 'light' | 'medium' | 'heavy' | 'colored') => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Save current signature
        const currentSignature = signatureData;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw shadow based on type
        switch (shadow) {
          case 'none':
            // No shadow
            toast.info('Shadow: None');
            break;
          case 'light':
            // Light shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
            ctx.shadowBlur = 5;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            toast.info('Shadow: Light');
            break;
          case 'medium':
            // Medium shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;
            toast.info('Shadow: Medium');
            break;
          case 'heavy':
            // Heavy shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetX = 5;
            ctx.shadowOffsetY = 5;
            toast.info('Shadow: Heavy');
            break;
          case 'colored':
            // Colored shadow
            ctx.shadowColor = 'rgba(0, 100, 255, 0.3)';
            ctx.shadowBlur = 12;
            ctx.shadowOffsetX = 4;
            ctx.shadowOffsetY = 4;
            toast.info('Shadow: Colored (Blue)');
            break;
        }
        
        // Restore signature if exists
        if (currentSignature) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = currentSignature;
        }
        
        // Reset shadow for future drawing
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
    }
  };

  // Function to change signature texture style
  const changeSignatureTexture = (texture: 'none' | 'paper' | 'canvas' | 'leather' | 'metal') => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Save current signature
        const currentSignature = signatureData;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw texture based on type
        switch (texture) {
          case 'none':
            // No texture
            toast.info('Texture: None');
            break;
          case 'paper':
            // Paper texture (subtle noise)
            for (let i = 0; i < 1000; i++) {
              const x = Math.random() * canvas.width;
              const y = Math.random() * canvas.height;
              const alpha = Math.random() * 0.1;
              ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
              ctx.fillRect(x, y, 1, 1);
            }
            toast.info('Texture: Paper');
            break;
          case 'canvas':
            // Canvas texture (woven pattern)
            ctx.strokeStyle = '#f0f0f0';
            ctx.lineWidth = 1;
            for (let x = 0; x < canvas.width; x += 4) {
              ctx.beginPath();
              ctx.moveTo(x, 0);
              ctx.lineTo(x, canvas.height);
              ctx.stroke();
            }
            for (let y = 0; y < canvas.height; y += 4) {
              ctx.beginPath();
              ctx.moveTo(0, y);
              ctx.lineTo(canvas.width, y);
              ctx.stroke();
            }
            toast.info('Texture: Canvas');
            break;
          case 'leather':
            // Leather texture (irregular pattern)
            for (let i = 0; i < 500; i++) {
              const x = Math.random() * canvas.width;
              const y = Math.random() * canvas.height;
              const size = Math.random() * 3 + 1;
              const alpha = Math.random() * 0.15;
              ctx.fillStyle = `rgba(139, 69, 19, ${alpha})`;
              ctx.beginPath();
              ctx.arc(x, y, size, 0, 2 * Math.PI);
              ctx.fill();
            }
            toast.info('Texture: Leather');
            break;
          case 'metal':
            // Metal texture (metallic shine)
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#e0e0e0');
            gradient.addColorStop(0.5, '#ffffff');
            gradient.addColorStop(1, '#c0c0c0');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add metallic highlights
            for (let i = 0; i < 200; i++) {
              const x = Math.random() * canvas.width;
              const y = Math.random() * canvas.height;
              const alpha = Math.random() * 0.3;
              ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
              ctx.fillRect(x, y, 2, 2);
            }
            toast.info('Texture: Metal');
            break;
        }
        
        // Restore signature if exists
        if (currentSignature) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = currentSignature;
        }
      }
    }
  };

  // Function to change signature filter style
  const changeSignatureFilter = (filter: 'none' | 'sepia' | 'grayscale' | 'invert' | 'blur') => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Save current signature
        const currentSignature = signatureData;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Apply filter based on type
        switch (filter) {
          case 'none':
            // No filter
            toast.info('Filter: None');
            break;
          case 'sepia':
            // Sepia filter
            ctx.filter = 'sepia(100%)';
            toast.info('Filter: Sepia');
            break;
          case 'grayscale':
            // Grayscale filter
            ctx.filter = 'grayscale(100%)';
            toast.info('Filter: Grayscale');
            break;
          case 'invert':
            // Invert filter
            ctx.filter = 'invert(100%)';
            toast.info('Filter: Invert');
            break;
          case 'blur':
            // Blur filter
            ctx.filter = 'blur(1px)';
            toast.info('Filter: Blur');
            break;
        }
        
        // Restore signature if exists
        if (currentSignature) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = currentSignature;
        }
        
        // Reset filter for future drawing
        ctx.filter = 'none';
      }
    }
  };

  // Function to change signature effect style
  const changeSignatureEffect = (effect: 'none' | 'glow' | 'neon' | 'emboss' | 'outline') => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Save current signature
        const currentSignature = signatureData;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Apply effect based on type
        switch (effect) {
          case 'none':
            // No effect
            toast.info('Effect: None');
            break;
          case 'glow':
            // Glow effect
            ctx.shadowColor = '#00ff00';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            toast.info('Effect: Glow (Green)');
            break;
          case 'neon':
            // Neon effect
            ctx.shadowColor = '#ff00ff';
            ctx.shadowBlur = 25;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            toast.info('Effect: Neon (Pink)');
            break;
          case 'emboss':
            // Emboss effect
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            toast.info('Effect: Emboss');
            break;
          case 'outline':
            // Outline effect
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            toast.info('Effect: Outline');
            break;
        }
        
        // Restore signature if exists
        if (currentSignature) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = currentSignature;
        }
        
        // Reset effects for future drawing
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
      }
    }
  };

  // Function to change signature animation style
  const changeSignatureAnimation = (animation: 'none' | 'fade' | 'slide' | 'bounce' | 'rotate') => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Save current signature
        const currentSignature = signatureData;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Apply animation based on type
        switch (animation) {
          case 'none':
            // No animation
            toast.info('Animation: None');
            break;
          case 'fade':
            // Fade animation
            ctx.globalAlpha = 0.5;
            toast.info('Animation: Fade (50% opacity)');
            break;
          case 'slide':
            // Slide animation (offset)
            ctx.translate(20, 0);
            toast.info('Animation: Slide (20px right)');
            break;
          case 'bounce':
            // Bounce animation (scale)
            ctx.scale(1.1, 1.1);
            toast.info('Animation: Bounce (110% scale)');
            break;
          case 'rotate':
            // Rotate animation
            ctx.rotate(0.1); // Small rotation
            toast.info('Animation: Rotate (5.7 degrees)');
            break;
        }
        
        // Restore signature if exists
        if (currentSignature) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = currentSignature;
        }
        
        // Reset transformations for future drawing
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1.0;
      }
    }
  };

  // Function to change signature theme style
  const changeSignatureTheme = (theme: 'classic' | 'modern' | 'vintage' | 'futuristic' | 'nature') => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Save current signature
        const currentSignature = signatureData;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Apply theme based on type
        switch (theme) {
          case 'classic':
            // Classic theme (black on white)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            toast.info('Theme: Classic (Black on White)');
            break;
          case 'modern':
            // Modern theme (blue on light blue)
            ctx.fillStyle = '#e3f2fd';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#1976d2';
            ctx.lineWidth = 4;
            toast.info('Theme: Modern (Blue on Light Blue)');
            break;
          case 'vintage':
            // Vintage theme (brown on cream)
            ctx.fillStyle = '#f5f5dc';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#8b4513';
            ctx.lineWidth = 3;
            toast.info('Theme: Vintage (Brown on Cream)');
            break;
          case 'futuristic':
            // Futuristic theme (cyan on dark)
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 5;
            toast.info('Theme: Futuristic (Cyan on Dark)');
            break;
          case 'nature':
            // Nature theme (green on light green)
            ctx.fillStyle = '#e8f5e8';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#2e7d32';
            ctx.lineWidth = 3;
            toast.info('Theme: Nature (Green on Light Green)');
            break;
        }
        
        // Restore signature if exists
        if (currentSignature) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = currentSignature;
        }
      }
    }
  };

  // Function to change signature quality style
  const changeSignatureQuality = (quality: 'low' | 'medium' | 'high' | 'ultra' | 'custom') => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Save current signature
        const currentSignature = signatureData;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Apply quality based on type
        switch (quality) {
          case 'low':
            // Low quality (rough edges)
            ctx.lineCap = 'butt';
            ctx.lineJoin = 'miter';
            ctx.lineWidth = 2;
            toast.info('Quality: Low (Rough edges)');
            break;
          case 'medium':
            // Medium quality (standard)
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = 3;
            toast.info('Quality: Medium (Standard)');
            break;
          case 'high':
            // High quality (smooth)
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = 3;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            toast.info('Quality: High (Smooth)');
            break;
          case 'ultra':
            // Ultra quality (premium)
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = 3;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            // Enable anti-aliasing
            ctx.globalCompositeOperation = 'source-over';
            toast.info('Quality: Ultra (Premium)');
            break;
          case 'custom':
            // Custom quality
            const customWidth = prompt('Enter line width (1-10):', '3');
            const customCap = prompt('Enter line cap (butt, round, square):', 'round');
            const customJoin = prompt('Enter line join (miter, round, bevel):', 'round');
            
            if (customWidth && customCap && customJoin) {
              const width = parseInt(customWidth);
              if (width >= 1 && width <= 10) {
                ctx.lineWidth = width;
                ctx.lineCap = customCap as CanvasLineCap;
                ctx.lineJoin = customJoin as CanvasLineJoin;
                toast.info(`Quality: Custom (Width: ${width}, Cap: ${customCap}, Join: ${customJoin})`);
              } else {
                toast.error('Invalid line width. Using medium quality.');
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
              }
            }
            break;
        }
        
        // Restore signature if exists
        if (currentSignature) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = currentSignature;
        }
      }
    }
  };

  // Function to change signature export style
  const changeSignatureExportStyle = (style: 'standard' | 'premium' | 'print' | 'web' | 'mobile') => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Save current signature
        const currentSignature = signatureData;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Apply export style based on type
        switch (style) {
          case 'standard':
            // Standard export (default settings)
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            toast.info('Export Style: Standard (Default)');
            break;
          case 'premium':
            // Premium export (high quality)
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            toast.info('Export Style: Premium (High Quality)');
            break;
          case 'print':
            // Print export (optimized for printing)
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            // Higher resolution for print
            canvas.width = canvas.width * 2;
            canvas.height = canvas.height * 2;
            ctx.scale(2, 2);
            toast.info('Export Style: Print (High Resolution)');
            break;
          case 'web':
            // Web export (optimized for web)
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            // Web-optimized settings
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'medium';
            toast.info('Export Style: Web (Optimized)');
            break;
          case 'mobile':
            // Mobile export (optimized for mobile)
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            // Mobile-optimized settings
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'low';
            toast.info('Export Style: Mobile (Touch Optimized)');
            break;
        }
        
        // Restore signature if exists
        if (currentSignature) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = currentSignature;
        }
      }
    }
  };

  // Function to change signature preset style
  const changeSignaturePreset = (preset: 'business' | 'creative' | 'formal' | 'casual' | 'artistic') => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Save current signature
        const currentSignature = signatureData;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Apply preset based on type
        switch (preset) {
          case 'business':
            // Business preset (professional)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            // Add business watermark
            ctx.fillStyle = '#f0f0f0';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('BUSINESS', canvas.width / 2, canvas.height - 10);
            toast.info('Preset: Business (Professional)');
            break;
          case 'creative':
            // Creative preset (artistic)
            ctx.fillStyle = '#f8f8ff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            // Add creative watermark
            ctx.fillStyle = '#ff6b6b';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('CREATIVE', canvas.width / 2, canvas.height - 10);
            toast.info('Preset: Creative (Artistic)');
            break;
          case 'formal':
            // Formal preset (elegant)
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            // Add formal watermark
            ctx.fillStyle = '#2c3e50';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('FORMAL', canvas.width / 2, canvas.height - 10);
            toast.info('Preset: Formal (Elegant)');
            break;
          case 'casual':
            // Casual preset (friendly)
            ctx.fillStyle = '#fff8dc';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#32cd32';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            // Add casual watermark
            ctx.fillStyle = '#32cd32';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('CASUAL', canvas.width / 2, canvas.height - 10);
            toast.info('Preset: Casual (Friendly)');
            break;
          case 'artistic':
            // Artistic preset (creative)
            ctx.fillStyle = '#ffe4e1';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#9370db';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            // Add artistic watermark
            ctx.fillStyle = '#9370db';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('ARTISTIC', canvas.width / 2, canvas.height - 10);
            toast.info('Preset: Artistic (Creative)');
            break;
        }
        
        // Restore signature if exists
        if (currentSignature) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = currentSignature;
        }
      }
    }
  };

  // Function to change signature template style
  const changeSignatureTemplate = (template: 'blank' | 'lined' | 'grid' | 'dotted' | 'ruled') => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Save current signature
        const currentSignature = signatureData;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Apply template based on type
        switch (template) {
          case 'blank':
            // Blank template (no lines)
            toast.info('Template: Blank (No lines)');
            break;
          case 'lined':
            // Lined template (horizontal lines)
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 1;
            for (let y = 20; y < canvas.height; y += 20) {
              ctx.beginPath();
              ctx.moveTo(0, y);
              ctx.lineTo(canvas.width, y);
              ctx.stroke();
            }
            toast.info('Template: Lined (Horizontal lines)');
            break;
          case 'grid':
            // Grid template (both horizontal and vertical lines)
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 1;
            for (let x = 0; x < canvas.width; x += 20) {
              ctx.beginPath();
              ctx.moveTo(x, 0);
              ctx.lineTo(x, canvas.height);
              ctx.stroke();
            }
            for (let y = 0; y < canvas.height; y += 20) {
              ctx.beginPath();
              ctx.moveTo(0, y);
              ctx.lineTo(canvas.width, y);
              ctx.stroke();
            }
            toast.info('Template: Grid (Both directions)');
            break;
          case 'dotted':
            // Dotted template (dotted pattern)
            ctx.fillStyle = '#e0e0e0';
            for (let x = 10; x < canvas.width; x += 20) {
              for (let y = 10; y < canvas.height; y += 20) {
                ctx.beginPath();
                ctx.arc(x, y, 1, 0, 2 * Math.PI);
                ctx.fill();
              }
            }
            toast.info('Template: Dotted (Dotted pattern)');
            break;
          case 'ruled':
            // Ruled template (ruled paper style)
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 1;
            // Top margin line
            ctx.beginPath();
            ctx.moveTo(0, 30);
            ctx.lineTo(canvas.width, 30);
            ctx.stroke();
            // Left margin line
            ctx.beginPath();
            ctx.moveTo(30, 0);
            ctx.lineTo(30, canvas.height);
            ctx.stroke();
            // Horizontal lines
            for (let y = 50; y < canvas.height; y += 20) {
              ctx.beginPath();
              ctx.moveTo(30, y);
              ctx.lineTo(canvas.width, y);
              ctx.stroke();
            }
            toast.info('Template: Ruled (Paper style)');
            break;
        }
        
        // Restore signature if exists
        if (currentSignature) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = currentSignature;
        }
      }
    }
  };

  // Function to change signature layout style
  const changeSignatureLayout = (layout: 'center' | 'left' | 'right' | 'top' | 'bottom') => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Save current signature
        const currentSignature = signatureData;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Apply layout based on type
        switch (layout) {
          case 'center':
            // Center layout (default)
            toast.info('Layout: Center (Default)');
            break;
          case 'left':
            // Left layout (left-aligned)
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, 50, canvas.height);
            toast.info('Layout: Left (Left-aligned)');
            break;
          case 'right':
            // Right layout (right-aligned)
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(canvas.width - 50, 0, 50, canvas.height);
            toast.info('Layout: Right (Right-aligned)');
            break;
          case 'top':
            // Top layout (top-aligned)
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, canvas.width, 50);
            toast.info('Layout: Top (Top-aligned)');
            break;
          case 'bottom':
            // Bottom layout (bottom-aligned)
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
            toast.info('Layout: Bottom (Bottom-aligned)');
            break;
        }
        
        // Restore signature if exists
        if (currentSignature) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = currentSignature;
        }
      }
    }
  };

  // Function to change signature style combination
  const changeSignatureStyleCombination = (combination: 'classic' | 'modern' | 'vintage' | 'futuristic' | 'nature') => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Save current signature
        const currentSignature = signatureData;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Apply style combination based on type
        switch (combination) {
          case 'classic':
            // Classic combination (black on white with subtle borders)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            // Add subtle border
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 1;
            ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            toast.info('Style Combination: Classic (Black on White with Border)');
            break;
          case 'modern':
            // Modern combination (blue on light blue with rounded corners)
            ctx.fillStyle = '#e3f2fd';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#1976d2';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            // Add rounded corners effect
            ctx.strokeStyle = '#1976d2';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(10, 10, canvas.width - 20, canvas.height - 20, 15);
            ctx.stroke();
            ctx.strokeStyle = '#1976d2';
            ctx.lineWidth = 4;
            toast.info('Style Combination: Modern (Blue with Rounded Corners)');
            break;
          case 'vintage':
            // Vintage combination (brown on cream with aged effect)
            ctx.fillStyle = '#f5f5dc';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#8b4513';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            // Add aged effect
            ctx.fillStyle = 'rgba(139, 69, 19, 0.1)';
            for (let i = 0; i < 100; i++) {
              const x = Math.random() * canvas.width;
              const y = Math.random() * canvas.height;
              ctx.fillRect(x, y, 2, 2);
            }
            ctx.strokeStyle = '#8b4513';
            ctx.lineWidth = 3;
            toast.info('Style Combination: Vintage (Brown with Aged Effect)');
            break;
          case 'futuristic':
            // Futuristic combination (cyan on dark with glow effect)
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            // Add glow effect
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            toast.info('Style Combination: Futuristic (Cyan with Glow)');
            break;
          case 'nature':
            // Nature combination (green on light green with organic pattern)
            ctx.fillStyle = '#e8f5e8';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#2e7d32';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            // Add organic pattern
            ctx.fillStyle = 'rgba(46, 125, 50, 0.1)';
            for (let i = 0; i < 50; i++) {
              const x = Math.random() * canvas.width;
              const y = Math.random() * canvas.height;
              const size = Math.random() * 4 + 1;
              ctx.beginPath();
              ctx.arc(x, y, size, 0, 2 * Math.PI);
              ctx.fill();
            }
            ctx.strokeStyle = '#2e7d32';
            ctx.lineWidth = 3;
            toast.info('Style Combination: Nature (Green with Organic Pattern)');
            break;
        }
        
        // Restore signature if exists
        if (currentSignature) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = currentSignature;
        }
        
        // Reset effects for future drawing
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
    }
  };

  // Function to change signature final style
  const changeSignatureFinalStyle = (style: 'clean' | 'decorative' | 'minimal' | 'elaborate' | 'custom') => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Save current signature
        const currentSignature = signatureData;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Apply final style based on type
        switch (style) {
          case 'clean':
            // Clean style (minimal, professional)
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            toast.info('Final Style: Clean (Minimal, Professional)');
            break;
          case 'decorative':
            // Decorative style (ornate, artistic)
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            // Add decorative elements
            ctx.strokeStyle = '#8b4513';
            ctx.lineWidth = 1;
            // Draw decorative border
            for (let i = 0; i < 4; i++) {
              ctx.strokeRect(10 + i * 5, 10 + i * 5, canvas.width - 20 - i * 10, canvas.height - 20 - i * 10);
            }
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            toast.info('Final Style: Decorative (Ornate, Artistic)');
            break;
          case 'minimal':
            // Minimal style (simple, elegant)
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            // Add minimal accent
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 1;
            ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            toast.info('Final Style: Minimal (Simple, Elegant)');
            break;
          case 'elaborate':
            // Elaborate style (detailed, complex)
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            // Add elaborate elements
            ctx.strokeStyle = '#8b4513';
            ctx.lineWidth = 1;
            // Draw corner decorations
            const cornerSize = 20;
            for (let i = 0; i < 4; i++) {
              const x = i < 2 ? 0 : canvas.width;
              const y = i % 2 === 0 ? 0 : canvas.height;
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(x + (i < 2 ? cornerSize : -cornerSize), y);
              ctx.lineTo(x + (i < 2 ? cornerSize : -cornerSize), y + (i % 2 === 0 ? cornerSize : -cornerSize));
              ctx.stroke();
            }
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            toast.info('Final Style: Elaborate (Detailed, Complex)');
            break;
          case 'custom':
            // Custom style (user-defined)
            const customColor = prompt('Enter custom color (hex):', '#000000');
            const customWidth = prompt('Enter custom line width (1-10):', '3');
            const customStyle = prompt('Enter custom style (solid, dashed, dotted):', 'solid');
            
            if (customColor && customWidth && customStyle) {
              const width = parseInt(customWidth);
              if (width >= 1 && width <= 10) {
                ctx.strokeStyle = customColor;
                ctx.lineWidth = width;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                
                // Apply custom line style
                switch (customStyle) {
                  case 'dashed':
                    ctx.setLineDash([10, 5]);
                    break;
                  case 'dotted':
                    ctx.setLineDash([2, 2]);
                    break;
                  default:
                    ctx.setLineDash([]);
                }
                
                toast.info(`Final Style: Custom (Color: ${customColor}, Width: ${width}, Style: ${customStyle})`);
              } else {
                toast.error('Invalid line width. Using clean style.');
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
              }
            }
            break;
        }
        
        // Restore signature if exists
        if (currentSignature) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = currentSignature;
        }
        
        // Reset line dash for future drawing
        ctx.setLineDash([]);
      }
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
      
      {/* Debug Information - Remove in production */}
      {import.meta.env.MODE === 'development' && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>🔧 Debug Info:</strong> API Base URL: {getApiBaseUrl()}
          </Typography>
          <Typography variant="body2">
            Environment: {import.meta.env.MODE} | VITE_API_URL: {import.meta.env.VITE_API_URL || 'Not set'}
          </Typography>
        </Alert>
      )}
      
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
      <Dialog open={photoDialogOpen} onClose={() => setPhotoDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Capture Owner/Tenant Photo</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            📸 This will open your device camera to capture a photo of the property owner or tenant.
            <br />
            💡 <strong>Tip:</strong> Use good lighting and ensure the person's face is clearly visible.
            {!checkCameraSupport() && (
              <>
                <br />
                ⚠️ <strong>Note:</strong> Your browser doesn't support camera access. Use file upload instead.
              </>
            )}
            {isMobileDevice() && (
              <>
                <br />
                📱 <strong>Mobile:</strong> Camera will open in your device's native camera app.
              </>
            )}
          </Alert>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {!capturedPhoto ? (
              <>
                <Button
                  variant="contained"
                  startIcon={photoCapturing ? <CircularProgress size={20} /> : <PhotoCamera />}
                  onClick={capturePhoto}
                  disabled={photoCapturing}
                  fullWidth
                  sx={{ p: 2, fontSize: '1.1rem' }}
                >
                  {photoCapturing ? '📸 Opening Camera...' : '📸 Open Camera & Capture Photo'}
                </Button>
                
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  OR
                </Typography>
                
                <Button
                  variant="outlined"
                  startIcon={<PhotoCamera />}
                  onClick={openFileInput}
                  fullWidth
                  sx={{ p: 2 }}
                >
                  📁 Upload Photo from Gallery
                </Button>
              </>
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom color="success.main">
                  ✅ Photo Captured Successfully!
                </Typography>
                
                <Box sx={{ 
                  border: '2px solid #4caf50', 
                  borderRadius: 2, 
                  p: 1, 
                  mb: 2,
                  display: 'inline-block'
                }}>
                  <img
                    src={capturedPhoto}
                    alt="Captured Photo"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      borderRadius: '8px'
                    }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                  <Button
                    variant="outlined"
                    startIcon={<PhotoCamera />}
                    onClick={capturePhoto}
                    size="small"
                  >
                    📸 Retake Photo
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<PhotoCamera />}
                    onClick={openFileInput}
                    size="small"
                  >
                    📁 Upload Different Photo
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Clear />}
                    onClick={clearCapturedPhoto}
                    size="small"
                  >
                    🗑️ Clear Photo
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
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
            ✍️ Draw your signature in the box below using mouse or touch.
            {isMobileDevice() && (
              <>
                <br />
                📱 <strong>Mobile:</strong> Use your finger to draw on the signature area below.
              </>
            )}
            <br />
            💡 <strong>Tip:</strong> Draw slowly and deliberately for the best signature quality.
          </Alert>
          
          <Box sx={{ textAlign: 'center', border: '2px dashed #ccc', p: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {isMobileDevice() ? '👆 Touch and drag here to sign' : '🖱️ Click and drag here to sign'}
            </Typography>
            
            <canvas
              ref={canvasRef}
              width={400}
              height={200}
              style={{ 
                border: '1px solid #000', 
                cursor: isMobileDevice() ? 'default' : 'crosshair',
                touchAction: 'none', // Prevent default touch behaviors
                backgroundColor: '#fafafa' // Light background for better visibility
              }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
            
            <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
              Signature area: 400x200 pixels
            </Typography>
            
            {/* Drawing Status Indicator */}
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              {isDrawing ? (
                <Alert severity="info" sx={{ py: 1 }}>
                  <Typography variant="body2">
                    ✍️ Drawing signature... Release to finish
                  </Typography>
                </Alert>
              ) : signatureData ? (
                <Alert severity="success" sx={{ py: 1 }}>
                  <Typography variant="body2">
                    ✅ Signature captured successfully
                  </Typography>
                </Alert>
              ) : (
                <Alert severity="info" sx={{ py: 1 }}>
                  <Typography variant="body2">
                    👆 Start drawing your signature above
                  </Typography>
                </Alert>
              )}
            </Box>
            
            {/* Drawing Controls */}
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Drawing Controls:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => adjustDrawingSettings('thinner')}
                >
                  📏 Thinner
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => adjustDrawingSettings('thicker')}
                >
                  📏 Thicker
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => adjustDrawingSettings('lighter')}
                >
                  🌫️ Lighter
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => adjustDrawingSettings('darker')}
                >
                  🌫️ Darker
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="secondary"
                  onClick={resetDrawingSettings}
                >
                  🔄 Reset
                </Button>
              </Box>
              
              {/* Color Selection */}
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Signature Colors:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureColor('#000000')}
                    sx={{ 
                      borderColor: '#000000', 
                      color: '#000000',
                      '&:hover': { borderColor: '#000000', backgroundColor: '#f0f0f0' }
                    }}
                  >
                    ⚫ Black
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureColor('#0000FF')}
                    sx={{ 
                      borderColor: '#0000FF', 
                      color: '#0000FF',
                      '&:hover': { borderColor: '#0000FF', backgroundColor: '#f08ff0' }
                    }}
                  >
                    🔵 Blue
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureColor('#FF0000')}
                    sx={{ 
                      borderColor: '#FF0000', 
                      color: '#FF0000',
                      '&:hover': { borderColor: '#FF0000', backgroundColor: '#ff0000' }
                    }}
                  >
                    🔴 Red
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureColor('#008000')}
                    sx={{ 
                      borderColor: '#008000', 
                      color: '#008000',
                      '&:hover': { borderColor: '#008000', backgroundColor: '#00ff00' }
                    }}
                  >
                    🟢 Green
                  </Button>
                </Box>
              </Box>
              
              {/* Style Selection */}
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Signature Styles:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureStyle('normal')}
                  >
                    ✍️ Normal
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureStyle('bold')}
                  >
                    ✍️ Bold
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureStyle('thin')}
                  >
                    ✍️ Thin
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureStyle('calligraphy')}
                  >
                    ✍️ Calligraphy
                  </Button>
                </Box>
              </Box>
              
              {/* Background Selection */}
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Background:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureBackground('white')}
                    sx={{ 
                      borderColor: '#ffffff', 
                      color: '#000000',
                      backgroundColor: '#ffffff',
                      '&:hover': { borderColor: '#ffffff', backgroundColor: '#f0f0f0' }
                    }}
                  >
                    ⚪ White
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureBackground('light')}
                    sx={{ 
                      borderColor: '#f5f5f5', 
                      color: '#000000',
                      backgroundColor: '#f5f5f5',
                      '&:hover': { borderColor: '#f5f5f5', backgroundColor: '#e0e0e0' }
                    }}
                  >
                    ⚪ Light
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureBackground('dark')}
                    sx={{ 
                      borderColor: '#2c2c2c', 
                      color: '#ffffff',
                      backgroundColor: '#2c2c2c',
                      '&:hover': { borderColor: '#2c2c2c', backgroundColor: '#404040' }
                    }}
                  >
                    ⚫ Dark
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureBackground('transparent')}
                  >
                    🔍 Transparent
                  </Button>
                </Box>
              </Box>
              
              {/* Paper Size Selection */}
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Paper Size:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changePaperSize('small')}
                  >
                    📄 Small
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changePaperSize('medium')}
                  >
                    📄 Medium
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changePaperSize('large')}
                  >
                    📄 Large
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changePaperSize('custom')}
                  >
                    📄 Custom
                  </Button>
                </Box>
              </Box>
              
              {/* Orientation Selection */}
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Orientation:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureOrientation('landscape')}
                  >
                    📐 Landscape
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureOrientation('portrait')}
                  >
                    📐 Portrait
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureOrientation('square')}
                  >
                    📐 Square
                  </Button>
                </Box>
              </Box>
              
              {/* Paper Type Selection */}
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Paper Type:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changePaperType('plain')}
                  >
                    📄 Plain
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changePaperType('lined')}
                  >
                    📄 Lined
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changePaperType('grid')}
                  >
                    📄 Grid
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changePaperType('dotted')}
                  >
                    📄 Dotted
                  </Button>
                </Box>
              </Box>
              
              {/* Margin Selection */}
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Margins:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureMargins('none')}
                  >
                    📏 None
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureMargins('small')}
                  >
                    📏 Small
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureMargins('medium')}
                  >
                    📏 Medium
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureMargins('large')}
                  >
                    📏 Large
                  </Button>
                </Box>
              </Box>
              
              {/* Watermark Selection */}
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Watermark:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureWatermark('none')}
                  >
                    🚫 None
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureWatermark('draft')}
                  >
                    📝 Draft
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureWatermark('confidential')}
                  >
                    🔒 Confidential
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureWatermark('approved')}
                  >
                    ✅ Approved
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureWatermark('custom')}
                  >
                    ✏️ Custom
                  </Button>
                </Box>
              </Box>
              
              {/* Border Selection */}
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Border Style:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureBorder('none')}
                  >
                    🚫 None
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureBorder('solid')}
                  >
                    ▬ Solid
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureBorder('dashed')}
                  >
                    ▬ Dashed
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureBorder('dotted')}
                  >
                    ▬ Dotted
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureBorder('double')}
                  >
                    ▬ Double
                  </Button>
                </Box>
              </Box>
              
              {/* Corner Selection */}
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Corner Style:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureCorner('square')}
                  >
                    ⬜ Square
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureCorner('rounded')}
                  >
                    ⬜ Rounded
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureCorner('beveled')}
                  >
                    ⬜ Beveled
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureCorner('decorative')}
                  >
                    ⬜ Decorative
                  </Button>
                </Box>
              </Box>
              
              {/* Shadow Selection */}
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Shadow Style:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureShadow('none')}
                  >
                    🚫 None
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureShadow('light')}
                  >
                    🌫️ Light
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureShadow('medium')}
                  >
                    🌫️ Medium
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureShadow('heavy')}
                  >
                    🌫️ Heavy
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureShadow('colored')}
                  >
                    🌫️ Colored
                  </Button>
                </Box>
              </Box>
              
              {/* Texture Selection */}
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Texture Style:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureTexture('none')}
                  >
                    🚫 None
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureTexture('paper')}
                  >
                    📄 Paper
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureTexture('canvas')}
                  >
                    🎨 Canvas
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureTexture('leather')}
                  >
                    🧵 Leather
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureTexture('metal')}
                  >
                    ⚙️ Metal
                  </Button>
                </Box>
              </Box>
              
              {/* Filter Selection */}
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Filter Style:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureFilter('none')}
                  >
                    🚫 None
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureFilter('sepia')}
                  >
                    🟫 Sepia
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureFilter('grayscale')}
                  >
                    ⚫ Grayscale
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureFilter('invert')}
                  >
                    🔄 Invert
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureFilter('blur')}
                  >
                    🌫️ Blur
                  </Button>
                </Box>
              </Box>
              
              {/* Effect Selection */}
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Effect Style:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureEffect('none')}
                  >
                    🚫 None
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureEffect('glow')}
                  >
                    ✨ Glow
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureEffect('neon')}
                  >
                    ✨ Neon
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureEffect('emboss')}
                  >
                    ✨ Emboss
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureEffect('outline')}
                  >
                    ✨ Outline
                  </Button>
                </Box>
              </Box>
              
              {/* Animation Selection */}
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Animation Style:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureAnimation('none')}
                  >
                    🚫 None
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureAnimation('fade')}
                  >
                    🌫️ Fade
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureAnimation('slide')}
                  >
                    ➡️ Slide
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureAnimation('bounce')}
                  >
                    ⬆️ Bounce
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureAnimation('rotate')}
                  >
                    🔄 Rotate
                  </Button>
                </Box>
              </Box>
              
              {/* Theme Selection */}
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Theme Style:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureTheme('classic')}
                  >
                    🎨 Classic
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureTheme('modern')}
                  >
                    🎨 Modern
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureTheme('vintage')}
                  >
                    🎨 Vintage
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureTheme('futuristic')}
                  >
                    🎨 Futuristic
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureTheme('nature')}
                  >
                    🎨 Nature
                  </Button>
                </Box>
              </Box>
              
              {/* Quality Selection */}
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Quality Style:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureQuality('low')}
                  >
                    📉 Low
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureQuality('medium')}
                  >
                    📊 Medium
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureQuality('high')}
                  >
                    📈 High
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureQuality('ultra')}
                  >
                    📈 Ultra
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureQuality('custom')}
                  >
                    ⚙️ Custom
                  </Button>
                </Box>
              </Box>
              
              {/* Export Style Selection */}
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Export Style:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureExportStyle('standard')}
                  >
                    📤 Standard
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureExportStyle('premium')}
                  >
                    📤 Premium
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureExportStyle('print')}
                  >
                    📤 Print
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureExportStyle('web')}
                  >
                    📤 Web
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureExportStyle('mobile')}
                  >
                    📤 Mobile
                  </Button>
                </Box>
              </Box>
              
              {/* Preset Selection */}
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Preset Style:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignaturePreset('business')}
                  >
                    💼 Business
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignaturePreset('creative')}
                  >
                    🎨 Creative
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignaturePreset('formal')}
                  >
                    🎩 Formal
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignaturePreset('casual')}
                  >
                    😊 Casual
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignaturePreset('artistic')}
                  >
                    🖼️ Artistic
                  </Button>
                </Box>
              </Box>
              
              {/* Template Selection */}
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Template Style:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureTemplate('blank')}
                  >
                    📄 Blank
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureTemplate('lined')}
                  >
                    📄 Lined
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureTemplate('grid')}
                  >
                    📄 Grid
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureTemplate('dotted')}
                  >
                    📄 Dotted
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureTemplate('ruled')}
                  >
                    📄 Ruled
                  </Button>
                </Box>
              </Box>
              
              {/* Layout Selection */}
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Layout Style:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureLayout('center')}
                  >
                    🎯 Center
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureLayout('left')}
                  >
                    ⬅️ Left
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureLayout('right')}
                  >
                    ➡️ Right
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureLayout('top')}
                  >
                    ⬆️ Top
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureLayout('bottom')}
                  >
                    ⬇️ Bottom
                  </Button>
                </Box>
              </Box>
              
              {/* Style Combination Selection */}
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Style Combination:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureStyleCombination('classic')}
                  >
                    🎨 Classic
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureStyleCombination('modern')}
                  >
                    🎨 Modern
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureStyleCombination('vintage')}
                  >
                    🎨 Vintage
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureStyleCombination('futuristic')}
                  >
                    🎨 Futuristic
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureStyleCombination('nature')}
                  >
                    🎨 Nature
                  </Button>
                </Box>
              </Box>
              
              {/* Final Style Selection */}
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Final Style:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureFinalStyle('clean')}
                  >
                    ✨ Clean
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureFinalStyle('decorative')}
                  >
                    ✨ Decorative
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureFinalStyle('minimal')}
                  >
                    ✨ Minimal
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureFinalStyle('elaborate')}
                  >
                    ✨ Elaborate
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => changeSignatureFinalStyle('custom')}
                  >
                    ✨ Custom
                  </Button>
                </Box>
              </Box>
            </Box>
            
            {/* Zoom Controls */}
            <Box sx={{ mt: 1, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Zoom Controls:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleZoom('out')}
                >
                  🔍 Zoom Out
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleZoom('in')}
                >
                  🔍 Zoom In
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="secondary"
                  onClick={resetCanvasSize}
                >
                  📐 Reset Size
                </Button>
              </Box>
            </Box>
            
            {/* Export Controls */}
            {signatureData && (
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Export Signature:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => exportSignature('png')}
                  >
                    📥 PNG
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => exportSignature('jpeg')}
                  >
                    📥 JPEG
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => exportSignature('svg')}
                  >
                    📥 SVG
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={clearSignatureFromForm} startIcon={<Clear />}>
            Clear
          </Button>
          <Button onClick={undoLastDrawing} variant="outlined" size="small">
            Undo
          </Button>
          <Button onClick={importSignature} variant="outlined" size="small">
            Import
          </Button>
          <Button onClick={showSignaturePreview} variant="outlined" size="small">
            Preview
          </Button>
          <Button onClick={showDrawingStats} variant="outlined" size="small">
            Stats
          </Button>
          <Button onClick={showHelp} variant="outlined" size="small">
            Help
          </Button>
          <Button onClick={toggleFullScreen} variant="outlined" size="small">
            Full Screen
          </Button>
          <Button onClick={testSignatureDrawing} variant="outlined" size="small">
            Test Drawing
          </Button>
          <Button onClick={() => setSignatureOpen(false)}>Cancel</Button>
          <Button
            onClick={saveSignature}
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