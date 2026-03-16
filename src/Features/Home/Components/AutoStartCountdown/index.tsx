import { Button } from '@/Shared/UI'

interface AutoStartCountdownProps {
  isActive: boolean
  timer: number
  onCancel: () => void
}

export const AutoStartCountdown = ({ isActive, timer, onCancel }: AutoStartCountdownProps) => {
  if (!isActive) return null

  return (
    <div className="p-4 bg-orange-100  text-center  fixed top-0 left-0 w-full z-50 flex flex-row items-center justify-between gap-4 ">
      <p className="text-lg font-semibold text-orange-800 mb-2">
        En {timer} segundos se iniciará la reproducción de video automático
      </p>
      <Button className="h-10 w-40 bg-red-500 hover:bg-red-600 text-white" onClick={onCancel}>
        Cancelar
      </Button>
    </div>
  )
}
