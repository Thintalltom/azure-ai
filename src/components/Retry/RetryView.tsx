import close from "@/assets/svg/close.svg";
import busted from "@/assets/gif/busted.gif";
import { formatText } from "@/components/face/utils";

type RetryViewProps = {
  errorMessage: string;
  continueFaceLivenessDetector?: () => void;
  returnHome: () => void;
  NinErr: string;

};

const RetryView = ({
  errorMessage,
  continueFaceLivenessDetector,
  returnHome,


}: RetryViewProps) => {
  return (
    <div className="z-[1050] fixed inset-0 bg-opacity-[50%] bg-black backdrop-blur-[2px] max-h-[100vh] flex gap-[35px] justify-center items-end md:items-center">
      <div className="bg-[#FFFFFF] rounded-t-[20px] lg:rounded-[20px] flex flex-col gap-[15px] justify-center relative items-center w-full md:w-[40%] h-[50vh] p-[20px] ">
        <img
          src={close}
          onClick={returnHome}
          alt="close"
          className="cursor-pointer  float-right absolute top-5 right-5"
        />
        <img src={busted} alt="congrats" className="w-[100px] h-[100px] " />
        {errorMessage && (
          <p className="text-center w-[80%] text-wrap text-red-600 text-md">
            {formatText(errorMessage)}
          </p>
        )}
        {continueFaceLivenessDetector ? (
          <button
            onClick={continueFaceLivenessDetector}
            className="relative text-white bg-[#036ac4] flex justify-center items-center hover:bg-[#0473ce] w-full lg:w-[410px] h-[53px] rounded-[12px] text-sm md:text-[1.1rem]"
          >
            Retry
          </button>
        ) : (
          <button
            onClick={returnHome}
            className="relative text-white bg-[#036ac4] flex justify-center items-center hover:bg-[#0473ce] w-full lg:w-[410px] h-[53px] rounded-[12px] text-sm md:text-[1.1rem]"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default RetryView;
