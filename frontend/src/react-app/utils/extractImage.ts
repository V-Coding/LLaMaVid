const extractFramesAsBlobs = (file: File, timestamps: number[]): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = URL.createObjectURL(file);
        video.crossOrigin = 'anonymous';

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const results: string[] = [];
        let index = 0;

        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            seekNext();
        };

        const seekNext = () => {
            if (index >= timestamps.length) {
                resolve(results);
                return;
            }
            video.currentTime = timestamps[index];
        };

        video.onseeked = async () => {
            context?.drawImage(video, 0, 0);
            canvas.toBlob((blob) => {
                if (blob) {
                    results.push(URL.createObjectURL(blob));
                }
                index++;
                seekNext();
            }, 'image/png');
        };

        video.onerror = (e) => reject(e);
    });
};

export default extractFramesAsBlobs;