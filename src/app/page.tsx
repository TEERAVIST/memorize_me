'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const suits = ['♠', '♥', '♦', '♣']
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

function shuffleDeck(): string[] {
  const deck: string[] = []
  for (const s of suits) for (const v of values) deck.push(`${v}${s}`)
  return deck.sort(() => Math.random() - 0.5)
}

function fileName(card: string): string {
  return card.replace('♠', 'S').replace('♥', 'H').replace('♦', 'D').replace('♣', 'C')
}

function getRandomUniqueNumbers(count: number, max: number): number[] {
  const numbers = new Set<number>()
  while (numbers.size < count) {
    numbers.add(Math.floor(Math.random() * max))
  }
  return Array.from(numbers).sort((a, b) => a - b)
}

// Helper function to format time from seconds to HH.MM.SS
function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num: number) => num.toString().padStart(2, '0');

  return `${pad(hours)}.${pad(minutes)}.${pad(seconds)}`;
}

export default function SakuraMemory() {
  const [deck, setDeck] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showQuestions, setShowQuestions] = useState(false)
  const [randomQuestionIndexes, setRandomQuestionIndexes] = useState<number[]>([])
  const [answers, setAnswers] = useState<string[]>(Array(5).fill(''))
  const [result, setResult] = useState<string[]>([])

  // Timer states
  const [roundTime, setRoundTime] = useState(0) // Time for the current round in seconds
  const [totalTime, setTotalTime] = useState(0) // Total time played across all rounds in seconds
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null)
  const totalTimerRef = useRef<NodeJS.Timeout | null>(null)

  const [playlist, setPlaylist] = useState<string[]>([])
  const [trackIndex, setTrackIndex] = useState(0)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const flipAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    flipAudioRef.current = new Audio('/sfx/flip.mp3')
    flipAudioRef.current.volume = 0.4
  }, [])

  const playFlipSound = () => {
    if (flipAudioRef.current) {
      flipAudioRef.current.currentTime = 0
      flipAudioRef.current.play().catch(() => {})
    }
  }

  useEffect(() => {
    fetch('/api/music')
      .then(res => res.json())
      .then(files => {
        const shuffled = files.sort(() => Math.random() - 0.5)
        setPlaylist(shuffled.map((f: string) => `/music/${f}`))
        setTrackIndex(Math.floor(Math.random() * shuffled.length))
      })
  }, [])

  useEffect(() => {
    setDeck(shuffleDeck())
    // Start total time tracking when component mounts
    totalTimerRef.current = setInterval(() => {
      setTotalTime(prevTime => prevTime + 1)
    }, 1000)

    return () => {
      if (totalTimerRef.current) {
        clearInterval(totalTimerRef.current)
      }
    }
  }, [])

  // Start/Stop round timer
  useEffect(() => {
    if (!showQuestions) { // Timer runs when viewing cards
      roundTimerRef.current = setInterval(() => {
        setRoundTime(prevTime => prevTime + 1)
      }, 1000)
    } else { // Stop timer when questions are shown
      if (roundTimerRef.current) {
        clearInterval(roundTimerRef.current)
        roundTimerRef.current = null
      }
    }

    return () => {
      if (roundTimerRef.current) {
        clearInterval(roundTimerRef.current)
      }
    }
  }, [showQuestions])


  useEffect(() => {
    if (playlist.length === 0) return
    const newAudio = new Audio(playlist[trackIndex])
    newAudio.loop = false
    newAudio.volume = 0.5

    newAudio.play().then(() => setIsPlaying(true)).catch(() => {})
    newAudio.onended = () => {
      const nextIndex = (trackIndex + 1) % playlist.length
      setTrackIndex(nextIndex)
      setIsPlaying(true)
    }

    setAudio(newAudio)

    return () => {
      newAudio.pause()
      newAudio.src = ''
    }
  }, [playlist, trackIndex])

  const goNext = () => {
    if (currentIndex < deck.length - 1) {
      playFlipSound()
      setCurrentIndex(currentIndex + 1)
    } else {
      const numQuestions = 5;
      setRandomQuestionIndexes(getRandomUniqueNumbers(numQuestions, deck.length));
      setAnswers(Array(numQuestions).fill(''));
      setShowQuestions(true);
      // Round timer will automatically stop due to showQuestions change
    }
  }

  const goPrev = () => {
    if (currentIndex > 0) {
      playFlipSound()
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleRestart = () => {
    setDeck(shuffleDeck())
    setCurrentIndex(0)
    setShowQuestions(false)
    setResult([])
    setAnswers(Array(5).fill(''))
    setRandomQuestionIndexes([]);
    setRoundTime(0); // Reset round time for the new round
    // Round timer will automatically restart due to showQuestions change
    playFlipSound()
  }

  const handleAnswerChange = (i: number, value: string) => {
    const newAns = [...answers]
    newAns[i] = value
    setAnswers(newAns)
  }

  const handleCheck = () => {
    const res = answers.map((ans, i) => {
      const correct = deck[randomQuestionIndexes[i]].toUpperCase()
      return ans.trim().toUpperCase() === correct ? '✅ ถูกต้อง' : `❌ ผิด (คำตอบที่ถูกคือ: ${correct})`
    })
    setResult(res)
  }

  const songName = playlist[trackIndex]?.split('/').pop()?.replace('.mp3', '').replace(/[-_]/g, ' ') || 'กำลังโหลด...'

  return (
    <div className="relative min-h-screen overflow-hidden text-white font-sans">
      <video autoPlay muted loop playsInline className="absolute top-0 left-0 w-full h-full object-cover opacity-30 z-0">
        <source src="/bg/sakura-loop.mp4" type="video/mp4" />
      </video>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        <h1 className="text-2xl font-bold mb-6 drop-shadow-xl">
          🌸 Sakura Memory: ทดสอบความจำไพ่
        </h1>

        {/* Timer Display */}
        <div className="mb-4 text-lg font-semibold drop-shadow">
          <p>เวลาในรอบปัจจุบัน: {formatTime(roundTime)}</p>
          <p>เวลาเล่นทั้งหมด: {formatTime(totalTime)}</p>
        </div>

        {!showQuestions ? (
          <>
            <div className="w-[200px] h-[300px] flex items-center justify-center mb-6">
              <AnimatePresence mode="wait">
                {deck.length > 0 && (
                  <motion.img
                    key={deck[currentIndex]}
                    src={`/cards/${fileName(deck[currentIndex])}.png`}
                    alt={deck[currentIndex]}
                    initial={{ opacity: 0, scale: 0.6, rotateY: 90 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    exit={{ opacity: 0, scale: 0.3, rotateY: -90 }}
                    transition={{ duration: 0.4 }}
                    className="w-full h-auto rounded-xl shadow-2xl"
                  />
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-6 mb-4">
              <button onClick={goPrev} disabled={currentIndex === 0} className="bg-blue-800 px-4 py-2 rounded disabled:opacity-30">
                ⏪ ก่อนหน้า
              </button>
              <span className="text-lg font-semibold drop-shadow">ใบที่ {currentIndex + 1} / 52</span>
              <button onClick={goNext} className="bg-blue-800 px-4 py-2 rounded">
                ⏩ ถัดไป
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-4">📝 ตอบคำถามความจำ (เลือกไพ่จากภาพ)</h2>
            {randomQuestionIndexes.map((idx, i) => (
              <div key={idx} className="my-4">
                <p className="mb-2">ไพ่ใบที่ {idx + 1} คือ:</p>
                <div className="grid grid-cols-13 gap-1">
                  {deck.map((card) => (
                    <img
                      key={card + i}
                      src={`/cards/${fileName(card)}.png`}
                      alt={card}
                      title={card}
                      onClick={() => handleAnswerChange(i, card)}
                      className={`w-8 h-auto rounded cursor-pointer transition duration-200 ${
                        answers[i] === card ? 'ring-2 ring-yellow-400' : 'opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}

            <button onClick={handleCheck} className="mt-4 bg-green-600 text-white px-4 py-2 rounded">
              ✅ ตรวจคำตอบ
            </button>

            {result.length > 0 && (
              <div className="mt-6 space-y-2">
                {result.map((res, i) => {
                  const isCorrect = res.startsWith('✅');
                  const correctCard = deck[randomQuestionIndexes[i]];

                  return (
                    <div key={i} className="text-lg flex items-center gap-2">
                      คำตอบไพ่ใบที่ {randomQuestionIndexes[i] + 1}:{' '}
                      {isCorrect ? (
                        <>
                          ✅ ถูกต้อง
                          <img src={`/cards/${fileName(correctCard)}.png`} alt={correctCard} className="inline-block w-10 h-auto rounded" />
                        </>
                      ) : (
                        <>
                          ❌ ผิด (คำตอบที่ถูกคือ:
                          <img src={`/cards/${fileName(correctCard)}.png`} alt={correctCard} className="inline-block w-10 h-auto rounded" />)
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <button onClick={handleRestart} className="mt-6 bg-purple-600 text-white px-4 py-2 rounded">
              🔄 เริ่มใหม่
            </button>
          </>
        )}

        {playlist.length > 0 && (
          <div className="flex flex-col items-center justify-center mt-6">
            <div className="flex gap-4">
              <button
                onClick={() => {
                  if (!audio) return
                  if (isPlaying) audio.pause()
                  else audio.play()
                  setIsPlaying(!isPlaying)
                }}
                className="bg-pink-600 text-white px-4 py-2 rounded"
              >
                {isPlaying ? '⏸ หยุดเพลง' : '▶️ เล่นเพลง'}
              </button>

              <button
                onClick={() => {
                  audio?.pause()
                  const nextIndex = (trackIndex + 1) % playlist.length
                  setTrackIndex(nextIndex)
                  setIsPlaying(true)
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded"
              >
                ⏭ เพลงถัดไป
              </button>
            </div>
            <p className="mt-2 text-sm text-pink-200 italic tracking-wide">
              🎼 ตอนนี้กำลังเล่น: <span className="font-semibold text-white">{songName}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}