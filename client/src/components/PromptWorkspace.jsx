import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { useAppData } from '../state/AppData.jsx';
import { useToast } from './Toast.jsx';
import { SparkIcon, DiceIcon, CoinIcon, ChevronIcon } from './Icons.jsx';

const IDEAS = [
  'A lighthouse on a cliff during a thunderstorm, waves crashing, slow push-in',
  'Tiny robot watering a bonsai tree on a windowsill, soft morning light',
  'Street dancer spinning in a puddle under neon signs, reflections everywhere',
  'Whales swimming through clouds above a quiet mountain village at sunset',
  'Macro shot of coffee being poured, swirling cream forming a galaxy',
  'Vintage convertible driving along a coastal road, golden hour, aerial tracking shot'
];

const MAX_PROMPT = 1500;

function AspectShape({ ratio }) {
  const [w, h] = ratio.split(':').map(Number);
  const scale = 16 / Math.max(w, h);
  return <span className="ratio-shape" style={{ width: w * scale, height: h * scale }} aria-hidden="true" />;
}

export default function PromptWorkspace({ preset, onJobCreated, compact = false }) {
  const { config, me, setMe } = useAppData();
  const toast = useToast();
  const textRef = useRef(null);

  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [model, setModel] = useState('lamba-motion-2');
  const [style, setStyle] = useState('cinematic');
  const [camera, setCamera] = useState('auto');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [duration, setDuration] = useState(5);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Apply a preset (from "Remix" or the Home prompt bar).
  useEffect(() => {
    if (!preset) return;
    if (preset.prompt) setPrompt(preset.prompt);
    if (preset.model) setModel(preset.model);
    if (preset.style) setStyle(preset.style);
    if (preset.camera) setCamera(preset.camera);
    if (preset.aspectRatio) setAspectRatio(preset.aspectRatio);
    if (preset.duration) setDuration(preset.duration);
    textRef.current?.focus();
  }, [preset]);

  const modelInfo = useMemo(() => config?.models.find((m) => m.id === model), [config, model]);

  // Keep duration valid when switching to a model with a shorter limit.
  useEffect(() => {
    if (modelInfo && duration > modelInfo.maxDuration) setDuration(5);
  }, [modelInfo, duration]);

  const cost = modelInfo ? modelInfo.credits * (duration / 5) : 0;
  const tooShort = prompt.trim().length < 3;
  const notEnough = me && me.credits < cost;

  async function submit(e) {
    e?.preventDefault();
    if (tooShort || submitting) return;
    setSubmitting(true);
    try {
      const { job, credits } = await api.generate({ prompt: prompt.trim(), negativePrompt, model, style, camera, aspectRatio, duration });
      setMe((m) => (m ? { ...m, credits } : m));
      toast('Generation started');
      onJobCreated?.(job);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (!config) return <div className="workspace workspace--loading" aria-busy="true" />;

  return (
    <form className={`workspace${compact ? ' workspace--compact' : ''}`} onSubmit={submit}>
      <div className="workspace__head">
        <h2>Create a video</h2>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => setPrompt(IDEAS[Math.floor(Math.random() * IDEAS.length)])}
        >
          <DiceIcon width={16} height={16} /> Surprise me
        </button>
      </div>

      <label className="field">
        <span className="field__label">Prompt</span>
        <div className="prompt-box">
          <textarea
            ref={textRef}
            value={prompt}
            maxLength={MAX_PROMPT}
            rows={compact ? 3 : 5}
            placeholder="Describe the scene, subject, motion and mood…"
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(e);
            }}
          />
          <span className="prompt-box__count">{prompt.length}/{MAX_PROMPT}</span>
        </div>
      </label>

      <div className="field-grid">
        <label className="field">
          <span className="field__label">Model</span>
          <div className="select">
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              {config.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.tagline}
                </option>
              ))}
            </select>
            <ChevronIcon width={16} height={16} />
          </div>
        </label>

        <label className="field">
          <span className="field__label">Style</span>
          <div className="select">
            <select value={style} onChange={(e) => setStyle(e.target.value)}>
              {config.styles.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <ChevronIcon width={16} height={16} />
          </div>
        </label>

        <label className="field">
          <span className="field__label">Camera</span>
          <div className="select">
            <select value={camera} onChange={(e) => setCamera(e.target.value)}>
              {config.cameraMoves.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronIcon width={16} height={16} />
          </div>
        </label>
      </div>

      <div className="field-row">
        <fieldset className="field">
          <legend className="field__label">Aspect ratio</legend>
          <div className="segmented">
            {config.aspectRatios.map((r) => (
              <button
                type="button"
                key={r}
                className={`segmented__opt${aspectRatio === r ? ' is-on' : ''}`}
                aria-pressed={aspectRatio === r}
                onClick={() => setAspectRatio(r)}
              >
                <AspectShape ratio={r} /> {r}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="field">
          <legend className="field__label">Duration</legend>
          <div className="segmented">
            {config.durations.map((d) => {
              const disabled = modelInfo && d > modelInfo.maxDuration;
              return (
                <button
                  type="button"
                  key={d}
                  disabled={disabled}
                  title={disabled ? `${modelInfo.name} supports up to ${modelInfo.maxDuration}s` : undefined}
                  className={`segmented__opt${duration === d ? ' is-on' : ''}`}
                  aria-pressed={duration === d}
                  onClick={() => setDuration(d)}
                >
                  {d}s
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      <button type="button" className="advanced-toggle" onClick={() => setShowAdvanced((s) => !s)} aria-expanded={showAdvanced}>
        <ChevronIcon width={16} height={16} className={showAdvanced ? 'rot-180' : ''} /> Advanced
      </button>
      {showAdvanced && (
        <label className="field">
          <span className="field__label">Negative prompt</span>
          <input
            className="input"
            value={negativePrompt}
            maxLength={300}
            placeholder="Things to avoid, e.g. blurry, text, watermark"
            onChange={(e) => setNegativePrompt(e.target.value)}
          />
        </label>
      )}

      <div className="workspace__submit">
        <span className="cost">
          <CoinIcon width={16} height={16} /> {cost} credits
          {notEnough && <em> · not enough credits</em>}
        </span>
        <button type="submit" className="btn btn--primary btn--lg" disabled={tooShort || submitting || notEnough}>
          <SparkIcon width={18} height={18} />
          {submitting ? 'Starting…' : 'Generate'}
        </button>
      </div>
      <p className="hint">Tip: press Ctrl/⌘ + Enter to generate.</p>
    </form>
  );
}
