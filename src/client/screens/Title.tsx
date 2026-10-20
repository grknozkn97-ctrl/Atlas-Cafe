import { WorldMap } from '../ui/WorldMap';
import type { CountrySummary } from '../../shared/types';

export function Title({ world, onStart, demo, connected }: { world: CountrySummary[]; onStart: () => void; demo: boolean; connected: boolean }) {
  return (
    <div className="title-screen">
      <div className="title-map" aria-hidden>
        <WorldMap world={world} selected={null} onSelect={() => {}} zoom={false} />
      </div>
      <div className="title-card">
        <div className="title-kicker">Siyaset ve devlet yönetimi simülasyonu</div>
        <h1 className="title-logo">DEVLET</h1>
        <p className="title-lead">
          Bir lider yarat, gerçek bir ülkede partine yön ver, seçim kazan ve hükümeti kur. Enflasyondan bakan
          atamalarına kadar her karar halkın oyuna yansır.
        </p>
        <ol className="title-steps">
          <li><span>1</span>Liderini oluştur</li>
          <li><span>2</span>Ülkeni haritadan seç</li>
          <li><span>3</span>Partiye katıl ya da kendi partini kur</li>
          <li><span>4</span>Seçimi kazan, ülkeyi yönet</li>
        </ol>
        <button className="primary big" onClick={onStart} disabled={!connected}>
          {connected ? 'Yeni kariyere başla' : 'Sunucuya bağlanılıyor…'}
        </button>
        {demo && <p className="small muted">Tek oyunculu deneme sürümü: dünya senin tarayıcında işler ve kaydın burada saklanır.</p>}
      </div>
    </div>
  );
}
