import { useCallback, useEffect, useRef, useState } from "react"

type TorchMediaTrackCapabilities = MediaTrackCapabilities & {
  torch?: boolean
}

type TorchMediaTrackConstraintSet = MediaTrackConstraintSet & {
  torch?: boolean
}

const videoConstraints: MediaTrackConstraints = {
  facingMode: { ideal: "environment" },
  width: { ideal: 1280 },
  height: { ideal: 720 },
}

export const useCamera = () => {
  const streamRef = useRef<MediaStream | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [torchSupported, setTorchSupported] = useState(false)
  const [torchEnabled, setTorchEnabledState] = useState(false)

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setDevices([])
      return []
    }

    const nextDevices = (await navigator.mediaDevices.enumerateDevices()).filter(
      (device) => device.kind === "videoinput",
    )
    setDevices(nextDevices)
    return nextDevices
  }, [])

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setStream(null)
    setTorchSupported(false)
    setTorchEnabledState(false)
  }, [])

  const start = useCallback(
    async (deviceId?: string) => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera API is not available in this browser")
        return null
      }

      setIsStarting(true)
      setError(null)
      stop()

      try {
        const constraints: MediaStreamConstraints = {
          video: deviceId
            ? { ...videoConstraints, deviceId: { exact: deviceId } }
            : videoConstraints,
          audio: false,
        }
        const nextStream = await navigator.mediaDevices.getUserMedia(constraints)
        const videoTrack = nextStream.getVideoTracks()[0]
        const settings = videoTrack?.getSettings()
        const capabilities = videoTrack?.getCapabilities() as
          | TorchMediaTrackCapabilities
          | undefined

        streamRef.current = nextStream
        setStream(nextStream)
        setActiveDeviceId(settings?.deviceId ?? deviceId ?? null)
        setTorchSupported(Boolean(capabilities?.torch))
        setTorchEnabledState(false)
        await refreshDevices()
        return nextStream
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to start camera"
        setError(message)
        return null
      } finally {
        setIsStarting(false)
      }
    },
    [refreshDevices, stop],
  )

  const switchCamera = useCallback(async () => {
    const availableDevices = devices.length ? devices : await refreshDevices()

    if (availableDevices.length < 2) {
      return streamRef.current
    }

    const currentIndex = availableDevices.findIndex(
      (device) => device.deviceId === activeDeviceId,
    )
    const nextDevice =
      availableDevices[(currentIndex + 1 + availableDevices.length) % availableDevices.length]

    return start(nextDevice.deviceId)
  }, [activeDeviceId, devices, refreshDevices, start])

  const setTorch = useCallback(async (enabled: boolean) => {
    const videoTrack = streamRef.current?.getVideoTracks()[0]

    if (!videoTrack) {
      return
    }

    const capabilities = videoTrack.getCapabilities() as TorchMediaTrackCapabilities

    if (!capabilities.torch) {
      setTorchSupported(false)
      return
    }

    await videoTrack.applyConstraints({
      advanced: [{ torch: enabled } as TorchMediaTrackConstraintSet],
    })
    setTorchEnabledState(enabled)
  }, [])

  useEffect(() => {
    void refreshDevices()
    return stop
  }, [refreshDevices, stop])

  return {
    activeDeviceId,
    devices,
    error,
    isStarting,
    setTorch,
    start,
    stop,
    stream,
    switchCamera,
    torchEnabled,
    torchSupported,
  }
}
