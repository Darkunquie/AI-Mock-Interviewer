# Interviewer avatar

The interview screen's left tile renders a real-time 3D avatar ("Aria") via
`components/interview/InterviewerAvatar3D.tsx`.

## The asset

| File | What it is |
|------|------------|
| `avatar.glb` | A Ready Player Me avatar. Its mouth is lip-synced to the TTS audio in-browser (wawa-lipsync → Oculus visemes), plus blinking + idle head-sway. |

**Requirement:** the GLB MUST be exported with **Oculus Visemes** morph targets
(`viseme_aa`, `viseme_PP`, `viseme_O`, …). Without them the mouth won't move.
ARKit-only avatars (jawOpen/mouthClose) will render but not lip-sync.

## Swapping the avatar (e.g. your own face / different person)

1. Go to https://readyplayer.me and create an avatar (or use the Studio).
2. Export / copy the avatar's `.glb` URL, then append the viseme morph targets:
   `https://models.readyplayer.me/<id>.glb?morphTargets=Oculus Visemes,ARKit&textureAtlas=1024`
3. Download that `.glb` and save it here as `avatar.glb` (overwrite).
4. Reload — the tile picks it up automatically. If the head framing is off,
   tweak the camera `position` / group `position` in `InterviewerAvatar3D.tsx`.

The voice is set separately in `app/api/tts/route.ts` (`DEFAULT_VOICE`) — keep it
matching the avatar's apparent gender.
