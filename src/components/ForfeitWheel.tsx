import { useState, useRef, useCallback } from 'react'
import type { Forfeit } from '../lib/types'

interface Props {
  forfeits: Forfeit[]
  onMarkUsed: (id: string) => void
}

export function ForfeitWheel({ forfeits, onMarkUsed }: Props) {
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<Forfeit | null>(null)
  const [rotation, setRotation] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const available = forfeits.filter(f => !f.is_used)

  const spin = useCallback(() => {
    if (available.length === 0 || spinning) return

    setSpinning(true)
    setResult(null)

    const idx = Math.floor(Math.random() * available.length)
    const chosen = available[idx]

    const segmentAngle = 360 / available.length
    const targetAngle = 360 - (idx * segmentAngle + segmentAngle / 2)
    const totalRotation = rotation + 360 * 5 + targetAngle

    setRotation(totalRotation)

    timerRef.current = setTimeout(() => {
      setResult(chosen)
      setSpinning(false)
    }, 3000)
  }, [available, spinning, rotation])

  if (forfeits.length === 0) {
    return (
      <div className="px-4 pt-6 pb-24 text-center">
        <h2 className="text-xl font-bold mb-4">🎡 Forfeit Wheel</h2>
        <p className="text-gray-500">No forfeits loaded yet</p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-24 text-center">
      <h2 className="text-xl font-bold mb-4">🎡 Forfeit Wheel</h2>

      {/* Wheel visual */}
      <div className="relative w-72 h-72 mx-auto mb-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10 text-2xl">▼</div>
        <div
          className="w-full h-full rounded-full border-4 border-gray-700 overflow-hidden relative"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
          }}
        >
          {available.map((forfeit, i) => {
            const segmentAngle = 360 / available.length
            const colors = ['bg-red-800', 'bg-blue-800', 'bg-green-800', 'bg-yellow-800',
              'bg-purple-800', 'bg-pink-800', 'bg-indigo-800', 'bg-orange-800']
            return (
              <div key={forfeit.id}
                className={`absolute inset-0 ${colors[i % colors.length]}`}
                style={{
                  transform: `rotate(${i * segmentAngle}deg)`,
                  clipPath: `polygon(50% 50%, 50% 0%, ${
                    50 + 50 * Math.sin((segmentAngle * Math.PI) / 180)
                  }% ${
                    50 - 50 * Math.cos((segmentAngle * Math.PI) / 180)
                  }%)`,
                }}
              />
            )
          })}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center text-2xl">🎲</div>
          </div>
        </div>
      </div>

      <button onClick={spin} disabled={spinning || available.length === 0}
        className={`px-8 py-3 rounded-full font-bold text-lg ${
          spinning ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-yellow-600 text-white hover:bg-yellow-500 active:scale-95'
        } transition-all`}>
        {spinning ? '🌀 Spinning...' : '🎰 Spin!'}
      </button>

      {result && (
        <div className="mt-6 bg-gray-900 rounded-lg p-4 mx-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">The forfeit is...</p>
          <p className="text-xl font-bold text-yellow-400">{result.text}</p>
          <button onClick={() => onMarkUsed(result.id)}
            className="mt-3 text-xs text-gray-500 underline">
            Mark as done (remove from wheel)
          </button>
        </div>
      )}
    </div>
  )
}
