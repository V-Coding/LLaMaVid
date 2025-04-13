import React, { useState, useRef } from 'react';
import ReactPlayer from 'react-player';
import './App.css';

function App() {
  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [description, setDescription] = useState('');
  const [detectionTimestamps, setDetectionTimestamps] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [everyNSeconds, setEveryNSeconds] = useState(2.0);
  const [maxFrames, setMaxFrames] = useState(20);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState(null);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [transcription, setTranscription] = useState([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribingVideoId, setTranscribingVideoId] = useState(null);
  const playerRef = useRef(null);
  const [thumbnails, setThumbnails] = useState({});
  const canvasRef = useRef(null);

  const formatTimestamp = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleVideoUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const videoUrl = URL.createObjectURL(file);
      const newVideo = {
        id: Date.now(),
        url: videoUrl,
        file: file,
        name: file.name,
        description: '',
        timestamps: [],
        transcription: []
      };
      setVideos([...videos, newVideo]);
      setCurrentVideo(newVideo);
      setActiveTab(newVideo.id);
      setError(null);
      setIsTranscribing(true);
      setTranscribingVideoId(newVideo.id);
      
      // Get transcription for the video
      try {
        const formData = new FormData();
        formData.append('video', file);
        formData.append('description', '');

        const response = await fetch('http://localhost:5000/transcribe', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to get transcription');
        }

        const data = await response.json();
        const transcriptionData = data.segments || [];
        
        // Update both the current video and the videos array with the transcription
        const updatedVideo = {
          ...newVideo,
          transcription: transcriptionData
        };
        
        setVideos(prevVideos => prevVideos.map(v => v.id === newVideo.id ? updatedVideo : v));
        setCurrentVideo(updatedVideo);
        setTranscription(transcriptionData);
      } catch (err) {
        console.error('Error getting transcription:', err);
        setTranscription([{ text: "Transcription could not be generated", start: 0, end: 0 }]);
      } finally {
        setIsTranscribing(false);
        setTranscribingVideoId(null);
      }
    }
  };

  const handleDeleteVideo = (videoId) => {
    // If we're deleting the currently active video, clear the current video
    if (currentVideo && currentVideo.id === videoId) {
      setCurrentVideo(null);
      setActiveTab(null);
      setDescription('');
      setDetectionTimestamps([]);
      setThumbnails({});
      setTranscription([]);
    }
    
    // Remove the video from the list
    setVideos(videos.filter(video => video.id !== videoId));
  };

  const handleDescriptionSubmit = async () => {
    if (!currentVideo || !description) {
      setError("Please upload a video and enter a description");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('video', currentVideo.file);
      formData.append('description', description);
      formData.append('every_n_seconds', everyNSeconds.toString());
      formData.append('max_frames', maxFrames.toString());

      const response = await fetch('http://localhost:5000/detect', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          // Server returned an HTML error page
          const text = await response.text();
          console.error('Server returned HTML error page:', text);
          throw new Error('Server error - please check if the backend server is running');
        }
        
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process video');
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Unexpected response type:', contentType, text);
        throw new Error('Server returned unexpected response format');
      }

      const data = await response.json();
      console.log('Raw API Response:', data);

      if (!data.timestamps || !Array.isArray(data.timestamps)) {
        throw new Error('Invalid response format: timestamps array not found');
      }

      const timestamps = data.timestamps.map(second => {
        const start = parseFloat(second);
        if (isNaN(start)) {
          console.error('Invalid timestamp value:', second);
          return null;
        }
        return {
          start: start.toFixed(1),
          end: (start + everyNSeconds).toFixed(1)
        };
      }).filter(ts => ts !== null);

      if (timestamps.length === 0) {
        throw new Error('No valid timestamps found in response');
      }

      // Capture thumbnails for all timestamps
      const newThumbnails = {};
      for (const timestamp of timestamps) {
        const thumbnail = await captureFrame(currentVideo, timestamp);
        if (thumbnail) {
          newThumbnails[timestamp.start] = thumbnail;
        }
      }
      setThumbnails(prev => ({ ...prev, ...newThumbnails }));

      const updatedVideo = {
        ...currentVideo,
        description,
        timestamps
      };

      setVideos(videos.map(v => v.id === currentVideo.id ? updatedVideo : v));
      setCurrentVideo(updatedVideo);
      setDetectionTimestamps(timestamps);
    } catch (err) {
      console.error('Error processing video:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const captureFrame = async (video, timestamp) => {
    if (!canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const videoElement = document.querySelector('.react-player video');
    
    if (!videoElement) return null;

    // Set canvas size while maintaining aspect ratio
    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;
    const aspectRatio = videoWidth / videoHeight;
    
    // Target thumbnail size
    const targetWidth = 160;
    const targetHeight = 90;
    
    // Calculate dimensions that maintain aspect ratio
    let width = targetWidth;
    let height = targetHeight;
    
    if (aspectRatio > targetWidth / targetHeight) {
      // Video is wider than target
      height = targetWidth / aspectRatio;
    } else {
      // Video is taller than target
      width = targetHeight * aspectRatio;
    }
    
    canvas.width = width;
    canvas.height = height;

    // Seek to the timestamp
    videoElement.currentTime = parseFloat(timestamp.start);
    
    // Wait for the video to seek
    await new Promise(resolve => {
      videoElement.addEventListener('seeked', resolve, { once: true });
    });

    // Draw the frame
    context.drawImage(videoElement, 0, 0, width, height);
    
    // Convert to data URL
    return canvas.toDataURL('image/jpeg');
  };

  const handleTimestampClick = async (timestamp) => {
    if (currentVideo && playerRef.current) {
      playerRef.current.seekTo(parseFloat(timestamp.start));
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const themeClasses = {
    container: isDarkMode ? 'bg-black text-green-500 font-mono' : 'bg-gray-50 text-gray-800 font-mono',
    card: isDarkMode ? 'bg-gray-900 border-green-500' : 'bg-white border-gray-300 shadow-sm',
    input: isDarkMode ? 'bg-black text-green-500 border-green-500 placeholder-green-700' : 'bg-white text-gray-800 border-gray-300 placeholder-gray-400',
    button: isDarkMode ? 'bg-green-900 hover:bg-green-800 text-green-400 border-green-500' : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500',
    fileButton: isDarkMode ? 'bg-green-900 hover:bg-green-800 text-green-400 border-green-500' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300',
    timestampButton: isDarkMode ? 'bg-green-900 hover:bg-green-800 text-green-400 border-green-500' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300',
    error: isDarkMode ? 'bg-red-900 text-red-400 border-red-500' : 'bg-red-100 text-red-800 border-red-300',
    heading: isDarkMode ? 'text-green-400' : 'text-gray-800',
    label: isDarkMode ? 'text-green-400' : 'text-gray-700',
    helper: isDarkMode ? 'text-green-600' : 'text-gray-500',
    tab: isDarkMode ? 'bg-gray-900 border-green-500' : 'bg-gray-100 border-gray-300 hover:bg-gray-200',
    activeTab: isDarkMode ? 'bg-green-900 text-green-400 border-green-500' : 'bg-emerald-600 text-white border-emerald-500',
  };

  return (
    <div className={`min-h-screen p-8 ${themeClasses.container} ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 -ml-4">
          <div className="flex items-center space-x-4">
            <svg 
              className={`w-8 h-8 ${isDarkMode ? 'text-green-500' : 'text-emerald-600'}`} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            <h1 className={`text-3xl font-bold ${themeClasses.heading} tracking-wider`}>
              <span className={isDarkMode ? "text-green-500" : "text-emerald-600"}>[</span>FrameSleuth<span className={isDarkMode ? "text-green-500" : "text-emerald-600"}>]</span>
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
              className={`p-2 rounded-lg border ${themeClasses.timestampButton} tracking-wider`}
            >
              <span className="text-green-500">[</span>
              {isLeftSidebarCollapsed ? 'SHOW SETTINGS' : 'HIDE SETTINGS'}
              <span className="text-green-500">]</span>
            </button>
            <span className={`text-sm ${themeClasses.helper}`}>[TERMINAL]</span>
            <button
              onClick={toggleTheme}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                isDarkMode ? 'bg-green-900' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-green-400 transform transition-transform duration-200 ${
                  isDarkMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-sm ${themeClasses.helper}`}>[LIGHT]</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-0 flex justify-center">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {videos.map((video) => (
              <div key={video.id} className="flex items-center group">
                <button
                  onClick={() => {
                    setActiveTab(video.id);
                    setCurrentVideo(video);
                    setDescription(video.description);
                    setDetectionTimestamps(video.timestamps);
                    setTranscription(video.transcription || []);
                  }}
                  className={`px-4 py-2 rounded-t-lg border border-b-0 transition-colors duration-200 relative group ${
                    activeTab === video.id
                      ? themeClasses.activeTab
                      : `${themeClasses.tab} hover:bg-opacity-80`
                  }`}
                >
                  <span className="text-green-500">[</span>{video.name}<span className="text-green-500">]</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteVideo(video.id);
                    }}
                    className={`absolute top-0 right-0 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-transparent`}
                    title="Delete video"
                  >
                    <span className="text-red-500 hover:text-red-400">×</span>
                  </button>
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                setActiveTab(null);
                setCurrentVideo(null);
                setDescription('');
                setDetectionTimestamps([]);
                setTranscription([]);
              }}
              className={`px-4 py-2 rounded-t-lg border border-b-0 transition-colors duration-200 ${
                activeTab === null
                  ? themeClasses.activeTab
                  : `${themeClasses.tab} hover:bg-opacity-80`
              }`}
            >
              <span className="text-green-500">[</span>+ NEW SCAN<span className="text-green-500">]</span>
            </button>
          </div>
        </div>
        
        {error && (
          <div className={`mb-4 p-4 rounded-lg border ${themeClasses.error}`}>
            {error}
          </div>
        )}
        
        <div className="relative">
          {/* Left sidebar - Object description and settings */}
          <div className={`fixed left-0 top-0 h-[calc(100vh-16rem)] mt-40 w-80 transform transition-transform duration-300 ease-in-out ${
            isLeftSidebarCollapsed ? '-translate-x-80' : 'translate-x-0'
          }`}>
            <div className={`h-full p-6 rounded-lg shadow-lg border ${themeClasses.card} overflow-y-auto scrollbar-thin scrollbar-thumb-green-500 scrollbar-track-transparent`}>
              {activeTab === null ? (
                <div className="space-y-6">
                  <h2 className={`text-xl font-semibold mb-4 ${themeClasses.heading}`}>Upload Video</h2>
                  <div className="relative">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      id="video-upload"
                    />
                    <label
                      htmlFor="video-upload"
                      className={`block w-full px-4 py-2 text-center rounded-lg border ${themeClasses.button} cursor-pointer`}
                    >
                      Choose Video File
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <h2 className={`text-xl font-semibold mb-0 ${themeClasses.heading}`}>Target Description</h2>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the object or person you want to detect..."
                    className={`w-full h-32 p-2 border rounded-lg ${themeClasses.input} placeholder-gray-400`}
                  />
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${themeClasses.label}`}>
                      Frame Sampling Interval (seconds)
                    </label>
                    <input
                      type="number"
                      value={everyNSeconds}
                      onChange={(e) => setEveryNSeconds(parseFloat(e.target.value))}
                      min="0.1"
                      max="10"
                      step="0.1"
                      className={`w-full p-2 border rounded-lg ${themeClasses.input}`}
                      placeholder="Enter interval in seconds"
                    />
                    <p className={`mt-1 text-sm ${themeClasses.helper}`}>
                      Lower values will check more frames but take longer to process
                    </p>
                  </div>

                  <button
                    onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                    className={`w-full p-2 rounded-lg border ${themeClasses.timestampButton} tracking-wider`}
                  >
                    <span className="text-green-500">[</span>
                    {showAdvancedSettings ? 'HIDE ADVANCED PARAMETERS' : 'SHOW ADVANCED PARAMETERS'}
                    <span className="text-green-500">]</span>
                  </button>

                  {showAdvancedSettings && (
                    <div className="p-4 rounded-lg border border-green-500">
                      <h3 className={`text-sm font-medium mb-4 ${themeClasses.label} tracking-wider`}>
                        <span className="text-green-500">[</span>ADVANCED PARAMETERS<span className="text-green-500">]</span>
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${themeClasses.label} tracking-wider`}>
                            <span className="text-green-500">[</span>MAX FRAME SCAN COUNT<span className="text-green-500">]</span>
                          </label>
                          <input
                            type="number"
                            value={maxFrames}
                            onChange={(e) => setMaxFrames(parseInt(e.target.value))}
                            min="1"
                            max="100"
                            step="1"
                            className={`w-full p-2 border rounded-lg ${themeClasses.input} tracking-wider`}
                            placeholder="ENTER FRAME COUNT"
                          />
                          <p className={`mt-1 text-sm ${themeClasses.helper} tracking-wider`}>
                            <span className="text-green-500">[</span>WARNING: HIGHER VALUES INCREASE PROCESSING TIME<span className="text-green-500">]</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleDescriptionSubmit}
                    disabled={isLoading}
                    className={`w-full px-4 py-2 rounded-lg ${
                      isLoading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : themeClasses.button
                    } text-white font-semibold`}
                  >
                    {isLoading ? 'Processing...' : 'Run Analysis'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Center - Video player */}
          <div className={`transition-all duration-300 ${
            isLeftSidebarCollapsed ? 'ml-0' : 'ml-80'
          }`}>
            <div className="max-w-7xl mx-auto">
              {currentVideo && (
                <div className="flex gap-6">
                  <div className={`rounded-lg shadow-lg border ${themeClasses.card} w-[calc(100%-8rem)] -ml-32`}>
                    <div className="flex justify-between items-center mb-4 px-6 pt-6">
                      <h2 className={`text-xl font-semibold ${themeClasses.heading}`}>Video Analysis</h2>
                      <div className="flex space-x-2">
                        {detectionTimestamps.length > 0 && (
                          <button
                            onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
                            className={`p-2 rounded-lg border ${themeClasses.timestampButton} tracking-wider`}
                          >
                            <span className={isDarkMode ? "text-green-500" : "text-gray-800"}>[</span>
                            {isRightSidebarCollapsed ? 'SHOW TIMESTAMPS' : 'HIDE TIMESTAMPS'}
                            <span className={isDarkMode ? "text-green-500" : "text-gray-800"}>]</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className={`aspect-video rounded-lg overflow-hidden border ${themeClasses.input} mx-6 mb-6`}>
                      <ReactPlayer
                        ref={playerRef}
                        url={currentVideo.url}
                        controls
                        width="100%"
                        height="100%"
                        className="react-player"
                      />
                    </div>

                    {/* Timestamps section */}
                    {!isRightSidebarCollapsed && detectionTimestamps.length > 0 && (
                      <div className="px-6 pb-6">
                        <h2 className={`text-xl font-semibold mb-4 ${themeClasses.heading}`}>Detection Timestamps</h2>
                        <div className="overflow-x-auto">
                          <div className="flex space-x-4 pb-4" style={{ width: '100%' }}>
                            {detectionTimestamps.map((timestamp, index) => (
                              <div key={index} className="flex flex-col items-center space-y-2 min-w-[200px] flex-shrink-0">
                                <div className="w-full h-32 rounded-lg overflow-hidden border border-gray-600 flex items-center justify-center">
                                  {thumbnails[timestamp.start] ? (
                                    <img 
                                      src={thumbnails[timestamp.start]} 
                                      alt={`Frame at ${timestamp.start}s`}
                                      className="max-w-full max-h-full object-contain"
                                    />
                                  ) : (
                                    <div className={`w-full h-full flex items-center justify-center ${themeClasses.input}`}>
                                      <span className={`text-sm ${themeClasses.helper}`}>Loading...</span>
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleTimestampClick(timestamp)}
                                  className={`w-full p-2 rounded-lg border ${themeClasses.timestampButton} text-center`}
                                >
                                  {formatTimestamp(parseFloat(timestamp.start))}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Transcription section */}
                  {(transcription.length > 0 || (isTranscribing && currentVideo?.id === transcribingVideoId)) && (
                    <div className={`w-96 rounded-lg shadow-lg border ${themeClasses.card} h-fit`}>
                      <div className="p-4">
                        <h2 className={`text-xl font-semibold mb-4 ${themeClasses.heading}`}>Transcription</h2>
                        <div className={`rounded-lg border ${themeClasses.input} p-4 max-h-[calc(100vh-16rem)] overflow-y-auto`}>
                          {isTranscribing && currentVideo?.id === transcribingVideoId ? (
                            <div className="flex items-center justify-center h-32">
                              <span className={`text-lg ${themeClasses.helper}`}>Loading...</span>
                            </div>
                          ) : (
                            transcription.map((segment, index) => (
                              <div key={index} className="mb-4">
                                <div className={`text-sm ${themeClasses.helper} mb-1`}>
                                  {formatTimestamp(segment.start)} - {formatTimestamp(segment.end)}
                                </div>
                                <p className={`${themeClasses.label}`}>{segment.text}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default App; 