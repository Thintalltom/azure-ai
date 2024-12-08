import { FaCheck } from "react-icons/fa";
import { FaHeart } from "react-icons/fa";
import { IoPersonSharp } from "react-icons/io5";
import { ResultViewProps } from "@/Types";
import success from "@/assets/gif/success.gif";
import busted from "@/assets/gif/busted.gif";
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
  Nin,
}: ResultViewProps) => {
  const returnHome = () => {
    continueFunction;
  };
  return (
    <div
      // style={{
      //   background:
      //     "linear-gradient(to top left,#d8e9fd 20vh,#fff 1%, #fbfbfb 100%)",
      // }}
      className="  w-full h-full flex items-center justify-center flex-col "
    >
      {/* <img
        src={close}
        alt="close"
        className="cursor-pointer absolute top-5 right-5 "
        onClick={continueFunction}
      /> */}
      <img
        src={livenessText === "RealFace" ? success : busted}
        alt="congrats"
        className="w-[100px] h-[100px] "
      />
      <p
        className={`${
          livenessText === "RealFace" ? "text-green-400" : "text-red-400"
        } font-[700] text-[24px] `}
      >
        {livenessText === "RealFace" ? "Congratulations" : "Busted"}{" "}
      </p>
      <div className="flex flex-col items-center gap-x-2">
        <span className="flex flex-row  items-center gap-2">
          {" "}
          <FaCheck />
          {livenessText}
        </span>
        <br />
        {Nin !== "" ? <p>Livesness Status: {livenessStatus}</p> : ""}
        <br />
        {verifyImage === undefined ? (
          ""
        ) : (
          <p>Livesness Status: {livenessStatus}</p>
        )}
        <br />
        <div>
          {Nin !== "" ? <p>match confidence: {matchConfidence}</p> : ""}
          {verifyImage === undefined ? (
            ""
          ) : (
            <p>Match Confidence: {matchConfidence}</p>
          )}
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
      {continueFunction !== undefined && (
        <div className=" w-full lg:w-[410px] px-10 lg:px-0 ">
          <button
            onClick={continueFunction}
            className="bg-primary hover:shadow-lg h-[52px] w-full  text-white mt-4 rounded-[12px] text-sm"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
};

export default ResultView;
