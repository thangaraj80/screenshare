interface Navigator {
    getUserMedia(
        options: { video?: boolean; audio?: boolean; }, 
        success: (stream: any) => void, 
        error?: (error: string) => void
        ) : void;
  }
  
//   navigator.getUserMedia(
//     {video: true, audio: true}, 
//     function (stream) {  },
//     function (error) {  }
//   );