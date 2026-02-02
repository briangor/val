import { useEffect, useRef, useState, useCallback } from "react";
import confetti from "canvas-confetti";
import emailjs from "@emailjs/browser";
import "./App.css";

export default function App() {
  const myValentine = import.meta.env.VITE_MY_VAL?.trim();

  const STORAGE_ACCEPTED_KEY = "val_accepted_v1";
  const STORAGE_NOCOUNT_KEY = "val_noCount_v1";

  const readBool = (key, fallback = false) => {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return v === "true";
  };

  const readInt = (key, fallback = 0) => {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    const n = Number.parseInt(v, 10);
    return Number.isNaN(n) ? fallback : n;
  };

  const canvasRef = useRef(null);
  const zoneRef = useRef(null);
  const yesBtnRef = useRef(null);
  const noBtnRef = useRef(null);

  const yesScaleRef = useRef(1);
  const noScaleRef = useRef(1);
  const confettiInstanceRef = useRef(null);

  // const [accepted, setAccepted] = useState(false);
  const [accepted, setAccepted] = useState(() => readBool(STORAGE_ACCEPTED_KEY, false));
  const [noCount, setNoCount] = useState(() => readInt(STORAGE_NOCOUNT_KEY, 0));

  const clamp = useCallback((n, min, max) => Math.max(min, Math.min(max, n)), []);

  const resizeConfettiCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
  }, []);

  const fullScreenConfetti = useCallback(() => {
    const instance = confettiInstanceRef.current;
    if (!instance) return;

    const end = Date.now() + 1600;

    (function frame() {
      instance({
        particleCount: 12,
        spread: 90,
        startVelocity: 45,
        ticks: 180,
        origin: { x: Math.random(), y: Math.random() * 0.3 },
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();

    setTimeout(() => {
      instance({
        particleCount: 300,
        spread: 140,
        startVelocity: 60,
        ticks: 220,
        origin: { x: 0.5, y: 0.55 },
      });
    }, 300);
  }, []);

  const growYes = useCallback(() => {
    const yesBtn = yesBtnRef.current;
    if (!yesBtn) return;

    yesScaleRef.current = Math.min(2.2, yesScaleRef.current + 0.1);
    yesBtn.style.transform = `translateY(-50%) scale(${yesScaleRef.current})`;
  }, []);

  const shrinkNo = useCallback(() => {
    const noBtn = noBtnRef.current;
    if (!noBtn) return;

    noScaleRef.current = Math.max(0.55, noScaleRef.current - 0.06);

    noBtn.style.transform = `translateY(-50%) scale(${noScaleRef.current})`;
  }, []);

  const moveNo = useCallback(
    (px, py) => {
      const zone = zoneRef.current;
      const noBtn = noBtnRef.current;
      if (!zone || !noBtn) return;

      const z = zone.getBoundingClientRect();
      const b = noBtn.getBoundingClientRect();

      let dx = b.left + b.width / 2 - px;
      let dy = b.top + b.height / 2 - py;

      const mag = Math.hypot(dx, dy) || 1;
      dx /= mag;
      dy /= mag;

      let newLeft = b.left - z.left + dx * 150;
      let newTop = b.top - z.top + dy * 150;

      newLeft = clamp(newLeft, 0, z.width - b.width);
      newTop = clamp(newTop, 0, z.height - b.height);

      noBtn.style.left = `${newLeft}px`;
      noBtn.style.top = `${newTop}px`;

      noBtn.style.transform = `translateY(-50%) scale(${noScaleRef.current})`;

      growYes();
      shrinkNo();
    },
    [clamp, growYes, shrinkNo]
  );

  const teleportNoRandom = useCallback(() => {
    const zone = zoneRef.current;
    const noBtn = noBtnRef.current;
    if (!zone || !noBtn) return;

    const z = zone.getBoundingClientRect();

    const maxLeft = Math.max(0, z.width - noBtn.offsetWidth);
    const maxTop = Math.max(0, z.height - noBtn.offsetHeight);

    const newLeft = Math.random() * maxLeft;
    const newTop = Math.random() * maxTop;

    noBtn.style.left = `${newLeft}px`;
    noBtn.style.top = `${newTop}px`;

    // keep translateY(-50%) and also apply any shrinking
    noBtn.style.transform = `translateY(-50%) scale(${noScaleRef.current})`;

    growYes();
    shrinkNo();
  }, [growYes, shrinkNo]);


  const onZonePointerMove = useCallback(
    (e) => {
      const noBtn = noBtnRef.current;
      if (!noBtn) return;

      const b = noBtn.getBoundingClientRect();
      const d = Math.hypot(
        b.left + b.width / 2 - e.clientX,
        b.top + b.height / 2 - e.clientY
      );

      if (d < 140) moveNo(e.clientX, e.clientY);
    },
    [moveNo]
  );

  const onYesClick = useCallback(async () => {
    setAccepted(true);
    resizeConfettiCanvas();
    fullScreenConfetti();

    const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    const notifyTo = import.meta.env.VITE_NOTIFY_EMAIL;

    if (SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY && notifyTo) {
      try {
        await emailjs.send(
          SERVICE_ID,
          TEMPLATE_ID,
          {
            to_email: notifyTo,
            person_name: myValentine || "Unknown",
            no_count: String(noCount),
            timestamp: new Date().toISOString(),
          },
          { publicKey: PUBLIC_KEY }
        );
      } catch (err) {
        console.error("Email notification failed:", err);
      }
    }
  }, [resizeConfettiCanvas, fullScreenConfetti, myValentine, noCount]);

  useEffect(() => {
    // setup canvas + confetti instance
    resizeConfettiCanvas();

    const canvas = canvasRef.current;
    if (canvas && !confettiInstanceRef.current) {
      confettiInstanceRef.current = confetti.create(canvas, {
        resize: false,
        useWorker: true,
      });
    }

    const onResize = () => resizeConfettiCanvas();
    const onOrientation = () => setTimeout(resizeConfettiCanvas, 150);

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onOrientation);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onOrientation);
    };
  }, [resizeConfettiCanvas]);

  useEffect(() => {
    if (!accepted) {
      yesScaleRef.current = 1;
      noScaleRef.current = 1;

      const yesBtn = yesBtnRef.current;
      const noBtn = noBtnRef.current;

      if (yesBtn) yesBtn.style.transform = "translateY(-50%) scale(1)";
      if (noBtn) noBtn.style.transform = "translateY(-50%) scale(1)";
    }
  }, [accepted]);

  useEffect(() => {
    localStorage.setItem(STORAGE_ACCEPTED_KEY, String(accepted));
  }, [accepted]);

  useEffect(() => {
    localStorage.setItem(STORAGE_NOCOUNT_KEY, String(noCount));
  }, [noCount]);


  return (
    <>
      <canvas id="confettiCanvas" ref={canvasRef} />

      <main className="card">
        <svg className="art" viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="fur" x1="0" x2="1">
              <stop offset="0" stopColor="#f7c7a1" />
              <stop offset="1" stopColor="#f2a97b" />
            </linearGradient>
            <linearGradient id="heart" x1="0" x2="1">
              <stop offset="0" stopColor="#ff4d7d" />
              <stop offset="1" stopColor="#ff1f68" />
            </linearGradient>
          </defs>

          <path
            d="M250 50 C250 33 270 25 282 38
               C294 25 314 33 314 50
               C314 78 282 92 282 106
               C282 92 250 78 250 50Z"
            fill="url(#heart)"
          />

          <path
            d="M90 120 C90 70 140 40 190 60
               C240 40 290 70 290 120
               C290 180 240 210 190 210
               C140 210 90 180 90 120Z"
            fill="url(#fur)"
          />

          <path d="M110 92 L95 55 L140 78 Z" fill="#f2a97b" />
          <path d="M270 92 L285 55 L240 78 Z" fill="#f2a97b" />

          <circle cx="160" cy="130" r="8" />
          <circle cx="220" cy="130" r="8" />

          <path
            d="M190 144 C186 144 182 148 182 152
               C182 160 190 164 190 170
               C190 164 198 160 198 152
               C198 148 194 144 190 144Z"
            fill="#ff7aa2"
          />
        </svg>

        {/* <h1>{myValentine ? `${myValentine}, will you be my valentine?` : "Will you be my valentine?"}</h1> */}
        <h1>
          {accepted
            ? myValentine
              ? `Hey there, ${myValentine}🦋💖, my valentine!🌹`
              : "Hey there, my valentine!"
            : myValentine
              ? `${myValentine}, will you be my valentine?`
              : "Will you be my valentine?"
          }
        </h1>

        {!accepted ? (
          <>
            <section
              className="button-zone"
              id="zone"
              ref={zoneRef}
              onPointerMove={onZonePointerMove}
              onPointerDownCapture={(e) => {
                if (e.pointerType === "touch" || e.pointerType === "pen") {
                  // moveNo(e.clientX, e.clientY);
                  teleportNoRandom();
                }
              }}
            >
              <button id="yesBtn" ref={yesBtnRef} onClick={onYesClick} type="button">
                Yes
              </button>

              <button
                id="noBtn"
                ref={noBtnRef}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // moveNo(e.clientX, e.clientY);
                  setNoCount((c) => c + 1);
                  teleportNoRandom();
                }}
                onClick={(e) => { e.preventDefault(); console.log(noCount) }}
                type="button"
              >
                No
              </button>
            </section>

            <div className="hint" id="hint">
              “No” seems a bit harsh, no? 😈
            </div>
          </>
        ) : (
          <section className="result" id="result" style={{ display: "block" }}>
            <img
              className="fireworks"
              src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExOGJ1ZDJxbHpkOGRzanhleWtkMWt2ejd2c3o1MWNzMng4bnlrY21nNCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/enrq327a3sMIJAS5jA/giphy.gif"
              alt="Fireworks"
            />
          </section>
        )}
      </main>
    </>
  );
}
