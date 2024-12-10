import ResultView from "../components/Result/ResultView";
// import InitialView from "./InitialView";
import RetryView from "../components/Retry/RetryView";
import { ChangeEvent, useState } from "react";

import BannerPage from "../components/Banner/BannerPage";
import { useAlatContext } from "@/context/AlatContextProvider";
import ErrrComp from "@/components/Error/ErrComp";
import FaceLivenessDetectorComponent from "@/components/face/Face";

type LivenessOperationMode = "Passive" | "PassiveActive";
type LivenessDetectorState =
  | "Initial"
  | "LivenessDetector"
  | "Result"
  | "Retry"
  | "Error";
export default function FaceLiveness() {
  const { apiError } = useAlatContext();
  const [verifyImage, setVerifyImage] = useState<File | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [livenessOperationMode, setLivenessOperationMode] =
    useState<LivenessOperationMode>("PassiveActive");
  const [livenessDetectorState, setLivenessDetectorState] =
    useState<LivenessDetectorState>("Initial");
  const [isDetectLivenessWithVerify, setIsDetectLivenessWithVerify] =
    useState<Boolean>(false);
  const [livenessText, setLivenessText] = useState<string>("");
  const [livenessStatus, setLivenessStatus] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [matchConfidence, setMatchConfidence] = useState<number | null>(null);
  const [recognitionText, setRecognitionText] = useState<string>("Same Person");
  const [Nin, setNin] = useState<string>("");
  const [filePresent, setFilePresent] = useState<boolean>(false);
  const [NinErr, setNinErr] = useState<string>("");
  const [popup, setPopup] = useState(false);

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setVerifyImage(e.target.files[0]);
      setFilePresent(true);
    } else {
      setVerifyImage(undefined);
    }
  }

  function initFaceLivenessDetector(livenessOperation: LivenessOperationMode) {
    setLivenessOperationMode(livenessOperation);
    setLivenessDetectorState("LivenessDetector");
  }

  function continueFaceLivenessDetector() {
    // console.log("Retry button clicked!");
    setLivenessDetectorState("Initial");
    window.location.reload();
    setVerifyImage(undefined);
    // window.location.reload();
  }

  function displayResult() {
    setIsDetectLivenessWithVerify(isDetectLivenessWithVerify);
    setLivenessDetectorState("Result");
  }

  function fetchFailureCallback() {
    setLivenessDetectorState("Initial");
  }

  function returnHome() {
    setLivenessDetectorState("Initial");
    window.location.reload();
  }
  const handleRemoveImage = () => {
    setVerifyImage(undefined); // Clear the image
  };

  const handleClose  = (Event: MouseEvent) => {
    console.log(Event)
  }

  return (
    <>
      {/* {apiError !== "" && <ErrrComp />} */}
      {livenessDetectorState === "Initial" && (
        // <InitialView
        //   verifyImage={verifyImage}
        //   handleFile={handleFile}
        //   initFaceLivenessDetector={initFaceLivenessDetector}
        //   setNin= {setNin}
        //   Nin={Nin}
        //   setFilePresent={setFilePresent}
        //   handleRemoveImage={handleRemoveImage}

        // />
        <BannerPage
          initFaceLivenessDetector={initFaceLivenessDetector}
          setNin={setNin}
          Nin={Nin}
          handleFile={handleFile}
          verifyImage={verifyImage}
          handleRemoveImage={handleRemoveImage}
        />
      )}
      {livenessDetectorState === "LivenessDetector" && (
        <FaceLivenessDetectorComponent
          livenessOperationMode={livenessOperationMode}
          file={verifyImage}
          filePresent={filePresent}
          setFile={setVerifyImage}
          setIsDetectLivenessWithVerify={displayResult}
          fetchFailureCallback={fetchFailureCallback}
          returnHome={returnHome}
          setFilePresent={setFilePresent}
          setSessionId={setSessionId}
          // setLivenessIcon={setLivenessIcon}
          setLivenessStatus={setLivenessStatus}
          setLivenessText={setLivenessText}
          setMatchConfidence={setMatchConfidence}
          setNin={setNin}
          Nin={Nin}
          NinErr={NinErr}
          setNinErr={setNinErr}
          livenessText={livenessText}
          recognitionText={recognitionText}
          matchConfidence={matchConfidence}
          continueFunction={continueFaceLivenessDetector}
          isDetectLivenessWithVerify={isDetectLivenessWithVerify}
          sessionId={sessionId}
          livenessStatus={livenessStatus}
          verifyImage={verifyImage}
          // setRecognitionText={setRecognitionText}
        />
      )}
      {livenessDetectorState === "Result" && (
        <ResultView
          livenessText={livenessText}
          recognitionText={recognitionText}
          matchConfidence={matchConfidence}
          continueFunction={continueFaceLivenessDetector}
          isDetectLivenessWithVerify={isDetectLivenessWithVerify}
          // sessionId={sessionId}
          livenessStatus={livenessStatus}
          verifyImage={verifyImage}
          Nin={Nin}
        />
      )}

      {livenessDetectorState === "Retry" && (
        <RetryView
          errorMessage={errorMessage}
          continueFaceLivenessDetector={continueFaceLivenessDetector}
          returnHome={returnHome}
          NinErr={NinErr}
          
        />
      )}
    </>
  );
}
