import { ArrowRight, Cloud, Fingerprint, Layers3, ShieldCheck, Trophy } from 'lucide-react';
import Stadium from './Stadium';
import { hostedService, SERVICE_URL } from './cloudSave';

export default function ServiceLanding({
  onStart,
  name,
  onAccount,
}: {
  onStart: () => void;
  name?: string;
  onAccount?: () => void;
}) {
  const login = hostedService() ? '/signin-with-chatgpt?return_to=%2F' : SERVICE_URL;
  return (
    <div className="service-landing">
      <a className="skip-link" href="#start-career">
        본문으로 이동
      </a>
      <header className="landing-nav">
        <a className="service-brand" href="#">
          <span>
            R<span className="brand-slash">/</span>L
          </span>
          <b>
            ROAD TO LEGEND<small>BASEBALL CAREER SIMULATOR</small>
          </b>
        </a>
        <div>
          {name ? (
            <button className="landing-account" onClick={onAccount}>
              <Fingerprint size={17} />
              {name}
            </button>
          ) : (
            <a className="landing-account" href={login} target="_top">
              <Fingerprint size={17} />
              로그인
              <ArrowRight size={15} />
            </a>
          )}
        </div>
      </header>
      <main id="start-career">
        <section className="landing-hero">
          <div className="hero-copy">
            <span className="service-kicker">
              <i /> THE NEXT LEGEND IS YOU
            </span>
            <h1>
              당신의 야구가
              <br />
              <em>전설이 되는 곳.</em>
            </h1>
            <p>
              고교 첫 타석부터 프로의 마지막 이닝까지.
              <br />
              훈련하고, 선택하고, 당신만의 커리어를 완성하세요.
            </p>
            <div className="landing-actions">
              <button className="service-primary" onClick={onStart}>
                나의 커리어 시작
                <ArrowRight size={20} />
              </button>
              {!name && (
                <a href={login} target="_top" className="service-secondary">
                  <Cloud size={18} />
                  로그인하고 이어하기
                </a>
              )}
            </div>
            <div className="landing-assurance">
              <ShieldCheck size={14} />
              {name
                ? '계정에 안전하게 저장되는 나의 커리어'
                : '게스트로 바로 시작 · 설치 없이 플레이'}
            </div>
            <div className="hero-numbers">
              <div>
                <b>14</b>
                <span>투수 · 야수 포지션</span>
              </div>
              <div>
                <b>3</b>
                <span>독립된 커리어 슬롯</span>
              </div>
              <div>
                <b>∞</b>
                <span>당신의 선택과 가능성</span>
              </div>
            </div>
          </div>
          <Stadium />
        </section>
        <section className="landing-features" aria-label="커리어 플레이 안내">
          <article>
            <span>01 / YOUR ORIGIN</span>
            <Layers3 />
            <h2>출발은 당신답게</h2>
            <p>
              포지션과 출신 고등학교를 정하고,
              <br />세 장의 재능 카드에서 시작을 고르세요.
            </p>
          </article>
          <article>
            <span>02 / YOUR JOURNEY</span>
            <Trophy />
            <h2>기록 이상의 야구</h2>
            <p>
              훈련, 시즌의 갈림길, 계약과 대표팀.
              <br />한 시즌의 선택이 다음 시즌을 바꿉니다.
            </p>
          </article>
          <article>
            <span>03 / YOUR CLUBHOUSE</span>
            <Cloud />
            <h2>어디서든 이어지는 커리어</h2>
            <p>
              ChatGPT 로그인으로 계정에 저장하고,
              <br />
              다른 기기에서도 같은 선수를 만나세요.
            </p>
          </article>
        </section>
        <section className="landing-invitation">
          <span>ONE PLAYER. A THOUSAND POSSIBILITIES.</span>
          <h2>이제, 당신이 타석에 설 시간.</h2>
          <button onClick={onStart}>
            플레이 시작
            <ArrowRight size={18} />
          </button>
        </section>
      </main>
      <footer className="landing-footer">
        <b>ROAD TO LEGEND</b>
        <span>당신의 선택이 커리어가 됩니다.</span>
        <small>© {new Date().getFullYear()} Road to Legend</small>
      </footer>
    </div>
  );
}
