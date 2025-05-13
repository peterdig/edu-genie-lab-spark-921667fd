// Service for handling speech-to-text functionality
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:flutter/foundation.dart' show kDebugMode;

class SpeechToTextService {
  final stt.SpeechToText _speechToText = stt.SpeechToText();
  bool _speechEnabled = false;
  bool _isListening = false;

  bool get isListening => _isListening;

  Future<bool> initialize() async {
    try {
      _speechEnabled = await _speechToText.initialize(
        onStatus: (status) {
          if (kDebugMode) {
            print('Speech_to_text status: $status');
          }
          if (status == 'notListening') {
            _isListening = false;
            // Potentially notify listeners about status change here if needed globally
          }
        },
        onError: (errorNotification) {
          if (kDebugMode) {
            print('Speech_to_text error: $errorNotification');
          }
          _isListening = false;
           // Potentially notify listeners about error here
        },
      );
    } catch (e) {
      if (kDebugMode) {
        print('Speech_to_text initialization failed: $e');
      }
      _speechEnabled = false;
    }
    return _speechEnabled;
  }

  void startListening({
    required Function(String text) onResult,
    required Function(bool isListening) onListeningStatusChanged,
    String localeId = 'en_US', // Default to US English
  }) async {
    if (!_speechEnabled || _isListening) return;

    _isListening = true;
    onListeningStatusChanged(_isListening);

    await _speechToText.listen(
      onResult: (result) {
        if (result.finalResult) {
          onResult(result.recognizedWords);
        }
      },
      listenFor: const Duration(seconds: 30), // Adjust as needed
      localeId: localeId,
      cancelOnError: true,
      partialResults: true, // Set to true if you want partial results, false for only final
      onSoundLevelChange: (level) { // Optional: if you want to show mic level
        // print('Sound level $level');
      }
    ).then((_) {
      // This block is executed after listen completes or is cancelled
      // However, status changes are better handled by onStatus in initialize
    }).catchError((error) {
       if (kDebugMode) {
        print('Error during listening: $error');
      }
      _isListening = false;
      onListeningStatusChanged(_isListening);
    });
  }

  void stopListening({required Function(bool isListening) onListeningStatusChanged}) async {
    if (!_speechEnabled || !_isListening) return;

    await _speechToText.stop();
    _isListening = false;
    onListeningStatusChanged(_isListening);
  }

  void cancelListening({required Function(bool isListening) onListeningStatusChanged}) async {
    if (!_speechEnabled || !_isListening) return;

    await _speechToText.cancel();
    _isListening = false;
    onListeningStatusChanged(_isListening);
  }
}
