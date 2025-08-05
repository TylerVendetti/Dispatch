"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Play,
  Pause,
  RotateCcw,
  MapPin,
  Clock,
  Target,
  Home,
  Info,
  X,
  AlertTriangle,
  CheckCircle,
  PhoneCall,
} from "lucide-react"

interface GameState {
  currentAudioClip: number
  squadsRemaining: number
  gameStatus: "incoming-call" | "case-brief" | "playing" | "won" | "lost"
  completedLocations: { x: number; y: number; audioClip: number }[]
  dispatchedSquads: { x: number; y: number; audioClip: number; success: boolean }[]
  unlockedClips: number[]
  timeElapsed: number
  difficulty: "EASY" | 'MEDIUM | "HARD'
}

interface Landmark {
  id: string
  name: string
  icon: string
  x: number
  y: number
  description: string
  details: string
}

interface AudioClip {
  id: number
  transcript: string
  audioFile?: string
  correctLocation: { x: number; y: number }
  searchRadius: number
  description: string
  clueHint: string
}

interface TravelingSquad {
  id: string
  startX: number
  startY: number
  endX: number
  endY: number
  progress: number
  audioClip: number
}

const LANDMARKS: Landmark[] = [
  {
    id: "highway-19",
    name: "Highway 19",
    icon: "🛣️",
    x: 16,
    y: 14,
    description: "Major rural highway",
    details: "Highway 19 runs through rural areas connecting small towns and farming communities.",
  },
  {
    id: "dairy-farm",
    name: "Hillside Dairy Farm",
    icon: "🐄",
    x: 15,
    y: 12,
    description: "Working dairy farm",
    details:
      "A family-owned dairy farm with over 200 head of cattle. Known for their traditional farming methods and quality milk production.",
  },
  {
    id: "countryside-motel",
    name: "Countryside Motel",
    icon: "🏨",
    x: 17,
    y: 13,
    description: "Small roadside motel",
    details:
      "A modest 12-room motel popular with truckers and travelers. Features basic amenities and affordable rates for overnight stays.",
  },
  {
    id: "train-station",
    name: "Millbrook Train Station",
    icon: "🚂",
    x: 18,
    y: 11,
    description: "Rural train station",
    details:
      "A small train station serving freight and occasional passenger trains. Built in the 1950s with classic brick architecture.",
  },
  {
    id: "forest-area",
    name: "Pine Forest",
    icon: "🌲",
    x: 13,
    y: 11,
    description: "Dense pine forest",
    details:
      "A large forested area covering several acres. Popular with hikers and nature enthusiasts during daylight hours.",
  },
  {
    id: "radio-tower",
    name: "Radio Tower",
    icon: "📡",
    x: 19,
    y: 15,
    description: "Local radio/TV broadcast tower",
    details:
      "Broadcast tower for WKRP local news and weather. Provides AM/FM radio and television coverage for the region.",
  },
  {
    id: "police-station",
    name: "Police Station",
    icon: "🏢",
    x: 8,
    y: 10,
    description: "Central Police Station",
    details:
      "Main police headquarters with dispatch center, holding cells, and administrative offices. All emergency response units are deployed from here.",
  },
  // RED HERRING LOCATIONS
  {
    id: "downtown-hotel",
    name: "Grand Plaza Hotel",
    icon: "🏨",
    x: 6,
    y: 9,
    description: "Upscale downtown hotel",
    details:
      "A luxury hotel featuring 200 rooms, conference facilities, and underground parking. Popular with business travelers and tourists.",
  },
  {
    id: "city-park",
    name: "Central Park",
    icon: "🌳",
    x: 11,
    y: 6,
    description: "Urban park with pond",
    details:
      "A 15-acre city park featuring walking trails, a duck pond, and playground. Hosts community events and outdoor concerts.",
  },
  {
    id: "industrial-motel",
    name: "Truck Stop Inn",
    icon: "🏨",
    x: 16,
    y: 15,
    description: "Budget motel near factories",
    details:
      "A no-frills motel catering to truck drivers and industrial workers. Features 24-hour check-in and basic accommodations.",
  },
  {
    id: "suburban-farm",
    name: "Petting Zoo Farm",
    icon: "🐄",
    x: 4,
    y: 4,
    description: "Small educational farm",
    details:
      "A family-friendly farm featuring goats, sheep, and a few cows. Offers educational tours and seasonal activities for children.",
  },
  {
    id: "metro-station",
    name: "Downtown Metro",
    icon: "🚇",
    x: 7,
    y: 8,
    description: "Underground subway station",
    details:
      "Busy metropolitan transit hub serving three subway lines. Features shops, restaurants, and connects to the business district.",
  },
  {
    id: "cell-tower",
    name: "Cell Tower",
    icon: "📡",
    x: 3,
    y: 16,
    description: "Cellular communication tower",
    details:
      "Modern cellular tower providing 4G and 5G coverage. Owned by major telecommunications company serving residential areas.",
  },
  {
    id: "highway-overpass",
    name: "Highway 95 Overpass",
    icon: "🛣️",
    x: 2,
    y: 12,
    description: "Major highway interchange",
    details:
      "Multi-level highway interchange connecting several major routes. Heavy traffic flow during rush hours with ongoing construction.",
  },
  {
    id: "warehouse-district",
    name: "Storage Warehouse",
    icon: "🏭",
    x: 15,
    y: 16,
    description: "Industrial storage facility",
    details:
      "Large commercial warehouse complex used for logistics and distribution. Features loading docks and climate-controlled storage units.",
  },
]

const AUDIO_TRAIL: AudioClip[] = [
  {
    id: 1,
    transcript:
      "\"Oh my god, hello? Can you hear me? I need help. My name is Ana. I think I've been abducted. Someone put a cloth over my mouth and... I blacked out. I'm in a basement now, I think. I can't see anything. But I hear crickets... lots of 'em.\"",
    correctLocation: { x: 17, y: 13 }, // At the rural motel location
    searchRadius: 4, // Larger radius since it's the first clue
    description: "Initial distress call from Ana",
    clueHint: "Rural area with lots of crickets - she's in a basement",
  },
  {
    id: 2,
    transcript:
      "\"Someone has a TV on upstairs. It's playing the local news. I can barely hear it… wait—it's an anchorman. He just said something about Route... 19? 9? Something like that.\"",
    correctLocation: { x: 17, y: 13 }, // Same location - she's still in the motel basement
    searchRadius: 3, // Narrowing down
    description: "Ana hears local news mentioning a highway",
    clueHint: "Still in basement, but near Highway 19",
  },
  {
    id: 3,
    transcript: '"Do you hear that? The bells? What is that?"',
    correctLocation: { x: 17, y: 13 }, // Same location - she can hear the nearby farm
    searchRadius: 2, // Getting more precise
    description: "Ana hears cow bells nearby",
    clueHint: "In basement near Highway 19, close to dairy farm",
  },
  {
    id: 4,
    transcript:
      "\"Someone's arguing. A man. He's saying he booked a room. What does that mean? Please, I'm scared...\"",
    correctLocation: { x: 17, y: 13 }, // Same location - confirms she's in a motel
    searchRadius: 2, // Maintaining precision
    description: "Ana overhears argument about a booked room",
    clueHint: "Confirmed: in basement of motel near Highway 19 and farm",
  },
  {
    id: 5,
    transcript: '"Oh God—he\'s coming downstairs. I think he heard me. Please hel-"',
    correctLocation: { x: 17, y: 13 }, // Same location - train passes nearby
    searchRadius: 1, // Final precise location
    description: "Final transmission cut short by train",
    clueHint: "Motel basement near Highway 19, farm, and railroad tracks",
  },
]

const DIFFICULTY_SETTINGS = {
  EASY: { squads: 5, timeLimit: 900, label: "Trainee", description: "5 dispatch squads, 15 minutes" },
  MEDIUM: { squads: 3, timeLimit: 600, label: "Officer", description: "3 dispatch squads, 10 minutes" },
  HARD: { squads: 1, timeLimit: 300, label: "Detective", description: "1 dispatch squad, 5 minutes" },
}

const POLICE_STATION_LOCATION = { x: 8, y: 10 }

export default function DispatchGame() {
  const [gameState, setGameState] = useState<GameState>({
    currentAudioClip: 1,
    squadsRemaining: 0,
    gameStatus: "incoming-call",
    completedLocations: [],
    dispatchedSquads: [],
    unlockedClips: [],
    timeElapsed: 0,
    difficulty: "MEDIUM",
  })

  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [selectedClip, setSelectedClip] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Preview marker system
  const [previewMarker, setPreviewMarker] = useState<{ x: number; y: number } | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null)

  // Debug mode
  const [debugMode, setDebugMode] = useState(false)

  // Incoming call animation
  const [callPulse, setCallPulse] = useState(true)

  // Traveling squads
  const [travelingSquads, setTravelingSquads] = useState<TravelingSquad[]>([])

  useEffect(() => {
    if (gameState.gameStatus === "incoming-call") {
      const interval = setInterval(() => {
        setCallPulse((prev) => !prev)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [gameState.gameStatus])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (gameState.gameStatus === "playing") {
      interval = setInterval(() => {
        setGameState((prev) => {
          const newTimeElapsed = prev.timeElapsed + 1
          const timeLimit = DIFFICULTY_SETTINGS[prev.difficulty].timeLimit
          if (newTimeElapsed >= timeLimit) {
            return { ...prev, gameStatus: "lost", timeElapsed: newTimeElapsed }
          }
          return { ...prev, timeElapsed: newTimeElapsed }
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [gameState.gameStatus])

  // Traveling squads animation effect
  useEffect(() => {
    if (travelingSquads.length === 0) return

    const interval = setInterval(() => {
      setTravelingSquads((prev) => {
        const updated = prev.map((squad) => ({
          ...squad,
          progress: Math.min(squad.progress + 1 / 150, 1), // 15 seconds at 100ms intervals
        }))

        // Check for completed travels
        const completed = updated.filter((squad) => squad.progress >= 1)
        const remaining = updated.filter((squad) => squad.progress < 1)

        // Process completed travels
        completed.forEach((squad) => {
          processSquadArrival(squad)
        })

        return remaining
      })
    }, 100) // Update every 100ms for smooth animation

    return () => clearInterval(interval)
  }, [travelingSquads])

  // Audio cleanup effect
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const processSquadArrival = (squad: TravelingSquad) => {
    const currentClip = AUDIO_TRAIL.find((clip) => clip.id === squad.audioClip)
    if (!currentClip) return

    const distance = Math.sqrt(
      Math.pow(squad.endX - currentClip.correctLocation.x, 2) + Math.pow(squad.endY - currentClip.correctLocation.y, 2),
    )

    const isSuccess = distance <= currentClip.searchRadius

    const newDispatch = {
      x: squad.endX,
      y: squad.endY,
      audioClip: squad.audioClip,
      success: isSuccess,
    }

    setGameState((prev) => {
      const newDispatchedSquads = [...prev.dispatchedSquads, newDispatch]
      const newSquadsRemaining = prev.squadsRemaining - 1

      if (isSuccess) {
        // Successful dispatch - advance to next clip
        const newCompletedLocation = {
          x: currentClip.correctLocation.x,
          y: currentClip.correctLocation.y,
          audioClip: prev.currentAudioClip,
        }

        const newCompletedLocations = [...prev.completedLocations, newCompletedLocation]

        if (prev.currentAudioClip >= AUDIO_TRAIL.length) {
          // Case solved!
          return {
            ...prev,
            gameStatus: "won",
            dispatchedSquads: newDispatchedSquads,
            squadsRemaining: newSquadsRemaining,
            completedLocations: newCompletedLocations,
          }
        } else {
          // Advance to next clip
          const nextClip = prev.currentAudioClip + 1
          setSelectedClip(nextClip)
          return {
            ...prev,
            currentAudioClip: nextClip,
            dispatchedSquads: newDispatchedSquads,
            squadsRemaining: newSquadsRemaining,
            completedLocations: newCompletedLocations,
            unlockedClips: [...prev.unlockedClips, nextClip],
          }
        }
      } else {
        // Failed dispatch
        if (newSquadsRemaining <= 0) {
          // Out of squads - game over
          return {
            ...prev,
            gameStatus: "lost",
            dispatchedSquads: newDispatchedSquads,
            squadsRemaining: 0,
          }
        } else {
          // Continue with fewer squads
          return {
            ...prev,
            dispatchedSquads: newDispatchedSquads,
            squadsRemaining: newSquadsRemaining,
          }
        }
      }
    })
  }

  const answerCall = () => {
    setGameState((prev) => ({ ...prev, gameStatus: "case-brief" }))
  }

  const startGame = (difficulty: "EASY" | "MEDIUM" | "HARD") => {
    const settings = DIFFICULTY_SETTINGS[difficulty]
    setGameState({
      currentAudioClip: 1,
      squadsRemaining: settings.squads,
      gameStatus: "playing",
      completedLocations: [],
      dispatchedSquads: [],
      unlockedClips: [1],
      timeElapsed: 0,
      difficulty,
    })
    setSelectedClip(1)
    setPreviewMarker(null)
    setShowConfirmDialog(false)
    setTravelingSquads([])
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const playAudio = async (clipId: number) => {
    const clip = AUDIO_TRAIL.find((c) => c.id === clipId)
    if (!clip) return

    setSelectedClip(clipId)

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    // Simulate audio playback since we don't have actual audio files
    setIsPlayingAudio(true)
    setTimeout(() => setIsPlayingAudio(false), 6000) // 6 seconds for longer clips
  }

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlayingAudio(false)
  }

  const replayAudio = () => {
    if (selectedClip) {
      playAudio(selectedClip)
    }
  }

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (gameState.gameStatus !== "playing" || showConfirmDialog || travelingSquads.length > 0) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Convert pixel coordinates to grid coordinates (20x20 grid)
    const gridX = Math.floor((x / rect.width) * 20)
    const gridY = Math.floor((y / rect.height) * 20)

    // Ensure coordinates are within bounds
    const clampedX = Math.max(0, Math.min(19, gridX))
    const clampedY = Math.max(0, Math.min(19, gridY))

    setPreviewMarker({ x: clampedX, y: clampedY })
  }

  const handleLandmarkClick = (landmark: Landmark, event: React.MouseEvent) => {
    event.stopPropagation()
    setSelectedLandmark(landmark)
  }

  const confirmDispatch = () => {
    if (!previewMarker) return

    // Store the target coordinates before clearing preview marker
    const targetX = previewMarker.x
    const targetY = previewMarker.y

    // Create traveling squad with the stored coordinates
    const newTravelingSquad: TravelingSquad = {
      id: `squad-${Date.now()}`,
      startX: POLICE_STATION_LOCATION.x,
      startY: POLICE_STATION_LOCATION.y,
      endX: targetX,
      endY: targetY,
      progress: 0,
      audioClip: gameState.currentAudioClip,
    }

    // Clear UI state first
    setPreviewMarker(null)
    setShowConfirmDialog(false)

    // Then add the traveling squad
    setTravelingSquads((prev) => [...prev, newTravelingSquad])
  }

  const resetGame = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    setGameState({
      currentAudioClip: 1,
      squadsRemaining: 0,
      gameStatus: "incoming-call",
      completedLocations: [],
      dispatchedSquads: [],
      unlockedClips: [],
      timeElapsed: 0,
      difficulty: "MEDIUM",
    })
    setSelectedClip(null)
    setIsPlayingAudio(false)
    setPreviewMarker(null)
    setShowConfirmDialog(false)
    setSelectedLandmark(null)
    setTravelingSquads([])
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "bg-green-600"
      case "MEDIUM":
        return "bg-yellow-600"
      case "HARD":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  const getSquadCountColor = (remaining: number, total: number) => {
    const ratio = remaining / total
    if (ratio > 0.6) return "text-green-400"
    if (ratio > 0.3) return "text-yellow-400"
    return "text-red-400"
  }

  // Incoming Call Screen
  if (gameState.gameStatus === "incoming-call") {
    return (
      <div
        className="min-h-screen text-white relative flex items-center justify-center"
        style={{
          background: `
            radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3), transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3), transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(120, 219, 226, 0.3), transparent 50%),
            #0a0a0a
          `,
        }}
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0),
              linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.05) 50%, transparent 60%)
            `,
            backgroundSize: "20px 20px, 40px 40px",
          }}
        />

        <div className="relative z-10 text-center">
          {/* Emergency Alert Header */}
          <div className="mb-8">
            <div className="w-16 h-16 bg-red-500 rounded-2xl mb-6 shadow-2xl transform rotate-45 mx-auto animate-pulse" />
            <h1 className="text-4xl font-light tracking-[0.2em] text-white mb-2">DISPATCH</h1>
            <p className="text-red-400 text-lg font-light animate-pulse">INCOMING CALL</p>
          </div>

          {/* Spacer for better button positioning */}
          <div className="mb-12"></div>

          {/* Answer Call Button */}
          <Button
            onClick={answerCall}
            className={`bg-green-600 hover:bg-green-700 text-white px-12 py-6 text-xl font-light rounded-full shadow-2xl border-4 border-green-400/50 transition-all duration-300 ${
              callPulse ? "scale-105 shadow-green-400/50" : "scale-100"
            }`}
          >
            <PhoneCall className="h-6 w-6 mr-3" />
            ANSWER CALL
          </Button>
        </div>
      </div>
    )
  }

  // Case Brief Screen
  if (gameState.gameStatus === "case-brief") {
    return (
      <div
        className="min-h-screen text-white relative"
        style={{
          background: `
            radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3), transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3), transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(120, 219, 226, 0.3), transparent 50%),
            #1a1a1a
          `,
        }}
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0),
              linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.05) 50%, transparent 60%)
            `,
            backgroundSize: "20px 20px, 40px 40px",
          }}
        />

        <div className="relative z-10">
          <div className="flex flex-col items-center pt-20 pb-16">
            <div className="w-16 h-16 bg-white rounded-2xl mb-8 shadow-2xl transform rotate-45" />
            <h1 className="text-6xl font-light tracking-[0.2em] text-white mb-4">DISPATCH</h1>
          </div>

          <div className="max-w-lg mx-auto px-8">
            {/* Case Brief */}
            <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-light text-white mb-4">CASE BRIEF</h2>
              <div className="space-y-3 text-sm font-light text-gray-300 leading-relaxed">
                <p>
                  <strong className="text-white">Victim:</strong> Ana Martinez, 28, reported missing 6 hours ago
                </p>
                <p>
                  <strong className="text-white">Last Known Location:</strong> Downtown parking garage
                </p>
                <p>
                  <strong className="text-white">Situation:</strong> Suspected abduction. Victim has managed to make
                  contact via cell phone from unknown location.
                </p>
                <p>
                  <strong className="text-white">Your Mission:</strong> Analyze audio transmissions to track victim's
                  location and coordinate rescue operations.
                </p>
              </div>
            </div>

            {/* Difficulty Selection */}
            <div className="space-y-4">
              <h2 className="text-lg font-light text-white/80 mb-6">Select Difficulty Level</h2>

              {Object.entries(DIFFICULTY_SETTINGS).map(([key, settings]) => (
                <div
                  key={key}
                  className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-6 cursor-pointer hover:bg-black/30 hover:border-white/20 transition-all duration-300"
                  onClick={() => startGame(key as "EASY" | "MEDIUM" | "HARD")}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-light text-white">{settings.label}</h3>
                      <Badge className={`${getDifficultyColor(key)} text-white text-xs px-2 py-1 font-light`}>
                        {key}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400 font-light">{settings.description}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span>{settings.squads} Squads</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{Math.floor(settings.timeLimit / 60)} Minutes</span>
                    </div>
                  </div>

                  {key === "EASY" && (
                    <p className="text-xs text-green-400 mt-2 font-light">Recommended for first-time players</p>
                  )}
                  {key === "HARD" && (
                    <p className="text-xs text-red-400 mt-2 font-light">One chance only - for expert detectives</p>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center mt-12 pb-8">
              <p className="text-gray-500 text-sm font-light">Emergency Response Training Simulation</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentSettings = DIFFICULTY_SETTINGS[gameState.difficulty]

  return (
    <div
      className="min-h-screen text-white relative"
      style={{
        background: `
          radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3), transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3), transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(120, 219, 226, 0.3), transparent 50%),
          #1a1a1a
        `,
      }}
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0),
            linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.05) 50%, transparent 60%)
          `,
          backgroundSize: "20px 20px, 40px 40px",
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-white rounded-lg transform rotate-45" />
            <h1 className="text-2xl font-light tracking-wider text-white">DISPATCH</h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Time Elapsed - only show during gameplay */}
            {gameState.gameStatus === "playing" && (
              <div className="flex items-center gap-2 px-3 py-2 bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg h-9">
                <Clock className="h-4 w-4 text-gray-400" />
                <div className="text-sm font-mono font-light text-gray-200">
                  {formatTime(gameState.timeElapsed)} / {Math.floor(currentSettings.timeLimit / 60)}m
                </div>
                <div className="w-12 bg-white/10 rounded-full h-1">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-red-500 h-1 rounded-full transition-all duration-1000"
                    style={{ width: `${(gameState.timeElapsed / currentSettings.timeLimit) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <Badge className={`${getDifficultyColor(gameState.difficulty)} text-white text-xs px-2 py-1 font-light`}>
              {DIFFICULTY_SETTINGS[gameState.difficulty].label}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetGame}
              className="text-white/60 hover:text-white hover:bg-white/10 font-light"
            >
              <Home className="h-4 w-4 mr-2" />
              Menu
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDebugMode(!debugMode)}
              className={`text-white/60 hover:text-white hover:bg-white/10 font-light ${debugMode ? "bg-red-500/20 text-red-300" : ""}`}
            >
              <Target className="h-4 w-4 mr-2" />
              Debug {debugMode ? "ON" : "OFF"}
            </Button>
          </div>
        </div>

        <div className="flex h-[calc(100vh-73px)]">
          {/* Left Sidebar */}
          <div className="w-96 bg-black/20 backdrop-blur-sm border-r border-white/10 p-6 space-y-6">
            {/* Squad Management */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-light text-blue-400">Dispatch Squads</h3>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-light">Squads Available:</span>
                <span
                  className={`text-2xl font-mono font-light ${getSquadCountColor(gameState.squadsRemaining, currentSettings.squads)}`}
                >
                  {gameState.squadsRemaining}/{currentSettings.squads}
                </span>
              </div>

              {/* Squad Icons */}
              <div className="flex gap-1">
                {Array.from({ length: currentSettings.squads }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded border-2 flex items-center justify-center text-xs font-bold ${
                      i < gameState.squadsRemaining
                        ? "bg-blue-500 border-blue-400 text-white"
                        : "bg-gray-600 border-gray-500 text-gray-400"
                    }`}
                  >
                    {i < gameState.squadsRemaining ? "🚔" : "❌"}
                  </div>
                ))}
              </div>

              {gameState.squadsRemaining === 1 && (
                <div className="text-xs text-red-400 font-light animate-pulse flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  FINAL SQUAD - USE CAREFULLY
                </div>
              )}

              {travelingSquads.length > 0 && (
                <div className="text-xs text-yellow-400 font-light flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  SQUAD EN ROUTE - {Math.ceil((1 - travelingSquads[0].progress) * 15)}s remaining
                </div>
              )}
            </div>

            {/* Audio Trail Progress */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-purple-400" />
                <h3 className="text-lg font-light text-purple-400">Audio Trail</h3>
                <div className="ml-auto text-gray-400 text-sm font-light">
                  Transmission {gameState.currentAudioClip}/{AUDIO_TRAIL.length}
                </div>
              </div>

              <div className="space-y-2">
                {AUDIO_TRAIL.map((clip) => {
                  const isUnlocked = gameState.unlockedClips.includes(clip.id)
                  const isCurrent = clip.id === gameState.currentAudioClip
                  const isCompleted = clip.id < gameState.currentAudioClip

                  return (
                    <div
                      key={clip.id}
                      className={`p-3 rounded-lg border text-sm ${
                        isCurrent
                          ? "bg-purple-500/20 border-purple-400 text-purple-200"
                          : isCompleted
                            ? "bg-green-500/20 border-green-400 text-green-200"
                            : isUnlocked
                              ? "bg-gray-500/20 border-gray-500 text-gray-400"
                              : "bg-gray-800/20 border-gray-700 text-gray-600"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono">#{clip.id}</span>
                        {isCompleted && <CheckCircle className="h-4 w-4" />}
                        {isCurrent && <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />}
                        {!isUnlocked && <span className="text-xs">🔒</span>}
                      </div>

                      {isUnlocked ? (
                        <>
                          {/* Show "INCOMING CALL" for first clip, description for others */}
                          {clip.id === 1 && isCurrent ? (
                            <div className="flex items-center gap-2">
                              <span className="text-red-400 font-light animate-pulse">INCOMING CALL</span>
                            </div>
                          ) : (
                            <p className="font-light mb-2">{clip.description}</p>
                          )}

                          {/* Only show clue hint for completed clips (not current) */}
                          {clip.id < gameState.currentAudioClip && (
                            <p className="text-xs mt-1 opacity-75 italic">{clip.clueHint}</p>
                          )}

                          {/* Show transcript and audio controls for current clip */}
                          {isCurrent && (
                            <div className="mt-3 space-y-3 border-t border-purple-400/30 pt-3">
                              <div className="bg-black/30 backdrop-blur-sm border border-white/10 p-3 rounded-lg">
                                <p className="text-gray-200 text-xs leading-relaxed font-light">{clip.transcript}</p>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  onClick={() => {
                                    if (isPlayingAudio) {
                                      stopAudio()
                                    } else {
                                      playAudio(clip.id)
                                    }
                                  }}
                                  className="bg-red-600/80 hover:bg-red-600 border border-red-500/50 text-white flex-1 font-light text-xs py-2"
                                >
                                  {isPlayingAudio ? (
                                    <Pause className="h-3 w-3 mr-1" />
                                  ) : (
                                    <Play className="h-3 w-3 mr-1" />
                                  )}
                                  {isPlayingAudio ? "Stop" : "Play"}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-white/20 bg-transparent hover:bg-white/10 text-white px-2"
                                  onClick={replayAudio}
                                >
                                  <RotateCcw className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="font-light text-gray-500">LOCKED</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Map Area */}
          <div className="flex-1 relative">
            {/* Map Legend Panel */}

            {/* Coordinate Labels */}
            <div className="absolute top-0 left-0 right-0 h-6 bg-black/40 backdrop-blur-sm border-b border-white/10 flex z-40">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 text-center text-xs text-gray-400 font-mono border-r border-white/10 last:border-r-0"
                  style={{ lineHeight: "24px" }}
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>

            <div className="absolute top-6 left-0 bottom-0 w-6 bg-black/40 backdrop-blur-sm border-r border-white/10 flex flex-col z-40">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 text-center text-xs text-gray-400 font-mono border-b border-white/10 last:border-b-0 flex items-center justify-center"
                >
                  {i + 1}
                </div>
              ))}
            </div>

            <div className="w-full h-full relative overflow-hidden cursor-crosshair ml-6 mt-6" onClick={handleMapClick}>
              {/* Dark tactical background */}
              <div className="w-full h-full relative bg-gray-900">
                {/* City blocks pattern - creating realistic urban grid */}
                <div className="absolute inset-0">
                  {Array.from({ length: 20 }).map((_, row) =>
                    Array.from({ length: 20 }).map((_, col) => {
                      // Define different area types
                      const isDowntown = row >= 7 && row <= 12 && col >= 3 && col <= 9
                      const isIndustrial = row >= 12 && row <= 17 && col >= 14 && col <= 19
                      const isPark = row >= 4 && row <= 8 && col >= 9 && col <= 13
                      const isResidential = !isDowntown && !isIndustrial && !isPark

                      // Set block colors based on area type
                      let backgroundColor
                      let borderColor
                      if (isDowntown) {
                        backgroundColor = "rgba(59, 130, 246, 0.15)" // Blue tint for downtown
                        borderColor = "rgba(59, 130, 246, 0.3)"
                      } else if (isIndustrial) {
                        backgroundColor = "rgba(17, 24, 39, 0.9)" // Very dark for industrial
                        borderColor = "rgba(75, 85, 99, 0.4)"
                      } else if (isPark) {
                        backgroundColor = "rgba(34, 197, 94, 0.1)" // Green tint for park
                        borderColor = "rgba(34, 197, 94, 0.3)"
                      } else {
                        // Residential - varied grays
                        const opacity = Math.random() > 0.6 ? 0.7 : 0.5
                        backgroundColor = `rgba(31, 41, 55, ${opacity})`
                        borderColor = "rgba(107, 114, 128, 0.3)"
                      }

                      return (
                        <div
                          key={`block-${row}-${col}`}
                          className="absolute"
                          style={{
                            left: `${(col / 20) * 100}%`,
                            top: `${(row / 20) * 100}%`,
                            width: `${100 / 20}%`,
                            height: `${100 / 20}%`,
                            backgroundColor,
                            border: `1px solid ${borderColor}`,
                          }}
                        />
                      )
                    }),
                  )}
                </div>

                {/* Street grid - with major/minor road hierarchy */}
                <div className="absolute inset-0" style={{ zIndex: 30 }}>
                  {/* Vertical streets */}
                  {Array.from({ length: 21 }).map((_, i) => {
                    const isMajorStreet = i % 5 === 0 || i === 10 // Major streets every 5 blocks + center
                    return (
                      <div
                        key={`v-street-${i}`}
                        className="absolute top-0 bottom-0"
                        style={{
                          left: `${(i / 20) * 100}%`,
                          width: isMajorStreet ? "4px" : "2px",
                          backgroundColor: isMajorStreet ? "rgba(156, 163, 175, 0.8)" : "rgba(107, 114, 128, 0.6)",
                        }}
                      />
                    )
                  })}
                  {/* Horizontal streets */}
                  {Array.from({ length: 21 }).map((_, i) => {
                    const isMajorStreet = i % 5 === 0 || i === 10 // Major streets every 5 blocks + center
                    return (
                      <div
                        key={`h-street-${i}`}
                        className="absolute left-0 right-0"
                        style={{
                          top: `${(i / 20) * 100}%`,
                          height: isMajorStreet ? "4px" : "2px",
                          backgroundColor: isMajorStreet ? "rgba(156, 163, 175, 0.8)" : "rgba(107, 114, 128, 0.6)",
                        }}
                      />
                    )
                  })}
                </div>

                {/* Area labels with proper styling */}
                <div className="absolute top-[45%] left-[25%] bg-blue-900/80 px-3 py-1 rounded text-sm text-blue-200 font-light border border-blue-400/50 shadow-lg">
                  DOWNTOWN
                </div>
                <div className="absolute top-[75%] left-[85%] bg-black/80 px-3 py-1 rounded text-sm text-white font-light border border-white/30 shadow-lg">
                  RURAL AREA
                </div>
                <div className="absolute top-[30%] left-[55%] bg-green-900/80 px-3 py-1 rounded text-sm text-green-300 font-light border border-green-500/50 shadow-lg">
                  PARK
                </div>
                <div className="absolute top-[15%] left-[75%] bg-gray-900/80 px-3 py-1 rounded text-sm text-gray-300 font-light border border-gray-500/50 shadow-lg">
                  INDUSTRIAL
                </div>

                {/* Highway - enhanced line cutting through the grid */}
                <div
                  className="absolute bg-yellow-400/80 shadow-lg border-t border-b border-yellow-300/50"
                  style={{
                    left: "40%",
                    top: "55%",
                    right: "20%",
                    height: "6px",
                    transform: "rotate(12deg)",
                    zIndex: 35,
                  }}
                />

                {/* Railroad tracks - enhanced parallel lines */}
                <div
                  className="absolute bg-gray-300/80 shadow-sm"
                  style={{
                    left: "60%",
                    top: "25%",
                    right: "10%",
                    height: "3px",
                    transform: "rotate(45deg)",
                    zIndex: 35,
                  }}
                />
                <div
                  className="absolute bg-gray-300/80 shadow-sm"
                  style={{
                    left: "60%",
                    top: "26%",
                    right: "10%",
                    height: "3px",
                    transform: "rotate(45deg)",
                    marginTop: "6px",
                    zIndex: 35,
                  }}
                />
                {/* Railroad cross-ties */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={`tie-${i}`}
                    className="absolute bg-gray-400/60"
                    style={{
                      left: `${60 + i * 3}%`,
                      top: "24%",
                      width: "8px",
                      height: "2px",
                      transform: "rotate(-45deg)",
                      zIndex: 34,
                    }}
                  />
                ))}

                {/* Enhanced labels with better styling */}
                <div className="absolute top-[58%] left-[45%] text-sm font-medium text-yellow-100 transform rotate-12 bg-yellow-800/80 px-3 py-1 rounded border border-yellow-400/70 shadow-lg">
                  HIGHWAY 19
                </div>
                <div className="absolute top-[28%] left-[65%] text-sm font-medium text-gray-100 transform rotate-45 bg-gray-800/80 px-3 py-1 rounded border border-gray-400/70 shadow-lg">
                  RAILROAD
                </div>
              </div>

              {/* Landmark Icons */}
              {LANDMARKS.map((landmark) => (
                <div
                  key={landmark.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform duration-200"
                  style={{
                    left: `${((landmark.x + 0.5) / 20) * 100}%`,
                    top: `${((landmark.y + 0.5) / 20) * 100}%`,
                    zIndex: 150,
                  }}
                  onClick={(e) => handleLandmarkClick(landmark, e)}
                  title={landmark.name}
                >
                  <div className="relative">
                    <div className="text-2xl bg-white rounded-full p-2 shadow-lg border-2 border-gray-300 hover:border-blue-400 transition-colors">
                      {landmark.icon}
                    </div>
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white border border-gray-300 rotate-45"></div>
                  </div>
                </div>
              ))}

              {/* Traveling squads */}
              {travelingSquads.map((squad) => {
                const currentX = squad.startX + (squad.endX - squad.startX) * squad.progress
                const currentY = squad.startY + (squad.endY - squad.startY) * squad.progress

                return (
                  <div
                    key={squad.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 z-[300]"
                    style={{
                      left: `${((currentX + 0.5) / 20) * 100}%`,
                      top: `${((currentY + 0.5) / 20) * 100}%`,
                    }}
                    title={`Squad en route - ${Math.ceil((1 - squad.progress) * 15)}s remaining`}
                  >
                    <div className="text-2xl animate-pulse drop-shadow-lg">🚔</div>
                  </div>
                )
              })}

              {/* Completed locations (successful dispatches) */}
              {gameState.completedLocations.map((location, index) => (
                <div
                  key={`completed-${index}`}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${((location.x + 0.5) / 20) * 100}%`,
                    top: `${((location.y + 0.5) / 20) * 100}%`,
                    zIndex: 200,
                  }}
                  title={`Completed location ${location.audioClip}`}
                >
                  <div className="w-6 h-6 bg-green-400 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                </div>
              ))}

              {/* Failed dispatches */}
              {gameState.dispatchedSquads
                .filter((squad) => !squad.success)
                .map((squad, index) => (
                  <div
                    key={`failed-${index}`}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${((squad.x + 0.5) / 20) * 100}%`,
                      top: `${((squad.y + 0.5) / 20) * 100}%`,
                      zIndex: 150,
                    }}
                    title={`Failed dispatch - Audio ${squad.audioClip}`}
                  >
                    <div className="w-6 h-6 bg-red-400 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                      <X className="h-4 w-4 text-white" />
                    </div>
                  </div>
                ))}

              {/* Preview marker */}
              {previewMarker && travelingSquads.length === 0 && (
                <div
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
                  style={{
                    left: `${((previewMarker.x + 0.5) / 20) * 100}%`,
                    top: `${((previewMarker.y + 0.5) / 20) * 100}%`,
                    zIndex: 250,
                  }}
                  title={`Preview dispatch location: ${String.fromCharCode(65 + previewMarker.x)}${previewMarker.y + 1}`}
                >
                  <div className="w-8 h-8 bg-blue-400 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                </div>
              )}

              {/* Debug mode - show correct location */}
              {debugMode && gameState.gameStatus === "playing" && (
                <>
                  {/* Correct location marker */}
                  <div
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
                    style={{
                      left: `${((AUDIO_TRAIL[gameState.currentAudioClip - 1].correctLocation.x + 0.5) / 20) * 100}%`,
                      top: `${((AUDIO_TRAIL[gameState.currentAudioClip - 1].correctLocation.y + 0.5) / 20) * 100}%`,
                      zIndex: 240,
                    }}
                    title={`DEBUG: Correct location for clip ${gameState.currentAudioClip}`}
                  >
                    <div className="w-10 h-10 bg-red-500 rounded-full border-4 border-yellow-300 shadow-lg flex items-center justify-center">
                      <span className="text-white font-bold text-xs">✓</span>
                    </div>
                  </div>

                  {/* Search radius visualization */}
                  <div
                    className="absolute border-4 border-red-400/50 bg-red-500/10 rounded-full animate-pulse"
                    style={{
                      left: `${((AUDIO_TRAIL[gameState.currentAudioClip - 1].correctLocation.x + 0.5 - AUDIO_TRAIL[gameState.currentAudioClip - 1].searchRadius) / 20) * 100}%`,
                      top: `${((AUDIO_TRAIL[gameState.currentAudioClip - 1].correctLocation.y + 0.5 - AUDIO_TRAIL[gameState.currentAudioClip - 1].searchRadius) / 20) * 100}%`,
                      width: `${((AUDIO_TRAIL[gameState.currentAudioClip - 1].searchRadius * 2) / 20) * 100}%`,
                      height: `${((AUDIO_TRAIL[gameState.currentAudioClip - 1].searchRadius * 2) / 20) * 100}%`,
                      zIndex: 230,
                    }}
                    title={`DEBUG: Search radius (${AUDIO_TRAIL[gameState.currentAudioClip - 1].searchRadius} blocks)`}
                  />

                  {/* Debug info overlay */}
                  <div className="absolute top-4 left-4 bg-red-900/90 backdrop-blur-sm border border-red-500/50 rounded-lg p-3 text-xs font-light z-50 max-w-xs">
                    <div className="text-red-300 font-medium mb-2">🐛 DEBUG MODE</div>
                    <div className="space-y-1 text-red-200">
                      <div>Clip #{gameState.currentAudioClip}</div>
                      <div>
                        Correct:{" "}
                        {String.fromCharCode(65 + AUDIO_TRAIL[gameState.currentAudioClip - 1].correctLocation.x)}
                        {AUDIO_TRAIL[gameState.currentAudioClip - 1].correctLocation.y + 1}
                      </div>
                      <div>Radius: {AUDIO_TRAIL[gameState.currentAudioClip - 1].searchRadius} blocks</div>
                    </div>
                  </div>
                </>
              )}

              {/* Dispatch confirmation button */}
              {previewMarker && !showConfirmDialog && travelingSquads.length === 0 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2" style={{ zIndex: 300 }}>
                  <Button
                    onClick={() => setShowConfirmDialog(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-xl border-2 border-white"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Dispatch Squad to {String.fromCharCode(65 + previewMarker.x)}
                    {previewMarker.y + 1}
                  </Button>
                </div>
              )}
            </div>

            {/* Status Bar */}
          </div>
        </div>
      </div>

      {/* Dispatch Confirmation Dialog */}
      {showConfirmDialog && previewMarker && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="bg-black/40 backdrop-blur-sm border border-blue-500/30 max-w-md">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <AlertTriangle className="h-6 w-6 text-yellow-400" />
                  <h3 className="text-xl font-light text-white">Confirm Dispatch</h3>
                </div>

                <p className="text-gray-300 font-light">
                  Dispatch squad to Grid {String.fromCharCode(65 + previewMarker.x)}
                  {previewMarker.y + 1}?
                </p>

                <div className="flex items-center justify-center gap-2 text-sm">
                  <span className="text-gray-400">Squads remaining:</span>
                  <span
                    className={`font-mono font-bold ${getSquadCountColor(gameState.squadsRemaining, currentSettings.squads)}`}
                  >
                    {gameState.squadsRemaining}
                  </span>
                </div>

                <div className="text-yellow-400 text-sm font-light">⏱️ Squad will take 15 seconds to arrive</div>

                {gameState.squadsRemaining === 1 && (
                  <div className="text-red-400 text-sm font-light animate-pulse">⚠️ This is your final squad!</div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setShowConfirmDialog(false)}
                    variant="outline"
                    className="flex-1 border-white/20 bg-transparent hover:bg-white/10 text-white font-light"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmDispatch}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-light"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Dispatch
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Landmark Information Modal */}
      {selectedLandmark && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="bg-white max-w-md mx-4">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{selectedLandmark.icon}</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedLandmark.name}</h3>
                    <p className="text-sm text-gray-600">{selectedLandmark.description}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedLandmark(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-gray-700 leading-relaxed">{selectedLandmark.details}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Game Over Overlays */}
      {gameState.gameStatus === "won" && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="bg-black/40 backdrop-blur-sm border border-green-500/30 max-w-md">
            <CardContent className="pt-6 text-center">
              <h2 className="text-2xl font-light text-green-400 mb-2">ANA RESCUED!</h2>
              <p className="text-green-200 mb-4 font-light">
                Outstanding detective work! You successfully tracked Ana's location and coordinated her rescue in{" "}
                {formatTime(gameState.timeElapsed)}.
              </p>
              <div className="text-sm text-gray-300 mb-4">
                Squads used: {currentSettings.squads - gameState.squadsRemaining}/{currentSettings.squads}
              </div>
              <Button
                onClick={resetGame}
                className="bg-transparent border border-white/20 hover:bg-white/10 text-white font-light"
              >
                New Case
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {gameState.gameStatus === "lost" && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="bg-black/40 backdrop-blur-sm border border-red-500/30 max-w-md">
            <CardContent className="pt-6 text-center">
              <h2 className="text-2xl font-light text-red-400 mb-2">CASE FAILED</h2>
              <p className="text-red-200 mb-4 font-light">
                {gameState.squadsRemaining <= 0
                  ? "All dispatch squads have been deployed unsuccessfully. Ana's trail has gone cold."
                  : "Time ran out. Ana could not be located in time."}
              </p>
              <Button
                onClick={resetGame}
                className="bg-transparent border border-white/20 hover:bg-white/10 text-white font-light"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
