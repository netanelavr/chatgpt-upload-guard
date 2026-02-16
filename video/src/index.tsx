import { Composition, registerRoot } from "remotion";
import { DemoVideo } from "./DemoVideo";

const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DemoVideo"
        component={DemoVideo}
        durationInFrames={300}
        fps={30}
        width={800}
        height={450}
      />
    </>
  );
};

registerRoot(RemotionRoot);
