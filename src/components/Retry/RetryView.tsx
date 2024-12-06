import close from "@/assets/svg/close.svg";
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
    <div className="fixed inset-0 bg-opacity-[50%] bg-black backdrop-blur-[2px] max-h-[100vh] flex gap-[35px] justify-center items-end md:items-center">
      <div className="bg-[#FFFFFF] rounded-[20px] flex flex-col gap-[15px] justify-center relative items-center w-full md:w-[40%] h-[50vh] p-[20px] ">
      <img
          src={close}
          onClick={returnHome}
          alt="close"
          className="cursor-pointer  float-right absolute top-5 right-5"
        />
        {errorMessage && (
          <p className="text-center w-[80%] text-wrap text-red-600 text-md">
            {errorMessage}
          </p>
        )}
        {continueFaceLivenessDetector ? (
          <button
            onClick={continueFaceLivenessDetector}
            className="relative text-white bg-[#036ac4] flex justify-center items-center hover:bg-[#0473ce] rounded-md text-sm w-[20px] md:text-[1.1rem]"
          >
            Retry
          </button>
        ) : (
          <button
            onClick={returnHome}
            className="relative text-white bg-[#036ac4] flex justify-center items-center hover:bg-[#0473ce] w-[5rem] h-[2rem] rounded-md text-sm md:text-[1.1rem]"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default RetryView;
