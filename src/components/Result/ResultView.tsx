
import { FaCheck } from "react-icons/fa";
import { FaHeart } from "react-icons/fa";
import { IoPersonSharp } from "react-icons/io5";
import {ResultViewProps} from '@/Types';
import close from "@/assets/svg/close.svg";
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
  
  const returnHome  = () => {
    continueFunction
  }
  return (
    <div className="fixed inset-0 bg-opacity-[50%] bg-black backdrop-blur-[2px] max-h-[100vh] flex gap-[35px] justify-center items-end md:items-center"> 
    <div className="flex flex-col  justify-start items-center relative bg-white rounded-[20px]   h-auto p-[20px]   w-full md:w-[40%] ">
      <div className="mt-10 flex flex-col justify-start  items-center gap-y-4">
      <img
            src={close}
            alt="close"
            className="cursor-pointer absolute top-5 right-5 "
            onClick={continueFunction}
          />
        <div className="flex flex-row items-center gap-2">
          <FaHeart />
          <span>Liveness</span>
        </div>
        <div className="flex flex-col items-center gap-x-2">
          
          <span className="flex flex-row  items-center gap-2"> <FaCheck />{livenessText}</span><br />
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
        <div className=" w-[410px] ">
          <button onClick={continueFunction} className='bg-primary hover:shadow-lg h-[52px] w-full  text-white mt-4 rounded-[12px] text-sm'>
            Continue
          </button>
        </div>
      )}
    </div>
    </div>
  );
};

export default ResultView;
