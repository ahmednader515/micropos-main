// Camera cleanup utilities
export const stopAllCameraStreams = () => {
  console.log("Stopping all camera streams...");
  
  // Get all media streams from the page
  const streams: MediaStream[] = [];
  
  // Get streams from video elements
  const videoElements = document.querySelectorAll('video');
  videoElements.forEach(video => {
    if (video.srcObject) {
      streams.push(video.srcObject as MediaStream);
    }
  });
  
  // Stop all tracks from all streams
  streams.forEach(stream => {
    stream.getTracks().forEach(track => {
      track.stop();
      console.log("Stopped track:", track.kind);
    });
  });
  
  // Also try to stop any active getUserMedia streams
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        stream.getTracks().forEach(track => {
          track.stop();
          console.log("Stopped additional track:", track.kind);
        });
      })
      .catch(() => {
        // No additional active streams to stop
      });
  }
};

export const stopVideoStream = (videoElement: HTMLVideoElement | null) => {
  if (videoElement && videoElement.srcObject) {
    const stream = videoElement.srcObject as MediaStream;
    stream.getTracks().forEach(track => {
      track.stop();
      console.log("Stopped video track:", track.kind);
    });
    videoElement.srcObject = null;
  }
}; 