# DAWG PHASE 2: UI & Advanced Integration
**Instance:** DAWG-FULL
**Phase:** 2 - Enhancement & Integration
**Duration:** Week 3-4
**Dependencies:** DAWG-CORE + DAWG-AI (Phase 1 complete)

---

## CONTEXT

You are enhancing **DAWG AI** with a polished user interface and advanced AI integration. This phase brings together the JUCE core and Python AI engine into a cohesive, intelligent music production tool.

**Your Role:** Implement advanced features that bridge UI, audio, and AI:
- Modern UI with AI controls
- Voice command integration
- Advanced MIDI editing
- Real-time AI suggestions
- Project templates
- Export/sharing features

**Architecture:** Enhanced JUCE UI + Advanced AI + Jarvis Integration

---

## PROJECT OVERVIEW

```
DAWG Phase 2 Architecture:

┌─────────────────────────────────────────────────────┐
│              DAWG Application                       │
│                                                     │
│  ┌───────────────────────────────────────────┐    │
│  │       Enhanced UI (JUCE)                   │    │
│  │  ┌─────────────────────────────────────┐  │    │
│  │  │  Modern Track View                   │  │    │
│  │  │  - Waveform visualization            │  │    │
│  │  │  - MIDI piano roll                   │  │    │
│  │  │  - Plugin UI integration             │  │    │
│  │  └─────────────────────────────────────┘  │    │
│  │  ┌─────────────────────────────────────┐  │    │
│  │  │  AI Control Panel                    │  │    │
│  │  │  - Generate buttons                  │  │    │
│  │  │  - AI suggestions display            │  │    │
│  │  │  - Voice command indicator           │  │    │
│  │  └─────────────────────────────────────┘  │    │
│  │  ┌─────────────────────────────────────┐  │    │
│  │  │  Mixer View                          │  │    │
│  │  │  - Channel strips                    │  │    │
│  │  │  - FX chains                         │  │    │
│  │  │  - AI level suggestions              │  │    │
│  │  └─────────────────────────────────────┘  │    │
│  └───────────────────────────────────────────┘    │
│                                                     │
│  ┌───────────────────────────────────────────┐    │
│  │       Audio Engine (Enhanced)              │    │
│  │  - Real-time AI processing                 │    │
│  │  - Advanced routing                        │    │
│  │  - Automation recording                    │    │
│  └───────────────────────────────────────────┘    │
│                                                     │
│  ┌───────────────────────────────────────────┐    │
│  │       API Bridge                           │    │
│  │  - WebSocket for real-time updates         │    │
│  │  - REST API (enhanced)                     │    │
│  │  - Event streaming                         │    │
│  └───────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
                    │
                    ├──► DAWG-AI (Enhanced)
                    │    - Real-time analysis
                    │    - Style transfer
                    │    - Audio-to-MIDI
                    │
                    └──► Jarvis Integration
                         - Voice commands
                         - Natural language queries
                         - Workflow automation
```

---

## OBJECTIVES

### Primary Goals:
1. ✅ Modern, intuitive UI design
2. ✅ Real-time AI suggestions
3. ✅ Voice command integration
4. ✅ Advanced MIDI editing
5. ✅ Project templates
6. ✅ Export and sharing
7. ✅ WebSocket for real-time updates
8. ✅ Jarvis voice integration

### Success Criteria:
- Professional-looking UI
- AI features seamlessly integrated
- Voice commands working via Jarvis
- Real-time feedback and suggestions
- Projects export to standard formats
- Status updates in real-time

---

## TECHNICAL STACK

### UI Framework: JUCE
### Communication: WebSocket + REST API
### Voice: Jarvis integration
### Additional Libraries:
- **juce_gui_extra** - Advanced UI components
- **juce_osc** - OSC communication (optional)
- **websocketpp** - WebSocket server (C++)

---

## IMPLEMENTATION STEPS

### Step 1: Enhanced UI Components

**File:** `Source/UI/ModernLookAndFeel.h`
```cpp
#pragma once
#include <JuceHeader.h>

class ModernLookAndFeel : public juce::LookAndFeel_V4
{
public:
    ModernLookAndFeel()
    {
        // Modern dark theme
        setColour(juce::ResizableWindow::backgroundColourId, juce::Colour(0xff1e1e1e));
        setColour(juce::DocumentWindow::textColourId, juce::Colours::white);
        setColour(juce::TextButton::buttonColourId, juce::Colour(0xff0078d4));
        setColour(juce::TextButton::textColourOffId, juce::Colours::white);

        // Track colors
        setColour(juce::Slider::trackColourId, juce::Colour(0xff0078d4));
        setColour(juce::Slider::thumbColourId, juce::Colour(0xff00a8ff));
    }

    void drawRotarySlider(juce::Graphics& g, int x, int y, int width, int height,
                         float sliderPos, float rotaryStartAngle, float rotaryEndAngle,
                         juce::Slider& slider) override
    {
        // Modern circular knob design
        auto radius = (float)juce::jmin(width / 2, height / 2) - 4.0f;
        auto centreX = (float)x + (float)width * 0.5f;
        auto centreY = (float)y + (float)height * 0.5f;
        auto angle = rotaryStartAngle + sliderPos * (rotaryEndAngle - rotaryStartAngle);

        // Fill
        g.setColour(juce::Colour(0xff2d2d2d));
        g.fillEllipse(centreX - radius, centreY - radius, radius * 2.0f, radius * 2.0f);

        // Outline
        g.setColour(juce::Colour(0xff0078d4));
        g.drawEllipse(centreX - radius, centreY - radius, radius * 2.0f, radius * 2.0f, 2.0f);

        // Pointer
        juce::Path p;
        auto pointerLength = radius * 0.7f;
        auto pointerThickness = 3.0f;
        p.addRectangle(-pointerThickness * 0.5f, -radius, pointerThickness, pointerLength);
        p.applyTransform(juce::AffineTransform::rotation(angle).translated(centreX, centreY));

        g.setColour(juce::Colour(0xff00a8ff));
        g.fillPath(p);
    }
};
```

**File:** `Source/UI/TrackView.h`
```cpp
#pragma once
#include <JuceHeader.h>
#include "../AudioEngine.h"

class TrackView : public juce::Component
{
public:
    TrackView(AudioEngine& engine) : audioEngine(engine)
    {
        addAndMakeVisible(addTrackButton);
        addTrackButton.setButtonText("Add Track");
        addTrackButton.onClick = [this] { addTrack(); };

        startTimer(30);  // 30fps UI updates
    }

    void paint(juce::Graphics& g) override
    {
        g.fillAll(juce::Colour(0xff1e1e1e));

        // Draw tracks
        int y = 40;
        int trackHeight = 80;

        for (int i = 0; i < audioEngine.getNumTracks(); ++i)
        {
            auto track = audioEngine.getTrack(i);

            // Track background
            g.setColour(juce::Colour(0xff2d2d2d));
            g.fillRect(10, y, getWidth() - 20, trackHeight - 10);

            // Track name
            g.setColour(juce::Colours::white);
            g.drawText(track->getName(), 20, y + 5, 200, 30,
                      juce::Justification::centredLeft);

            // Level meter (simple)
            float level = track->getGain();
            g.setColour(juce::Colour(0xff0078d4));
            g.fillRect(230, y + 10, (int)(level * 200), 20);

            // Mute/Solo buttons (simplified)
            g.setColour(track->isMuted() ? juce::Colours::red : juce::Colours::grey);
            g.drawText("M", 450, y + 5, 40, 30, juce::Justification::centred);

            g.setColour(track->isSoloed() ? juce::Colours::yellow : juce::Colours::grey);
            g.drawText("S", 500, y + 5, 40, 30, juce::Justification::centred);

            y += trackHeight;
        }
    }

    void resized() override
    {
        addTrackButton.setBounds(10, 5, 100, 30);
    }

    void timerCallback() override
    {
        repaint();
    }

private:
    AudioEngine& audioEngine;
    juce::TextButton addTrackButton;

    void addTrack()
    {
        audioEngine.addTrack("Track " + juce::String(audioEngine.getNumTracks() + 1), 2);
        repaint();
    }

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(TrackView)
};
```

---

### Step 2: AI Control Panel

**File:** `Source/UI/AIControlPanel.h`
```cpp
#pragma once
#include <JuceHeader.h>

class AIControlPanel : public juce::Component
{
public:
    AIControlPanel()
    {
        addAndMakeVisible(generateDrumsButton);
        generateDrumsButton.setButtonText("Generate Drums");
        generateDrumsButton.onClick = [this] { generateDrums(); };

        addAndMakeVisible(generateBassButton);
        generateBassButton.setButtonText("Generate Bass");
        generateBassButton.onClick = [this] { generateBass(); };

        addAndMakeVisible(generateMelodyButton);
        generateMelodyButton.setButtonText("Generate Melody");
        generateMelodyButton.onClick = [this] { generateMelody(); };

        addAndMakeVisible(mixingSuggestionsButton);
        mixingSuggestionsButton.setButtonText("Get Mix Suggestions");
        mixingSuggestionsButton.onClick = [this] { getMixingSuggestions(); };

        addAndMakeVisible(voiceCommandLabel);
        voiceCommandLabel.setText("Say: 'Generate bassline'", juce::dontSendNotification);
        voiceCommandLabel.setColour(juce::Label::textColourId, juce::Colours::lightblue);

        addAndMakeVisible(suggestionsTextEditor);
        suggestionsTextEditor.setMultiLine(true);
        suggestionsTextEditor.setReadOnly(true);
        suggestionsTextEditor.setColour(juce::TextEditor::backgroundColourId,
                                       juce::Colour(0xff2d2d2d));
    }

    void paint(juce::Graphics& g) override
    {
        g.fillAll(juce::Colour(0xff252525));

        g.setColour(juce::Colours::white);
        g.setFont(18.0f);
        g.drawText("AI Controls", 10, 5, getWidth() - 20, 30,
                  juce::Justification::centredLeft);
    }

    void resized() override
    {
        auto bounds = getLocalBounds().reduced(10);
        bounds.removeFromTop(40);  // Title space

        generateDrumsButton.setBounds(bounds.removeFromTop(40).reduced(0, 5));
        generateBassButton.setBounds(bounds.removeFromTop(40).reduced(0, 5));
        generateMelodyButton.setBounds(bounds.removeFromTop(40).reduced(0, 5));
        mixingSuggestionsButton.setBounds(bounds.removeFromTop(40).reduced(0, 5));

        bounds.removeFromTop(10);
        voiceCommandLabel.setBounds(bounds.removeFromTop(30));

        bounds.removeFromTop(10);
        suggestionsTextEditor.setBounds(bounds);
    }

private:
    juce::TextButton generateDrumsButton;
    juce::TextButton generateBassButton;
    juce::TextButton generateMelodyButton;
    juce::TextButton mixingSuggestionsButton;
    juce::Label voiceCommandLabel;
    juce::TextEditor suggestionsTextEditor;

    void generateDrums()
    {
        // Call DAWG-AI API
        callAIEndpoint("http://localhost:9000/api/v1/generate/midi?style=drums");
    }

    void generateBass()
    {
        callAIEndpoint("http://localhost:9000/api/v1/generate/bassline?key=C&scale=major");
    }

    void generateMelody()
    {
        callAIEndpoint("http://localhost:9000/api/v1/generate/melody?key=C&scale=major");
    }

    void getMixingSuggestions()
    {
        // Call DAWG-AI API
        auto response = callAIEndpoint("http://localhost:9000/api/v1/mixing/suggest");

        // Display suggestions
        suggestionsTextEditor.setText("Mixing Suggestions:\n" + response);
    }

    juce::String callAIEndpoint(const juce::String& url)
    {
        // Simple HTTP request (in production, use proper async HTTP library)
        juce::URL apiUrl(url);
        auto stream = apiUrl.createInputStream(juce::URL::InputStreamOptions(juce::URL::ParameterHandling::inPostData)
                                              .withProgressCallback(nullptr)
                                              .withConnectionTimeoutMs(5000));

        if (stream != nullptr)
        {
            return stream->readEntireStreamAsString();
        }

        return "Error: Could not connect to AI engine";
    }

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(AIControlPanel)
};
```

---

### Step 3: WebSocket Integration

**File:** `Source/WebSocketServer.h`
```cpp
#pragma once
#include <JuceHeader.h>
#include <thread>
#include <atomic>

class WebSocketServer : public juce::Thread
{
public:
    WebSocketServer() : Thread("WebSocket Server") {}

    ~WebSocketServer() override
    {
        stopThread(1000);
    }

    void startServer()
    {
        startThread();
    }

    void sendUpdate(const juce::String& message)
    {
        const juce::ScopedLock sl(lock);
        // Broadcast to all connected clients
        pendingMessages.add(message);
    }

    void run() override
    {
        // Simplified WebSocket server
        // In production, use websocketpp or similar library

        DBG("WebSocket server started on port 8081");

        while (!threadShouldExit())
        {
            // Process pending messages
            {
                const juce::ScopedLock sl(lock);

                for (const auto& msg : pendingMessages)
                {
                    // Send to clients
                    DBG("Broadcasting: " << msg);
                }

                pendingMessages.clear();
            }

            juce::Thread::sleep(100);
        }
    }

private:
    juce::CriticalSection lock;
    juce::StringArray pendingMessages;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(WebSocketServer)
};
```

---

### Step 4: Jarvis Integration

**File:** `Source/JarvisIntegration.h`
```cpp
#pragma once
#include <JuceHeader.h>
#include "AudioEngine.h"

class JarvisIntegration : public juce::Timer
{
public:
    JarvisIntegration(AudioEngine& engine) : audioEngine(engine)
    {
        // Start polling for Jarvis commands
        startTimer(1000);  // Check every second
    }

    void timerCallback() override
    {
        // Check for Jarvis command file
        juce::File commandFile = juce::File::getSpecialLocation(juce::File::userHomeDirectory)
            .getChildFile("Development")
            .getChildFile("jarvis_commands")
            .getChildFile("dawg_command.json");

        if (commandFile.existsAsFile())
        {
            auto jsonText = commandFile.loadFileAsString();
            auto json = juce::JSON::parse(jsonText);

            if (auto* obj = json.getDynamicObject())
            {
                juce::String command = obj->getProperty("command").toString();
                processVoiceCommand(command);

                // Delete command file after processing
                commandFile.deleteFile();
            }
        }
    }

private:
    AudioEngine& audioEngine;

    void processVoiceCommand(const juce::String& command)
    {
        DBG("Processing voice command: " << command);

        if (command.containsIgnoreCase("play"))
        {
            audioEngine.play();
        }
        else if (command.containsIgnoreCase("stop"))
        {
            audioEngine.stop();
        }
        else if (command.containsIgnoreCase("record"))
        {
            audioEngine.record();
        }
        else if (command.containsIgnoreCase("generate bassline"))
        {
            // Call AI to generate bassline
            callAI("generate/bassline");
        }
        else if (command.containsIgnoreCase("generate drums"))
        {
            callAI("generate/midi?style=drums");
        }
        else if (command.containsIgnoreCase("generate melody"))
        {
            callAI("generate/melody");
        }
        else if (command.containsIgnoreCase("add track"))
        {
            audioEngine.addTrack("Voice Track", 2);
        }
    }

    void callAI(const juce::String& endpoint)
    {
        juce::URL url("http://localhost:9000/api/v1/" + endpoint);
        url.createInputStream(juce::URL::InputStreamOptions(juce::URL::ParameterHandling::inPostData));
    }

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(JarvisIntegration)
};
```

---

### Step 5: Enhanced Python AI (Real-time Features)

**File:** `ai/realtime_analysis.py` (Add to DAWG_AI)
```python
import asyncio
import websockets
import json
from typing import Set
from integration.dawg_client import DAWGClient

class RealtimeAnalyzer:
    """Real-time audio analysis and feedback"""

    def __init__(self):
        self.connected_clients: Set[websockets.WebSocketServerProtocol] = set()
        self.dawg_client = DAWGClient()
        self.running = False

    async def start(self, host: str = "0.0.0.0", port: int = 8082):
        """Start WebSocket server for real-time updates"""
        async with websockets.serve(self.handle_client, host, port):
            self.running = True
            print(f"Real-time analyzer started on ws://{host}:{port}")

            # Periodic analysis
            while self.running:
                await self.analyze_and_broadcast()
                await asyncio.sleep(2)  # Update every 2 seconds

    async def handle_client(self, websocket, path):
        """Handle WebSocket client connection"""
        self.connected_clients.add(websocket)
        try:
            await websocket.wait_closed()
        finally:
            self.connected_clients.remove(websocket)

    async def analyze_and_broadcast(self):
        """Analyze current project and broadcast updates"""
        if not self.connected_clients:
            return

        # Get project status
        status = self.dawg_client.get_project_status()

        # Create update message
        update = {
            "type": "realtime_update",
            "timestamp": asyncio.get_event_loop().time(),
            "data": status,
            "suggestions": self._generate_live_suggestions(status)
        }

        # Broadcast to all clients
        message = json.dumps(update)
        await asyncio.gather(
            *[client.send(message) for client in self.connected_clients],
            return_exceptions=True
        )

    def _generate_live_suggestions(self, status: dict) -> list:
        """Generate real-time suggestions based on project state"""
        suggestions = []

        if status.get("isPlaying"):
            suggestions.append({
                "type": "info",
                "message": "Project is playing - listening for issues..."
            })

        num_tracks = status.get("numTracks", 0)
        if num_tracks > 10:
            suggestions.append({
                "type": "warning",
                "message": f"Many tracks ({num_tracks}) - consider grouping"
            })

        return suggestions
```

---

### Step 6: Project Templates

**File:** `Source/ProjectTemplates.h`
```cpp
#pragma once
#include <JuceHeader.h>
#include "AudioEngine.h"
#include "ProjectManager.h"

class ProjectTemplates
{
public:
    enum class TemplateType
    {
        Empty,
        BasicSong,
        ElectronicMusic,
        PodcastRecording,
        LiveBand
    };

    static void createFromTemplate(AudioEngine& engine, TemplateType type)
    {
        switch (type)
        {
            case TemplateType::Empty:
                // Just one audio track
                engine.addTrack("Audio 1", 2);
                break;

            case TemplateType::BasicSong:
                engine.addTrack("Drums", 2);
                engine.addTrack("Bass", 2);
                engine.addTrack("Guitar", 2);
                engine.addTrack("Vocals", 1);
                break;

            case TemplateType::ElectronicMusic:
                engine.addTrack("Kick", 2);
                engine.addTrack("Snare", 2);
                engine.addTrack("Hi-hats", 2);
                engine.addTrack("Bass", 2);
                engine.addTrack("Synth Lead", 2);
                engine.addTrack("Synth Pad", 2);
                engine.addTrack("FX", 2);
                break;

            case TemplateType::PodcastRecording:
                engine.addTrack("Host", 1);
                engine.addTrack("Guest", 1);
                engine.addTrack("Music", 2);
                break;

            case TemplateType::LiveBand:
                engine.addTrack("Kick", 1);
                engine.addTrack("Snare", 1);
                engine.addTrack("Overheads", 2);
                engine.addTrack("Bass DI", 1);
                engine.addTrack("Guitar 1", 1);
                engine.addTrack("Guitar 2", 1);
                engine.addTrack("Vocals", 1);
                break;
        }
    }

    static juce::StringArray getTemplateNames()
    {
        return {
            "Empty Project",
            "Basic Song",
            "Electronic Music",
            "Podcast Recording",
            "Live Band Recording"
        };
    }
};
```

---

### Step 7: Export & Sharing

**File:** `Source/ExportManager.h`
```cpp
#pragma once
#include <JuceHeader.h>
#include "AudioEngine.h"

class ExportManager
{
public:
    struct ExportSettings
    {
        juce::File outputFile;
        int sampleRate = 44100;
        int bitDepth = 24;
        juce::AudioFormatWriter::WriteMode writeMode =
            juce::AudioFormatWriter::WriteMode::wavFormatLittleEndian;
    };

    static bool exportProject(
        AudioEngine& engine,
        const ExportSettings& settings)
    {
        // Create audio format manager
        juce::AudioFormatManager formatManager;
        formatManager.registerBasicFormats();

        // Create writer
        auto* format = formatManager.findFormatForFileExtension(
            settings.outputFile.getFileExtension());

        if (format == nullptr)
            return false;

        std::unique_ptr<juce::FileOutputStream> fileStream(
            settings.outputFile.createOutputStream());

        if (fileStream == nullptr)
            return false;

        std::unique_ptr<juce::AudioFormatWriter> writer(
            format->createWriterFor(
                fileStream.get(),
                settings.sampleRate,
                2,  // stereo
                settings.bitDepth,
                {},
                0
            ));

        if (writer == nullptr)
            return false;

        fileStream.release();  // Writer owns the stream now

        // Render audio (simplified - in production, render entire timeline)
        const int bufferSize = 4096;
        juce::AudioBuffer<float> buffer(2, bufferSize);

        // TODO: Render project timeline
        // For now, just write silence as placeholder
        buffer.clear();
        writer->writeFromAudioSampleBuffer(buffer, 0, bufferSize);

        return true;
    }
};
```

---

## DELIVERABLES

At end of Phase 2:

1. ✅ Modern, polished UI
2. ✅ AI controls integrated in UI
3. ✅ Real-time AI suggestions via WebSocket
4. ✅ Voice command integration with Jarvis
5. ✅ Project templates
6. ✅ Export functionality
7. ✅ Enhanced status reporting

---

## INTEGRATION TESTING

**Test Voice Commands:**
```bash
# Write command file for Jarvis to process
echo '{"command": "play"}' > ~/Development/jarvis_commands/dawg_command.json

# Generate AI content via voice
echo '{"command": "generate bassline"}' > ~/Development/jarvis_commands/dawg_command.json
```

**Test Real-time Updates:**
```python
# Python WebSocket client test
import asyncio
import websockets

async def test_realtime():
    async with websockets.connect('ws://localhost:8082') as websocket:
        while True:
            message = await websocket.recv()
            print(f"Received: {message}")

asyncio.run(test_realtime())
```

---

## JARVIS VOICE COMMANDS

Supported commands:
- "Play" / "Stop" / "Record"
- "Add track"
- "Generate drums"
- "Generate bassline in [key]"
- "Generate melody in [key]"
- "Get mixing suggestions"
- "Export project"
- "Create new project"

---

## UI MOCKUP

```
┌────────────────────────────────────────────────────────────┐
│  DAWG AI                                          ⚙️  Help  │
├────────────────────────────────────────────────────────────┤
│  ▶️ ⏹️ ⏺️   00:02:34   120 BPM   4/4               🎤 Voice │
├──────────────────────────────────┬─────────────────────────┤
│  Track 1: Drums                  │  🤖 AI Controls         │
│  ▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░       │                         │
│  [M] [S] [R]  Vol: ━━━━━●────    │  [Generate Drums]       │
│                                  │  [Generate Bass]        │
│  Track 2: Bass                   │  [Generate Melody]      │
│  ▓▓▓▓░░░░░░░░░░░░░░░░░░░░        │                         │
│  [M] [S] [R]  Vol: ━━━━●─────    │  [Mix Suggestions]      │
│                                  │                         │
│  Track 3: Vocals                 │  💡 Suggestions:        │
│  ▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░         │  • Add compression      │
│  [M] [S] [R]  Vol: ━━━━━━●───    │  • Balance levels       │
│                                  │  • Consider reverb      │
│  [+ Add Track]                   │                         │
└──────────────────────────────────┴─────────────────────────┘
```

---

## NEXT STEPS

1. Complete UI polish
2. Test all integrations thoroughly
3. Create user documentation
4. Prepare for beta testing
5. Consider Phase 3: Advanced features (audio-to-MIDI, style transfer)

---

## PHASE 3 PREVIEW

Future enhancements:
- Audio-to-MIDI transcription
- Style transfer ("make it sound like...")
- Stem separation
- Mastering AI
- Collaborative features
- Cloud backup
- Mobile companion app

---

**Ready for Phase 2!** Start with UI enhancements and work through integration systematically.
