// Serverless TTS proxy — keeps the ElevenLabs key private.
// If no key is configured, returns 204 and the client falls back to the device voice.
export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const key = process.env.ELEVENLABS_API_KEY;
  const voice = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // "Sarah" — warm, energetic
  if (!key) return new Response('', { status: 204 }); // no key yet -> client uses browser voice
  let text = '';
  try { ({ text } = await req.json()); } catch { return new Response('Bad request', { status: 400 }); }
  if (!text || text.length > 300) return new Response('Bad text', { status: 400 });
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: { stability: 0.4, similarity_boost: 0.75, style: 0.6, use_speaker_boost: true }
    })
  });
  if (!r.ok) return new Response('', { status: 204 }); // quota/err -> graceful fallback
  return new Response(r.body, { status: 200, headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=86400' } });
};
