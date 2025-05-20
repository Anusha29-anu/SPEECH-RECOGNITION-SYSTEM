document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggleBtn');
    const statusDiv = document.getElementById('status');
    const transcriptionDiv = document.getElementById('transcription');
    const errorDiv = document.getElementById('error');
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;

    if (!SpeechRecognition) {
        statusDiv.textContent = 'Speech Recognition API not supported.';
        errorDiv.textContent = 'Please try a browser like Chrome, Edge, or Safari (on macOS/iOS).';
        toggleBtn.disabled = true;
        copyBtn.disabled = true;
        clearBtn.disabled = true;
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let isRecording = false;
    let finalTranscriptForCurrentSession = '';

    const updateActionButtonsState = () => {
        const hasText = transcriptionDiv.textContent.trim().length > 0;
        copyBtn.disabled = !hasText;
        clearBtn.disabled = !hasText;
    };

    recognition.onstart = () => {
        isRecording = true;
        finalTranscriptForCurrentSession = '';
        transcriptionDiv.innerHTML = '';
        statusDiv.textContent = 'Listening...';
        toggleBtn.textContent = 'Stop Listening';
        toggleBtn.classList.add('recording');
        errorDiv.textContent = '';
        updateActionButtonsState();
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let sessionFinalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcriptSegment = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                sessionFinalTranscript += transcriptSegment;
            } else {
                interimTranscript += transcriptSegment;
            }
        }

        if (sessionFinalTranscript) {
            if (finalTranscriptForCurrentSession.length > 0 && !finalTranscriptForCurrentSession.endsWith(' ') && !sessionFinalTranscript.startsWith(' ')) {
                finalTranscriptForCurrentSession += ' ';
            }
            finalTranscriptForCurrentSession += sessionFinalTranscript;
        }

        transcriptionDiv.innerHTML = finalTranscriptForCurrentSession + '<span class="interim-text">' + interimTranscript + '</span>';
        updateActionButtonsState();
    };

    recognition.onerror = (event) => {
        let errorMessage = 'Error: ' + event.error;
        switch (event.error) {
            case 'no-speech':
                errorMessage = 'No speech detected. Please try speaking louder or closer to the microphone.';
                break;
            case 'audio-capture':
                errorMessage = 'Audio capture failed. Ensure your microphone is working and enabled in OS settings.';
                break;
            case 'not-allowed':
                errorMessage = 'Microphone access denied. Please allow microphone access in browser settings for this site.';
                break;
            case 'network':
                errorMessage = 'Network error during speech recognition. Please check your internet connection.';
                break;
        }
        errorDiv.textContent = errorMessage;
        console.error('Speech recognition error:', event);

    };

    recognition.onend = () => {
        isRecording = false;

        if (errorDiv.textContent.trim() === '') {
            if (finalTranscriptForCurrentSession.trim() === '') {
                statusDiv.textContent = 'No speech transcribed. Ready.';
            } else {
                statusDiv.textContent = 'Recognition finished. Ready.';
            }
        } else {
            statusDiv.textContent = 'An error occurred. Ready.';
        }

        toggleBtn.textContent = 'Start Listening';
        toggleBtn.classList.remove('recording');

        transcriptionDiv.textContent = finalTranscriptForCurrentSession.trim();
        if (transcriptionDiv.textContent.trim() === '') {
            transcriptionDiv.innerHTML = '';
        }
        updateActionButtonsState();
    };

    toggleBtn.addEventListener('click', () => {
        if (isRecording) {
            recognition.stop();
        } else {
            errorDiv.textContent = '';
            try {
                recognition.start();
            } catch (ex) {
                errorDiv.textContent = "Failed to start recognition. Please wait a moment and try again.";
                console.error("Error calling recognition.start():", ex);
                isRecording = false;
                statusDiv.textContent = 'Ready.';
                toggleBtn.textContent = 'Start Listening';
                toggleBtn.classList.remove('recording');
            }
        }
    });

    copyBtn.addEventListener('click', () => {
        if (transcriptionDiv.textContent.trim().length > 0) {
            navigator.clipboard.writeText(transcriptionDiv.textContent.trim())
                .then(() => {
                    const originalText = copyBtn.textContent;
                    copyBtn.textContent = 'Copied!';
                    copyBtn.disabled = true;
                    setTimeout(() => {
                        copyBtn.textContent = originalText;
                        updateActionButtonsState();
                    }, 1500);
                })
                .catch(err => {
                    console.error('Failed to copy text: ', err);
                    errorDiv.textContent = 'Failed to copy text to clipboard.';
                });
        }
    });

    clearBtn.addEventListener('click', () => {
        transcriptionDiv.innerHTML = '';
        finalTranscriptForCurrentSession = '';
        statusDiv.textContent = 'Text cleared. Ready.';
        updateActionButtonsState();
    });

    updateActionButtonsState();
});