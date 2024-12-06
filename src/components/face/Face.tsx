
import RetryView from "@/components/Retry/RetryView";
import "azure-ai-vision-face-ui";
import { FaceLivenessDetector } from "azure-ai-vision-face-ui";
import  { useEffect, useRef, useState } from "react";
import { fetchTokenFromAPI, fetchTokenfromApiWithNumber } from "./utils";
import { FaceLivenessDetectorProps } from "@/Types";
import ResultView from "@/components/Result/ResultView";
import { useAlatContext } from "@/context/AlatContextProvider";
export const FaceLivenessDetectorComponent = ({
  file,
  fetchFailureCallback,
  setLivenessText,
  returnHome,
  setLivenessStatus,
  setMatchConfidence,
  Nin,
  NinErr,
  livenessText,
  recognitionText,
  matchConfidence,
  continueFunction,
  isDetectLivenessWithVerify,
  livenessStatus,
  verifyImage,
}: FaceLivenessDetectorProps) => {
  // React Hooks
  const {setApiError} = useAlatContext()
  const [token, setToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorOption, setErrorOption] = useState<boolean>(false)
  const containerRef = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState("");

  useEffect(() => {
    if (file || (Nin && Nin !== undefined)) {
      fetchTokenfromApiWithNumber(
        setToken,
        setSessionId,
        Nin as string,
        file,
        setErrors,
        errors,
        setErrorOption,
        setApiError
      );
    } else {
      fetchTokenFromAPI(setToken, setSessionId, setErrors, errors, setErrorOption);
    }
  }, [file, Nin]);

  // console.log("the error is:", errors);
  // Handle token fetch errors
 
  

  useEffect(() => {
    if (!token && !loadingToken && fetchFailureCallback) {
      fetchFailureCallback(errorMessage);
    }
  }, [token, loadingToken, errorMessage, fetchFailureCallback]);

  useEffect(() => {
    const customLanguage = {
      "None": "Stay still.",
      "LookAtCamera": "Look straight at camera.",
      "FaceNotCentered": "Kindly Center your face in the preview circle.",
      "MoveCloser": "Move in closer.",
      "ContinueToMoveCloser": "Move more closer.",
      "MoveBack": "Move farther away.",
      "TooMuchMovement": "Reduce movement.",
      "AttentionNotNeeded": "",
      "Smile": "Smile please!",
      "LookInFront": "Look straight.",
      "LookUp": "Look up.",
      "LookUpRight": "Look up-right.",
      "LookUpLeft": "Look up-left.",
      "LookRight": "Look right.",
      "LookLeft": "Look left.",
      "LookDown": "Look down.",
      "LookDownRight": "Look down-right.",
      "LookDownLeft": "Look down-left.",
      "TimedOut": "Timed out.",
      "IncreaseBrightnessToMax": " your screen brightness to maximum.",
      "Tip1Title": "Tip 1:",
      "Tip2Title": "Tip 2:",
      "Tip3Title": "Tip 3:",
      "Tip1": "Center your face in the preview. Make sure your eyes and mouth are visible, remove any obstructions like headphones.",
      "Tip2": "You may be asked to smile.",
      "Tip3": "You may be asked to move your nose towards the green color.",
      "Continue": "Continue"
  };
    const fetchData = async () => {
      var faceLivenessDetector = document.querySelector(
        "azure-ai-vision-face-ui"
      ) as FaceLivenessDetector;
      // Step 4: Create the FaceLivenessDetector element and attach it to DOM.
      // faceLivenessDetector.languageDictionary = customLanguage
      if (faceLivenessDetector == null) {
        faceLivenessDetector = document.createElement(
          "azure-ai-vision-face-ui"
        ) as FaceLivenessDetector;
        if (containerRef.current) {
          containerRef.current.appendChild(faceLivenessDetector);
        }
      }
      
      // Step 5: Start the FaceLivenessDetector session.
      faceLivenessDetector
        .start(token as string)
        .then((resultData: any) => {
          setLivenessStatus?.(resultData.recognitionResult.status);
          setLivenessText?.(resultData.livenessStatus);
          setMatchConfidence?.(resultData.recognitionResult.matchConfidence);
        })
        .catch((error: any) => {
          setErrors(error.livenessError);
          console.log('the sdk start', error)
          
          // console.log('this error is from the start of sdk', error)
        });
    };

    fetchData();
  }, [token]);
// console.log('the error is not from sdk', errors)
// console.log('errorOption is', errorOption)
  return (
    <div className="justify-center  flex-col h-screen flex items-center">
      {/* Container in which the FaceLivenessDetector will be injected */}
      <div id="container" ref={containerRef}>
        {errors !== "" ? (
          <RetryView
            errorMessage={errors}
            returnHome={returnHome}
            NinErr={NinErr || ""}
          />
        ) :
            livenessText  && (
              <ResultView
                // sessionId={sessionId}
                livenessText={livenessText}
                recognitionText={recognitionText || ""}
                matchConfidence={matchConfidence}
                continueFunction={continueFunction}
                isDetectLivenessWithVerify={!!isDetectLivenessWithVerify}
                livenessStatus={livenessStatus || ""}
                verifyImage={verifyImage}
                Nin={Nin || ""}
              />
            ) 
          }
      </div>
    </div>
  );
};

export default FaceLivenessDetectorComponent;
