// src/App.js
import React, { useState, useEffect } from 'react';
import { Search, Filter, FileText, Info, Calendar, Clock, Book, Award, School } from 'lucide-react';
import { fetchAssessmentData } from './services/googleSheetsService';
import './App.css';

// Pearson logo SVG inline as a component
const PearsonLogo = () => (
  <svg width="120" height="36" viewBox="0 0 120 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M60 18C60 27.9411 51.9411 36 42 36C32.0589 36 24 27.9411 24 18C24 8.05887 32.0589 0 42 0C51.9411 0 60 8.05887 60 18Z" fill="#003057"/>
    <path d="M42 32C49.732 32 56 25.732 56 18C56 10.268 49.732 4 42 4C34.268 4 28 10.268 28 18C28 25.732 34.268 32 42 32Z" fill="white"/>
    <path d="M42 28C47.5228 28 52 23.5228 52 18C52 12.4772 47.5228 8 42 8C36.4772 8 32 12.4772 32 18C32 23.5228 36.4772 28 42 28Z" fill="#003057"/>
    <path d="M69 10H73.5C77.5 10 79.5 12 79.5 15C79.5 18 77.5 20 73.5 20H69V10ZM73.5 18C76 18 77 17 77 15C77 13 76 12 73.5 12H71.5V18H73.5Z" fill="#003057"/>
    <path d="M87 14.5C87 15.5 86.5 16 85 16H83V13H85C86.5 13 87 13.5 87 14.5ZM89.5 14.5C89.5 12 88 10.5 85.5 10.5H80.5V20H83V18.5H85.5C88 18.5 89.5 17 89.5 14.5Z" fill="#003057"/>
    <path d="M98 15.5H93V18H98.5V20H90.5V10.5H98.5V12.5H93V13.5H98V15.5Z" fill="#003057"/>
    <path d="M105 15.5H100V18H105.5V20H97.5V10.5H105.5V12.5H100V13.5H105V15.5Z" fill="#003057"/>
    <path d="M109.5 12.5V14H114V16H109.5V20H107V10.5H115V12.5H109.5Z" fill="#003057"/>
    <path d="M116 20V10.5H118.5V20H116Z" fill="#003057"/>
  </svg>
);

const App = () => {
  // State for the application
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [assessmentData, setAssessmentData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [activeQualification, setActiveQualification] = useState('all');
  const [activeAssessmentType, setActiveAssessmentType] = useState('all');
  const [activeSector, setActiveSector] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for the details panel
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Define qualification types and colors
  const qualificationTypes = {
    'RQF BTEC National': { color: 'bg-blue-500', textColor: 'text-blue-700', icon: Award },
    'NQF BTEC First': { color: 'bg-green-500', textColor: 'text-green-700', icon: School },
    'BTEC Technical': { color: 'bg-purple-500', textColor: 'text-purple-700', icon: Book },
    'BTEC Tech Award 2022': { color: 'bg-orange-500', textColor: 'text-orange-700', icon: Calendar }
  };

  // Fetch data when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const data = await fetchAssessmentData();
        setAssessmentData(data);
        setFilteredData(data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading assessment data:', error);
        setLoadError('Failed to load assessment data. Please try again later.');
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Filter data based on selected filters and search term
  useEffect(() => {
    const filterData = () => {
      let result = [...assessmentData]; // Initialize result with assessmentData
  
      // Filter by qualification type
      if (activeQualification !== 'all') {
        result = result.filter(item => item.qualification === activeQualification);
      }
  
      // Filter by assessment type
      if (activeAssessmentType !== 'all') {
        result = result.filter(item => item.examType === activeAssessmentType);
      }
  
      // Filter by sector
      if (activeSector !== 'all') {
        result = result.filter(item => item.sector === activeSector);
      }
  
      // Filter by search term
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        result = result.filter(
          item =>
            (item.componentName && item.componentName.toLowerCase().includes(search)) ||
            (item.componentCode && item.componentCode.toLowerCase().includes(search)) ||
            (item.sector && item.sector.toLowerCase().includes(search))
        );
      }
  
      setFilteredData(result);
    };
  
    filterData();
  }, [activeQualification, activeAssessmentType, activeSector, searchTerm, assessmentData]);

  // Handle assessment selection and detail view
  const handleSelectAssessment = (assessment) => {
    setSelectedAssessment(assessment);
    setShowDetails(true);
  };

  // Get unique sectors for filter dropdown
  const sectors = ['all', ...new Set(assessmentData.map(item => item.sector).filter(Boolean))];

  // Getting qualification badge based on type
  const getQualificationBadge = (qualification) => {
    const typeInfo = qualificationTypes[qualification] || { 
      color: 'bg-gray-500', 
      textColor: 'text-gray-700',
      icon: FileText
    };
    
    const Icon = typeInfo.icon;
    
    return (
      <div className="flex items-center gap-1">
        <div className={`${typeInfo.color} text-white p-1 rounded-md w-6 h-6 flex items-center justify-center`}>
          <Icon size={14} />
        </div>
        <span className={`${typeInfo.textColor} text-xs font-medium`}>
          {qualification}
        </span>
      </div>
    );
  };

  // Function to close the details panel
  const closeDetails = () => {
    setShowDetails(false);
    setSelectedAssessment(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-500">Loading assessment data...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-sm max-w-md text-center">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{loadError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">BTEC External Assessment Viewer</h1>
              <p className="text-gray-500 text-sm mt-1">Find information about external assessments for BTEC qualifications</p>
            </div>
            <div>
              <PearsonLogo />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 mt-6 sm:px-6 lg:px-8">
        {/* Search and Filter section */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="flex items-center border rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <Search size={18} className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search by component name or code..."
                className="flex-1 outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Qualification Type Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Qualification Type</label>
              <select 
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={activeQualification}
                onChange={(e) => setActiveQualification(e.target.value)}
              >
                <option value="all">All Qualification Types</option>
                {Object.keys(qualificationTypes).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            {/* Assessment Type Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Assessment Type</label>
              <select 
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={activeAssessmentType}
                onChange={(e) => setActiveAssessmentType(e.target.value)}
              >
                <option value="all">All Assessment Types</option>
                <option value="Exam">Exam</option>
                <option value="Task">Task</option>
              </select>
            </div>
            
            {/* Sector Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Sector</label>
              <select 
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={activeSector}
                onChange={(e) => setActiveSector(e.target.value)}
              >
                <option value="all">All Sectors</option>
                {sectors.filter(s => s !== 'all').map(sector => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Results count */}
          <div className="mt-4 pt-3 border-t">
            <p className="text-sm text-gray-600">
              <Filter size={14} className="inline mr-1" />
              Showing {filteredData.length} of {assessmentData.length} assessments
            </p>
          </div>
        </div>
        
        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredData.length > 0 ? (
            filteredData.map((assessment, index) => (
              <div 
                key={`${assessment.componentCode}-${index}`}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleSelectAssessment(assessment)}
              >
                <div className="p-4">
                  {/* Badge and assessment type */}
                  <div className="flex items-center justify-between mb-2">
                    {getQualificationBadge(assessment.qualification)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      assessment.examType === 'Exam' 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {assessment.examType}
                    </span>
                  </div>
                  
                  {/* Component name and code */}
                  <h3 className="text-base font-medium text-gray-900 mt-2">{assessment.componentName}</h3>
                  <p className="text-sm text-gray-500 mt-1">Code: {assessment.componentCode}</p>
                  
                  {/* Sector */}
                  <p className="text-xs text-gray-600 mt-3 flex items-center">
                    <Book size={14} className="inline mr-1" />
                    {assessment.sector}
                  </p>
                  
                  {/* Duration */}
                  <p className="text-xs text-gray-600 mt-2 flex items-center">
                    <Clock size={14} className="inline mr-1" />
                    Duration: {assessment.duration}
                  </p>
                  
                  {/* View details button */}
                  <button 
                    className="mt-4 text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAssessment(assessment);
                    }}
                  >
                    <Info size={14} className="mr-1" />
                    View Details
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex items-center justify-center bg-white rounded-lg shadow-sm p-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center p-2 bg-gray-100 rounded-full mb-4">
                  <Search size={24} className="text-gray-400" />
                </div>
                <h3 className="text-gray-900 font-medium">No assessments found</h3>
                <p className="text-gray-500 mt-1">Try adjusting your filters or search terms</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Details Panel */}
        {showDetails && selectedAssessment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
              {/* Header */}
              <div className="p-4 border-b sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">{selectedAssessment.componentName}</h2>
                  <button 
                    className="p-1 rounded-full hover:bg-gray-100"
                    onClick={closeDetails}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center mt-2">
                  {getQualificationBadge(selectedAssessment.qualification)}
                  <span className="mx-2 text-gray-300">•</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedAssessment.examType === 'Exam' 
                      ? 'bg-orange-100 text-orange-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedAssessment.examType}
                  </span>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div>
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Component Information</h3>
                      <p className="text-sm"><span className="font-medium">Code:</span> {selectedAssessment.componentCode}</p>
                      <p className="text-sm mt-2"><span className="font-medium">Sector:</span> {selectedAssessment.sector}</p>
                      <p className="text-sm mt-2"><span className="font-medium">Duration:</span> {selectedAssessment.duration}</p>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Access and Control</h3>
                      <p className="text-sm"><span className="font-medium">Access Arrangements:</span> {selectedAssessment.access}</p>
                      <p className="text-sm mt-2"><span className="font-medium">Level of Control:</span> {selectedAssessment.levelOfControl}</p>
                      <p className="text-sm mt-2"><span className="font-medium">Invigilator Required:</span> {selectedAssessment.invigilator}</p>
                    </div>
                  </div>
                  
                  {/* Right Column */}
                  <div>
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Additional Information</h3>
                      <p className="text-sm">{selectedAssessment.additionalInfo}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Qualification Sizes</h3>
                      <p className="text-sm">{selectedAssessment.qualificationSizes}</p>
                    </div>
                  </div>
                </div>
                
                {/* Call to Action */}
                <div className="mt-8 pt-4 border-t">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">Need more information?</h3>
                    <p className="text-sm text-blue-700">
                      For more detailed information about this assessment, please refer to the qualification specification or contact your Pearson representative.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="mt-12 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Pearson Education Ltd. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0">
              <p className="text-xs text-gray-400">
                This tool is designed to provide guidance only. Always refer to the official qualification specification for definitive information.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
