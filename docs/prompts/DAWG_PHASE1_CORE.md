# DAWG PHASE 1: Core Audio Engine (JUCE)
**Instance:** DAWG-CORE
**Phase:** 1 - Foundation
**Duration:** Week 1-2
**Dependencies:** None

---

## CONTEXT

You are building **DAWG AI** - a desktop audio workstation with AI-powered features. This is the core JUCE application that handles audio I/O, plugin hosting, and exposes a REST API for AI integration.

**Your Role:** Implement the JUCE-based DAW that handles:
- Multi-track audio recording and playback
- VST3/AU plugin hosting
- MIDI sequencing
- Project management
- REST API for external control

**Architecture:** JUCE C++ application + Python AI engine (separate instance)

---

## PROJECT OVERVIEW

```
DAWG Architecture:

┌─────────────────────────────────────────┐
│        JUCE Application (C++)            │
│  ┌──────────────────────────────────┐  │
│  │   Audio Engine                    │  │
│  │   - Multi-track recording         │  │
│  │   - Plugin hosting (VST3/AU)      │  │
│  │   - MIDI sequencing               │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │   UI Layer (JUCE)                │  │
│  │   - Track view                    │  │
│  │   - Mixer                         │  │
│  │   - Plugin UI hosting             │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │   REST API Server                │  │
│  │   - Project management            │  │
│  │   - AI feature endpoints          │  │
│  │   - Export/Import                 │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    │
                    ├──► Python AI Engine (DAWG-AI instance)
                    │
                    └──► Jarvis Integration (JARVIS-CORE instance)
```

---

## OBJECTIVES

### Primary Goals:
1. ✅ Set up JUCE project structure
2. ✅ Implement basic audio I/O
3. ✅ Multi-track recording and playback
4. ✅ VST3/AU plugin hosting
5. ✅ MIDI sequencing
6. ✅ Project save/load system
7. ✅ REST API server (localhost:8080)
8. ✅ Status file updates

### Success Criteria:
- Can record and play back audio
- Can host VST3/AU plugins
- Can sequence MIDI
- REST API responds on localhost:8080
- Projects save/load correctly
- Status file updates every 5 minutes

---

## TECHNICAL STACK

### Framework: JUCE 7.x
### Language: C++17 or later
### Build System: CMake

### Components:
1. **Audio Engine** - Core DSP and routing
2. **Plugin Hosting** - VST3/AU support
3. **MIDI Engine** - Sequencing and routing
4. **Project Manager** - Save/load system
5. **REST API** - HTTP server for external control
6. **UI** - JUCE-based interface

---

## IMPLEMENTATION STEPS

### Step 1: JUCE Project Setup

**Clone JUCE:**
```bash
cd ~/Development
git clone https://github.com/juce-framework/JUCE.git
cd JUCE
git checkout 7.0.12  # Latest stable
```

**Create Project:**
```bash
cd ~/Development
mkdir -p DAWG
cd DAWG

# Use Projucer to create project
# Or use CMake directly
```

**CMakeLists.txt:**
```cmake
cmake_minimum_required(VERSION 3.15)
project(DAWG VERSION 1.0.0)

set(CMAKE_CXX_STANDARD 17)

# Add JUCE
add_subdirectory(${CMAKE_CURRENT_SOURCE_DIR}/../JUCE ${CMAKE_CURRENT_BINARY_DIR}/JUCE)

# Define the project
juce_add_gui_app(DAWG
    PRODUCT_NAME "DAWG AI"
    COMPANY_NAME "Your Company"
    BUNDLE_ID "com.yourcompany.dawg"
    VERSION 1.0.0
)

# Source files
target_sources(DAWG PRIVATE
    Source/Main.cpp
    Source/MainComponent.cpp
    Source/AudioEngine.cpp
    Source/PluginHost.cpp
    Source/MIDIEngine.cpp
    Source/ProjectManager.cpp
    Source/APIServer.cpp
)

# JUCE modules
target_compile_definitions(DAWG PRIVATE
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
    JUCE_VST3_CAN_REPLACE_VST2=0
)

target_link_libraries(DAWG PRIVATE
    juce::juce_audio_basics
    juce::juce_audio_devices
    juce::juce_audio_formats
    juce::juce_audio_processors
    juce::juce_audio_utils
    juce::juce_core
    juce::juce_data_structures
    juce::juce_events
    juce::juce_graphics
    juce::juce_gui_basics
    juce::juce_gui_extra
)
```

**Directory Structure:**
```
~/Development/DAWG/
├── CMakeLists.txt
├── Source/
│   ├── Main.cpp
│   ├── MainComponent.h
│   ├── MainComponent.cpp
│   ├── AudioEngine.h
│   ├── AudioEngine.cpp
│   ├── PluginHost.h
│   ├── PluginHost.cpp
│   ├── MIDIEngine.h
│   ├── MIDIEngine.cpp
│   ├── ProjectManager.h
│   ├── ProjectManager.cpp
│   ├── APIServer.h
│   └── APIServer.cpp
├── Resources/
└── Build/
```

### Step 2: Audio Engine Implementation

**File:** `Source/AudioEngine.h`
```cpp
#pragma once
#include <JuceHeader.h>

class Track : public juce::ReferenceCountedObject
{
public:
    using Ptr = juce::ReferenceCountedObjectPtr<Track>;

    Track(const juce::String& name, int numChannels);
    ~Track() = default;

    void prepareToPlay(double sampleRate, int blockSize);
    void processBlock(juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midi);
    void releaseResources();

    void setMuted(bool shouldBeMuted) { muted = shouldBeMuted; }
    void setSoloed(bool shouldBeSoloed) { soloed = shouldBeSoloed; }
    void setGain(float newGain) { gain = newGain; }

    bool isMuted() const { return muted; }
    bool isSoloed() const { return soloed; }
    float getGain() const { return gain; }

    juce::String getName() const { return name; }

private:
    juce::String name;
    int numChannels;
    bool muted = false;
    bool soloed = false;
    float gain = 1.0f;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(Track)
};

class AudioEngine : public juce::AudioIODeviceCallback
{
public:
    AudioEngine();
    ~AudioEngine() override;

    void prepareToPlay(double sampleRate, int blockSize);
    void releaseResources();

    // AudioIODeviceCallback
    void audioDeviceIOCallbackWithContext(
        const float* const* inputChannelData,
        int numInputChannels,
        float* const* outputChannelData,
        int numOutputChannels,
        int numSamples,
        const juce::AudioIODeviceCallbackContext& context) override;

    void audioDeviceAboutToStart(juce::AudioIODevice* device) override;
    void audioDeviceStopped() override;

    // Transport
    void play();
    void stop();
    void record();
    bool isPlaying() const { return playing; }
    bool isRecording() const { return recording; }

    // Tracks
    Track::Ptr addTrack(const juce::String& name, int numChannels);
    void removeTrack(int index);
    int getNumTracks() const { return tracks.size(); }
    Track::Ptr getTrack(int index) { return tracks[index]; }

    // Position
    double getCurrentPosition() const { return currentPosition; }
    void setPosition(double newPosition) { currentPosition = newPosition; }

private:
    juce::OwnedArray<Track> tracks;
    juce::AudioDeviceManager deviceManager;

    double sampleRate = 44100.0;
    int blockSize = 512;
    double currentPosition = 0.0;

    bool playing = false;
    bool recording = false;

    juce::CriticalSection lock;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(AudioEngine)
};
```

**File:** `Source/AudioEngine.cpp`
```cpp
#include "AudioEngine.h"

Track::Track(const juce::String& n, int channels)
    : name(n), numChannels(channels)
{
}

void Track::prepareToPlay(double sampleRate, int blockSize)
{
    // Initialize DSP here
}

void Track::processBlock(juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midi)
{
    if (muted)
    {
        buffer.clear();
        return;
    }

    // Apply gain
    buffer.applyGain(gain);

    // Process plugins, effects, etc.
}

void Track::releaseResources()
{
    // Cleanup
}

AudioEngine::AudioEngine()
{
    // Initialize audio device manager
    juce::String error = deviceManager.initialise(
        2,  // number of input channels
        2,  // number of output channels
        nullptr,
        true
    );

    if (error.isNotEmpty())
    {
        DBG("Audio device error: " << error);
    }

    deviceManager.addAudioCallback(this);
}

AudioEngine::~AudioEngine()
{
    deviceManager.removeAudioCallback(this);
}

void AudioEngine::prepareToPlay(double sr, int bs)
{
    sampleRate = sr;
    blockSize = bs;

    const juce::ScopedLock sl(lock);

    for (auto* track : tracks)
        track->prepareToPlay(sampleRate, blockSize);
}

void AudioEngine::releaseResources()
{
    const juce::ScopedLock sl(lock);

    for (auto* track : tracks)
        track->releaseResources();
}

void AudioEngine::audioDeviceIOCallbackWithContext(
    const float* const* inputChannelData,
    int numInputChannels,
    float* const* outputChannelData,
    int numOutputChannels,
    int numSamples,
    const juce::AudioIODeviceCallbackContext& context)
{
    const juce::ScopedLock sl(lock);

    // Clear output
    for (int i = 0; i < numOutputChannels; ++i)
        juce::FloatVectorOperations::clear(outputChannelData[i], numSamples);

    if (!playing)
        return;

    // Create temporary buffers
    juce::AudioBuffer<float> buffer(outputChannelData, numOutputChannels, numSamples);
    juce::MidiBuffer midi;

    // Process all tracks
    for (auto* track : tracks)
    {
        if (track->isMuted() && !track->isSoloed())
            continue;

        track->processBlock(buffer, midi);
    }

    // Update position
    currentPosition += numSamples / sampleRate;
}

void AudioEngine::audioDeviceAboutToStart(juce::AudioIODevice* device)
{
    prepareToPlay(device->getCurrentSampleRate(), device->getCurrentBufferSizeSamples());
}

void AudioEngine::audioDeviceStopped()
{
    releaseResources();
}

void AudioEngine::play()
{
    playing = true;
    recording = false;
}

void AudioEngine::stop()
{
    playing = false;
    recording = false;
}

void AudioEngine::record()
{
    playing = true;
    recording = true;
}

Track::Ptr AudioEngine::addTrack(const juce::String& name, int numChannels)
{
    const juce::ScopedLock sl(lock);

    auto track = new Track(name, numChannels);
    tracks.add(track);

    track->prepareToPlay(sampleRate, blockSize);

    return track;
}

void AudioEngine::removeTrack(int index)
{
    const juce::ScopedLock sl(lock);

    if (juce::isPositiveAndBelow(index, tracks.size()))
        tracks.remove(index);
}
```

### Step 3: Plugin Hosting

**File:** `Source/PluginHost.h`
```cpp
#pragma once
#include <JuceHeader.h>

class PluginHost
{
public:
    PluginHost();
    ~PluginHost() = default;

    // Plugin scanning
    void scanForPlugins();
    juce::Array<juce::PluginDescription> getAvailablePlugins() const;

    // Plugin instances
    std::unique_ptr<juce::AudioPluginInstance> loadPlugin(const juce::PluginDescription& desc);

private:
    juce::AudioPluginFormatManager formatManager;
    juce::KnownPluginList knownPluginList;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(PluginHost)
};
```

**File:** `Source/PluginHost.cpp`
```cpp
#include "PluginHost.h"

PluginHost::PluginHost()
{
    // Register plugin formats
    formatManager.addDefaultFormats();

    // Load known plugins list
    juce::File pluginListFile = juce::File::getSpecialLocation(
        juce::File::userApplicationDataDirectory)
        .getChildFile("DAWG")
        .getChildFile("PluginList.xml");

    if (pluginListFile.existsAsFile())
    {
        auto xml = juce::parseXML(pluginListFile);
        if (xml != nullptr)
            knownPluginList.recreateFromXml(*xml);
    }
}

void PluginHost::scanForPlugins()
{
    knownPluginList.clear();

    for (int i = 0; i < formatManager.getNumFormats(); ++i)
    {
        auto* format = formatManager.getFormat(i);

        juce::PluginDirectoryScanner scanner(
            knownPluginList,
            *format,
            format->getDefaultLocationsToSearch(),
            true,
            juce::File()
        );

        juce::String pluginBeingScanned;

        while (scanner.scanNextFile(true, pluginBeingScanned))
        {
            DBG("Scanning: " << pluginBeingScanned);
        }
    }

    // Save known plugins
    juce::File pluginListFile = juce::File::getSpecialLocation(
        juce::File::userApplicationDataDirectory)
        .getChildFile("DAWG")
        .getChildFile("PluginList.xml");

    pluginListFile.create();

    auto xml = knownPluginList.createXml();
    if (xml != nullptr)
        xml->writeTo(pluginListFile);
}

juce::Array<juce::PluginDescription> PluginHost::getAvailablePlugins() const
{
    juce::Array<juce::PluginDescription> plugins;

    for (const auto& type : knownPluginList.getTypes())
        plugins.add(type);

    return plugins;
}

std::unique_ptr<juce::AudioPluginInstance> PluginHost::loadPlugin(
    const juce::PluginDescription& desc)
{
    juce::String errorMessage;

    auto plugin = formatManager.createPluginInstance(
        desc,
        44100.0,
        512,
        errorMessage
    );

    if (plugin == nullptr)
    {
        DBG("Failed to load plugin: " << errorMessage);
    }

    return plugin;
}
```

### Step 4: REST API Server

**File:** `Source/APIServer.h`
```cpp
#pragma once
#include <JuceHeader.h>
#include "AudioEngine.h"
#include "ProjectManager.h"

class APIServer : private juce::Thread
{
public:
    APIServer(AudioEngine& engine, ProjectManager& pm);
    ~APIServer() override;

    void start();
    void stop();

    bool isRunning() const { return running; }

private:
    void run() override;
    juce::String handleRequest(const juce::String& path, const juce::String& method, const juce::String& body);

    AudioEngine& audioEngine;
    ProjectManager& projectManager;

    std::unique_ptr<juce::StreamingSocket> serverSocket;
    bool running = false;

    static constexpr int PORT = 8080;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(APIServer)
};
```

**File:** `Source/APIServer.cpp`
```cpp
#include "APIServer.h"

APIServer::APIServer(AudioEngine& engine, ProjectManager& pm)
    : Thread("API Server"),
      audioEngine(engine),
      projectManager(pm)
{
}

APIServer::~APIServer()
{
    stop();
}

void APIServer::start()
{
    if (running)
        return;

    running = true;
    startThread();
}

void APIServer::stop()
{
    if (!running)
        return;

    running = false;
    stopThread(1000);
}

void APIServer::run()
{
    serverSocket = std::make_unique<juce::StreamingSocket>();

    if (!serverSocket->createListener(PORT))
    {
        DBG("Failed to create listener on port " << PORT);
        return;
    }

    DBG("API Server listening on port " << PORT);

    while (!threadShouldExit())
    {
        auto clientSocket = serverSocket->waitForNextConnection();

        if (clientSocket == nullptr)
            continue;

        // Read request
        juce::MemoryBlock requestData;
        char buffer[1024];

        while (true)
        {
            int bytesRead = clientSocket->read(buffer, sizeof(buffer), false);

            if (bytesRead <= 0)
                break;

            requestData.append(buffer, (size_t)bytesRead);

            if (bytesRead < sizeof(buffer))
                break;
        }

        juce::String request = requestData.toString();

        // Parse HTTP request (simplified)
        auto lines = juce::StringArray::fromLines(request);
        if (lines.isEmpty())
            continue;

        auto requestLine = lines[0].trim();
        auto parts = juce::StringArray::fromTokens(requestLine, " ", "");

        if (parts.size() < 2)
            continue;

        juce::String method = parts[0];
        juce::String path = parts[1];

        // Find body (after empty line)
        int bodyStart = request.indexOf("\r\n\r\n");
        juce::String body = bodyStart >= 0 ? request.substring(bodyStart + 4) : "";

        // Handle request
        juce::String response = handleRequest(path, method, body);

        // Send response
        juce::String httpResponse =
            "HTTP/1.1 200 OK\r\n"
            "Content-Type: application/json\r\n"
            "Access-Control-Allow-Origin: *\r\n"
            "Content-Length: " + juce::String(response.length()) + "\r\n"
            "\r\n" +
            response;

        clientSocket->write(httpResponse.toRawUTF8(), httpResponse.length());

        delete clientSocket;
    }
}

juce::String APIServer::handleRequest(const juce::String& path, const juce::String& method, const juce::String& body)
{
    juce::var json;

    // Health check
    if (path == "/api/v1/health")
    {
        json = juce::JSON::parse(R"({"status":"healthy","version":"1.0.0"})");
        return juce::JSON::toString(json);
    }

    // Transport control
    if (path == "/api/v1/transport/play" && method == "POST")
    {
        audioEngine.play();
        json = juce::JSON::parse(R"({"status":"playing"})");
        return juce::JSON::toString(json);
    }

    if (path == "/api/v1/transport/stop" && method == "POST")
    {
        audioEngine.stop();
        json = juce::JSON::parse(R"({"status":"stopped"})");
        return juce::JSON::toString(json);
    }

    // Project info
    if (path == "/api/v1/project/status" && method == "GET")
    {
        juce::DynamicObject::Ptr obj = new juce::DynamicObject();
        obj->setProperty("numTracks", audioEngine.getNumTracks());
        obj->setProperty("isPlaying", audioEngine.isPlaying());
        obj->setProperty("currentPosition", audioEngine.getCurrentPosition());

        return juce::JSON::toString(juce::var(obj.get()));
    }

    // AI endpoints
    if (path == "/api/v1/project/analyze" && method == "POST")
    {
        // Forward to Python AI engine
        json = juce::JSON::parse(R"({"status":"analyzing","message":"Analysis queued"})");
        return juce::JSON::toString(json);
    }

    if (path == "/api/v1/generate/midi" && method == "POST")
    {
        // Forward to Python AI engine
        json = juce::JSON::parse(R"({"status":"generating","message":"MIDI generation queued"})");
        return juce::JSON::toString(json);
    }

    // Not found
    json = juce::JSON::parse(R"({"error":"Not found"})");
    return juce::JSON::toString(json);
}
```

### Step 5: Project Manager

**File:** `Source/ProjectManager.h`
```cpp
#pragma once
#include <JuceHeader.h>

struct ProjectManifest
{
    juce::String projectId;
    juce::String name;
    int tempo = 120;
    juce::String timeSignature = "4/4";
    juce::Array<juce::String> tracks;

    juce::String toJSON() const;
    static ProjectManifest fromJSON(const juce::String& json);
};

class ProjectManager
{
public:
    ProjectManager();

    bool saveProject(const juce::File& file, const ProjectManifest& manifest);
    bool loadProject(const juce::File& file, ProjectManifest& manifest);

    juce::File getProjectsDirectory() const;

private:
    juce::File projectsDir;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(ProjectManager)
};
```

**File:** `Source/ProjectManager.cpp`
```cpp
#include "ProjectManager.h"

ProjectManager::ProjectManager()
{
    projectsDir = juce::File::getSpecialLocation(juce::File::userMusicDirectory)
        .getChildFile("DAWG")
        .getChildFile("Projects");

    projectsDir.createDirectory();
}

bool ProjectManager::saveProject(const juce::File& file, const ProjectManifest& manifest)
{
    auto json = manifest.toJSON();
    return file.replaceWithText(json);
}

bool ProjectManager::loadProject(const juce::File& file, ProjectManifest& manifest)
{
    if (!file.existsAsFile())
        return false;

    auto json = file.loadFileAsString();
    manifest = ProjectManifest::fromJSON(json);

    return true;
}

juce::File ProjectManager::getProjectsDirectory() const
{
    return projectsDir;
}

juce::String ProjectManifest::toJSON() const
{
    juce::DynamicObject::Ptr obj = new juce::DynamicObject();

    obj->setProperty("project_id", projectId);
    obj->setProperty("name", name);
    obj->setProperty("tempo", tempo);
    obj->setProperty("time_signature", timeSignature);

    juce::Array<juce::var> tracksArray;
    for (const auto& track : tracks)
        tracksArray.add(track);

    obj->setProperty("tracks", tracksArray);

    return juce::JSON::toString(juce::var(obj.get()), true);
}

ProjectManifest ProjectManifest::fromJSON(const juce::String& json)
{
    ProjectManifest manifest;

    auto var = juce::JSON::parse(json);

    if (auto* obj = var.getDynamicObject())
    {
        manifest.projectId = obj->getProperty("project_id").toString();
        manifest.name = obj->getProperty("name").toString();
        manifest.tempo = obj->getProperty("tempo");
        manifest.timeSignature = obj->getProperty("time_signature").toString();

        if (auto* tracksArray = obj->getProperty("tracks").getArray())
        {
            for (const auto& track : *tracksArray)
                manifest.tracks.add(track.toString());
        }
    }

    return manifest;
}
```

### Step 6: Status File Updates

Add to `MainComponent.cpp`:

```cpp
void MainComponent::timerCallback()
{
    updateStatusFile();
}

void MainComponent::updateStatusFile()
{
    juce::File statusFile = juce::File::getSpecialLocation(juce::File::userHomeDirectory)
        .getChildFile("Development")
        .getChildFile("status")
        .getChildFile("DAWG-CORE_status.json");

    statusFile.create();

    juce::DynamicObject::Ptr status = new juce::DynamicObject();

    status->setProperty("instance", "DAWG-CORE");
    status->setProperty("last_update", juce::Time::getCurrentTime().toISO8601(true));
    status->setProperty("phase", "Phase 1: Foundation");
    status->setProperty("current_task", "Audio engine running");

    juce::Array<juce::var> completed;
    completed.add("JUCE project setup");
    completed.add("Audio engine implementation");
    completed.add("Plugin hosting");
    completed.add("REST API server");
    status->setProperty("completed_tasks", completed);

    juce::Array<juce::var> endpoints;
    endpoints.add("GET /api/v1/health");
    endpoints.add("POST /api/v1/transport/play");
    endpoints.add("POST /api/v1/transport/stop");
    endpoints.add("GET /api/v1/project/status");
    endpoints.add("POST /api/v1/project/analyze");
    endpoints.add("POST /api/v1/generate/midi");
    status->setProperty("api_endpoints_ready", endpoints);

    juce::Array<juce::var> nextSteps;
    nextSteps.add("Integration with DAWG-AI");
    nextSteps.add("Advanced MIDI features");
    status->setProperty("next_steps", nextSteps);

    auto json = juce::JSON::toString(juce::var(status.get()), true);
    statusFile.replaceWithText(json);
}
```

### Step 7: Build & Test

```bash
cd ~/Development/DAWG
mkdir Build
cd Build
cmake ..
cmake --build .

# Run
./DAWG
```

**Test API:**
```bash
# Health check
curl http://localhost:8080/api/v1/health

# Play
curl -X POST http://localhost:8080/api/v1/transport/play

# Status
curl http://localhost:8080/api/v1/project/status
```

---

## DELIVERABLES

At end of Phase 1:

1. ✅ JUCE application running
2. ✅ Audio I/O functional
3. ✅ Multi-track recording/playback
4. ✅ Plugin hosting working
5. ✅ REST API on localhost:8080
6. ✅ Project save/load
7. ✅ Status file updating

---

## INTEGRATION POINTS

### With DAWG-AI (Python):
- REST API exposed (already implemented)
- Python engine will call DAWG endpoints
- Shared project directory: `~/Music/DAWG/Projects/`

### With JARVIS-CORE:
- Jarvis can call DAWG REST API
- Example: "Generate bassline" → POST to `/api/v1/generate/midi`

---

## NEXT STEPS

1. Complete all audio engine features
2. Test REST API thoroughly
3. Move to `DAWG_PHASE1_AI.md` for Python AI integration
4. Coordinate with DAWG-AI instance

---

**Ready to build DAWG!** Start with JUCE project setup.
