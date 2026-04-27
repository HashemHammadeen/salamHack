type PluginEnableSwitchProps = {
  pluginId: string;
  name: string;
  enabled: boolean;
  onChange: (next: boolean) => void;
  /** When true, the control is visible but not interactive (e.g. not yet installed). */
  locked?: boolean;
  /** Extra screen-reader / label text, e.g. "when installed" */
  hint?: string;
};

export function PluginEnableSwitch({
  pluginId,
  name,
  enabled,
  onChange,
  locked,
  hint,
}: PluginEnableSwitchProps) {
  const label = hint ? `Enable ${name} ${hint}` : `Enable ${name}`;

  return (
    <div className="flex items-center justify-between gap-3">
      <span id={`${pluginId}-label`} className="text-sm font-medium text-ink-black/80">
        {label}
        {locked && (
          <span className="block text-xs font-normal text-ink-black/50 mt-0.5">
            Install the plugin on the server to use this
          </span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        id={`${pluginId}-switch`}
        aria-checked={enabled}
        aria-labelledby={`${pluginId}-label`}
        disabled={!!locked}
        onClick={() => onChange(!enabled)}
        className={[
          'relative h-7 w-12 shrink-0 rounded-full border-2 transition-colors',
          locked ? 'border-ink-black/10 bg-ink-black/5 cursor-not-allowed opacity-60' : 'border-ink-black/20',
          enabled && !locked ? 'bg-signal-orange border-signal-orange' : !locked && 'bg-white',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 h-5 w-5 rounded-full bg-canvas-cream border border-ink-black/20 shadow-sm transition-transform',
            enabled ? 'left-[calc(100%-1.4rem)]' : 'left-0.5',
          ].join(' ')}
        />
        <span className="sr-only">
          {enabled ? 'On' : 'Off'}
        </span>
      </button>
    </div>
  );
}
