import { useEffect, useRef, useState, useCallback } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import { useChatSocket, type CallType } from '../../hooks/useChatSocket';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

interface CallModalProps {
  callId: string;
  peerId: string;
  callType: CallType;
  isIncoming?: boolean;
  onClose: () => void;
}

export default function CallModal({
  callId,
  peerId,
  callType,
  isIncoming = false,
  onClose,
}: CallModalProps) {
  const [status, setStatus] = useState(isIncoming ? 'ringing' : 'calling');
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const { emit } = useChatSocket({
    onCallAccepted: async () => {
      setStatus('connected');
      await startMediaAndOffer();
    },
    onCallRejected: () => {
      setStatus('rejected');
      setTimeout(onClose, 1500);
    },
    onCallEnded: () => cleanup(),
    onCallOffer: async ({ sdp }) => {
      if (!pcRef.current) await setupPeerConnection(false);
      await pcRef.current!.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pcRef.current!.createAnswer();
      await pcRef.current!.setLocalDescription(answer);
      emit('call:answer', { callId, peerId, sdp: answer });
      setStatus('connected');
    },
    onCallAnswer: async ({ sdp }) => {
      await pcRef.current?.setRemoteDescription(new RTCSessionDescription(sdp));
      setStatus('connected');
    },
    onIceCandidate: async ({ candidate }) => {
      await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
    },
  });

  const setupPeerConnection = useCallback(
    async (isCaller: boolean) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          emit('call:ice-candidate', { callId, peerId, candidate: e.candidate });
        }
      };

      pc.ontrack = (e) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = e.streams[0];
        }
      };

      const constraints: MediaStreamConstraints =
        callType === 'video'
          ? { audio: true, video: true }
          : { audio: true, video: false };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      if (isCaller) {
        emit('call:initiate', { receiverId: peerId, callType, callId });
      }
    },
    [callId, peerId, callType, emit],
  );

  const startMediaAndOffer = async () => {
    if (!pcRef.current) await setupPeerConnection(true);
    const offer = await pcRef.current!.createOffer();
    await pcRef.current!.setLocalDescription(offer);
    emit('call:offer', { callId, peerId, sdp: offer });
  };

  const acceptCall = async () => {
    setStatus('connecting');
    emit('call:accept', { callId, callerId: peerId });
    await setupPeerConnection(false);
    await startMediaForCallee();
  };

  const startMediaForCallee = async () => {
    const constraints: MediaStreamConstraints =
      callType === 'video' ? { audio: true, video: true } : { audio: true, video: false };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    stream.getTracks().forEach((track) => pcRef.current?.addTrack(track, stream));
  };

  const rejectCall = () => {
    emit('call:reject', { callId, callerId: peerId });
    onClose();
  };

  const endCall = () => {
    emit('call:end', { callId, peerId });
    cleanup();
  };

  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    onClose();
  };

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = muted;
    });
    setMuted(!muted);
  };

  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = videoOff;
    });
    setVideoOff(!videoOff);
  };

  useEffect(() => {
    if (!isIncoming) {
      setupPeerConnection(true);
    }
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="relative w-full max-w-lg rounded-2xl bg-gray-900 p-6 text-white shadow-2xl">
        <p className="mb-4 text-center text-sm text-gray-300">
          {status === 'ringing' && 'Incoming call...'}
          {status === 'calling' && 'Calling...'}
          {status === 'connecting' && 'Connecting...'}
          {status === 'connected' && 'Connected'}
          {status === 'rejected' && 'Call declined'}
        </p>

        <div className="mb-6 flex justify-center gap-4">
          {callType === 'video' && (
            <>
              <video ref={localVideoRef} autoPlay muted playsInline className="h-32 w-24 rounded-lg bg-gray-800 object-cover" />
              <video ref={remoteVideoRef} autoPlay playsInline className="h-32 w-24 rounded-lg bg-gray-800 object-cover" />
            </>
          )}
        </div>

        <div className="flex items-center justify-center gap-4">
          {isIncoming && status === 'ringing' ? (
            <>
              <button type="button" onClick={acceptCall} className="rounded-full bg-green-600 p-4 hover:bg-green-700">
                {callType === 'video' ? <Video size={24} /> : <Phone size={24} />}
              </button>
              <button type="button" onClick={rejectCall} className="rounded-full bg-red-600 p-4 hover:bg-red-700">
                <PhoneOff size={24} />
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={toggleMute} className="rounded-full bg-gray-700 p-3 hover:bg-gray-600">
                {muted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              {callType === 'video' && (
                <button type="button" onClick={toggleVideo} className="rounded-full bg-gray-700 p-3 hover:bg-gray-600">
                  {videoOff ? <VideoOff size={20} /> : <Video size={20} />}
                </button>
              )}
              <button type="button" onClick={endCall} className="rounded-full bg-red-600 p-4 hover:bg-red-700">
                <PhoneOff size={24} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
