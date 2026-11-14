import { useRef } from 'react';

export default function Stadium({ compact = false }: { compact?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      className={`stadium-scene ${compact ? 'compact' : ''}`}
      ref={ref}
      aria-hidden="true"
      onPointerMove={(event) => {
        if (event.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches)
          return;
        const rect = event.currentTarget.getBoundingClientRect();
        ref.current?.style.setProperty(
          '--orbit',
          `${((event.clientX - rect.left) / rect.width - 0.5) * 12}deg`,
        );
      }}
      onPointerLeave={() => ref.current?.style.setProperty('--orbit', '0deg')}
    >
      <div className="stadium-aura" />
      <div className="stadium-orbit">
        <div className="stadium-model">
          <div className="stadium-plinth" />
          <div className="stadium-seats seats-back" />
          <div className="stadium-seats seats-front" />
          <div className="stadium-field">
            <div className="field-stripes" />
            <div className="infield-dirt">
              <div className="infield-grass" />
              <i className="base base-one" />
              <i className="base base-two" />
              <i className="base base-three" />
              <i className="base base-home" />
              <i className="pitcher-mound" />
            </div>
            <div className="foul-line line-left" />
            <div className="foul-line line-right" />
          </div>
          {[0, 1, 2, 3].map((n) => (
            <div key={n} className={`stadium-light light-${n}`}>
              <i />
              <span />
            </div>
          ))}
          <div className="stadium-scoreboard">
            <span>ROAD TO LEGEND</span>
            <b>YOUR TIME. YOUR GAME.</b>
            <em>9TH&nbsp; · &nbsp;2 OUT&nbsp; · &nbsp;3—2</em>
          </div>
        </div>
      </div>
      <div className="hero-baseball">
        <i />
        <i />
      </div>
      <span className="stadium-caption">
        <i /> THE LIGHTS ARE ON. IT’S YOUR TURN.
      </span>
    </div>
  );
}
