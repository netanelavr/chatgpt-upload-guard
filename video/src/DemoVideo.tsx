import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from "remotion";

// Shield icon component
const ShieldIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 120,
  color = "#10B981",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" stroke={color} />
  </svg>
);

// Document icon
const DocumentIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 60,
  color = "#6B7280",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

// Warning icon
const WarningIcon: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="#EF4444"
    strokeWidth="2"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// Intro scene
const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const subtitleOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const shieldScale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 10, stiffness: 80 },
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div style={{ transform: `scale(${Math.max(0, shieldScale)})` }}>
          <ShieldIcon size={100} />
        </div>
        <h1
          style={{
            color: "#fff",
            fontSize: 48,
            fontFamily: "system-ui, sans-serif",
            fontWeight: 700,
            margin: 0,
            transform: `scale(${titleScale})`,
            textAlign: "center",
          }}
        >
          ChatGPT Upload Guard
        </h1>
        <p
          style={{
            color: "#9CA3AF",
            fontSize: 24,
            fontFamily: "system-ui, sans-serif",
            margin: 0,
            opacity: subtitleOpacity,
          }}
        >
          Protect your AI conversations
        </p>
      </div>
    </AbsoluteFill>
  );
};

// Threat detection scene
const ThreatScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const docSlide = spring({
    frame,
    fps,
    config: { damping: 15 },
  });

  const scanProgress = interpolate(frame, [30, 60], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const warningPop = spring({
    frame: frame - 65,
    fps,
    config: { damping: 8, stiffness: 200 },
  });

  const pulseOpacity = interpolate(
    Math.sin(frame * 0.3),
    [-1, 1],
    [0.5, 1]
  );

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 60,
        }}
      >
        {/* Document */}
        <div
          style={{
            transform: `translateX(${interpolate(docSlide, [0, 1], [-200, 0])}px)`,
            opacity: docSlide,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 30,
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            }}
          >
            <DocumentIcon size={80} />
            <p
              style={{
                color: "#374151",
                fontSize: 14,
                fontFamily: "monospace",
                margin: "15px 0 0 0",
              }}
            >
              document.pdf
            </p>
          </div>
        </div>

        {/* Scanning indicator */}
        <div style={{ flex: 1, maxWidth: 300 }}>
          <p
            style={{
              color: "#10B981",
              fontSize: 18,
              fontFamily: "system-ui, sans-serif",
              marginBottom: 10,
            }}
          >
            Scanning for threats...
          </p>
          <div
            style={{
              background: "#374151",
              borderRadius: 10,
              height: 8,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background: "linear-gradient(90deg, #10B981, #34D399)",
                height: "100%",
                width: `${scanProgress}%`,
                transition: "width 0.1s",
              }}
            />
          </div>
        </div>

        {/* Warning */}
        {frame > 65 && (
          <div
            style={{
              transform: `scale(${Math.max(0, warningPop)})`,
              background: "rgba(239, 68, 68, 0.1)",
              border: "2px solid #EF4444",
              borderRadius: 12,
              padding: 20,
              opacity: pulseOpacity,
            }}
          >
            <WarningIcon size={50} />
            <p
              style={{
                color: "#EF4444",
                fontSize: 14,
                fontFamily: "system-ui, sans-serif",
                fontWeight: 600,
                margin: "10px 0 0 0",
              }}
            >
              Threat Detected!
            </p>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// Features scene
const FeaturesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const features = [
    { icon: "🔒", text: "100% Local Processing" },
    { icon: "🤖", text: "AI-Powered Detection" },
    { icon: "⚡", text: "Real-time Scanning" },
    { icon: "🛡️", text: "Privacy First" },
  ];

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h2
          style={{
            color: "#fff",
            fontSize: 36,
            fontFamily: "system-ui, sans-serif",
            marginBottom: 40,
          }}
        >
          Key Features
        </h2>
        <div
          style={{
            display: "flex",
            gap: 30,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {features.map((feature, i) => {
            const delay = i * 10;
            const scale = spring({
              frame: frame - delay,
              fps,
              config: { damping: 12 },
            });

            return (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 16,
                  padding: "25px 35px",
                  transform: `scale(${Math.max(0, scale)})`,
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <span style={{ fontSize: 40 }}>{feature.icon}</span>
                <p
                  style={{
                    color: "#E5E7EB",
                    fontSize: 16,
                    fontFamily: "system-ui, sans-serif",
                    margin: "10px 0 0 0",
                  }}
                >
                  {feature.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// CTA scene
const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 10 },
  });

  const buttonPulse = interpolate(
    Math.sin(frame * 0.15),
    [-1, 1],
    [1, 1.05]
  );

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          textAlign: "center",
          transform: `scale(${scale})`,
        }}
      >
        <ShieldIcon size={80} color="#10B981" />
        <h2
          style={{
            color: "#fff",
            fontSize: 42,
            fontFamily: "system-ui, sans-serif",
            margin: "20px 0",
          }}
        >
          Stay Protected
        </h2>
        <div
          style={{
            background: "linear-gradient(90deg, #10B981, #059669)",
            borderRadius: 30,
            padding: "15px 40px",
            transform: `scale(${buttonPulse})`,
            cursor: "pointer",
          }}
        >
          <span
            style={{
              color: "#fff",
              fontSize: 20,
              fontFamily: "system-ui, sans-serif",
              fontWeight: 600,
            }}
          >
            Install Free on Chrome
          </span>
        </div>
        <p
          style={{
            color: "#6B7280",
            fontSize: 14,
            fontFamily: "system-ui, sans-serif",
            marginTop: 20,
          }}
        >
          github.com/netanelavr/chatgpt-upload-guard
        </p>
      </div>
    </AbsoluteFill>
  );
};

// Main composition
export const DemoVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Voiceover audio - remove or comment out if file doesn't exist yet */}
      <Audio src={staticFile("voiceover.mp3")} volume={1} />

      <Sequence from={0} durationInFrames={90}>
        <IntroScene />
      </Sequence>
      <Sequence from={90} durationInFrames={90}>
        <ThreatScene />
      </Sequence>
      <Sequence from={180} durationInFrames={60}>
        <FeaturesScene />
      </Sequence>
      <Sequence from={240} durationInFrames={60}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};
