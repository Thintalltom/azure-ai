
import { FaCheck } from "react-icons/fa";
import { FaHeart } from "react-icons/fa";
import { IoPersonSharp } from "react-icons/io5";
import {ResultViewProps} from '@/Types';

const buttonStyle =
  "relative text-white bg-[#036ac4] hover:bg-[#0473ce] flex grow-1 px-2.5 py-1.5 rounded-md text-sm md:text-[1.1rem]";
const ResultView = ({
  isDetectLivenessWithVerify,
  livenessText,
  recognitionText,
  continueFunction,
  // sessionId,
  matchConfidence,
  livenessStatus,
  verifyImage,
  Nin
}: ResultViewProps) => {
  return (
    <div className="flex flex-col h-screen justify-start items-center py-24 gap-y-24 text-xl md:text-3xl">
      <div className="flex flex-col justify-start items-center gap-y-4">
        <div className="flex flex-row items-center gap-x-2">
          <FaHeart />
          <span>Liveness</span>
        </div>
        <div className="flex flex-col items-center gap-x-2">
          
          <span className="flex flex-row "> <FaCheck />{livenessText}</span><br />
          <span>{livenessStatus}</span><br />
          <div>
          {Nin !== "" ? <p>match confidence:  {matchConfidence}</p> : ""}
          {verifyImage === undefined ? "" : <p>match confidence:  {matchConfidence}</p>}
          </div>
         
          
        </div>

        {isDetectLivenessWithVerify && (
          <>
            <div className="w-40 h-0 border border-transparent border-t-gray-500" />
            <div className="flex flex-row items-center gap-x-2">
              <IoPersonSharp />
              <span>Verification</span>
            </div>
            <div className="flex flex-row items-center gap-x-2">
              <span>{recognitionText}</span>
            </div>
          </>
        )}
      </div>
      {continueFunction !== undefined && (
        <div>
          <button onClick={continueFunction} className={buttonStyle}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
};

export default ResultView;
