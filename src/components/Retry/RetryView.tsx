
type RetryViewProps = {
    errorMessage: string;
    continueFaceLivenessDetector?: () => void;
    returnHome: () => void;
    NinErr: string
  };
  

  const RetryView = ({ errorMessage, continueFaceLivenessDetector, returnHome }: RetryViewProps) => {
    
    return (
      <div className="flex flex-col h-screen justify-start items-center py-24 gap-y-24 text-lg md:text-2xl"><h1>DEBUGGING</h1>
        {errorMessage && ( <p className="text-center w-[80%] text-wrap text-red-600 text-md">{errorMessage}</p>)}
        {continueFaceLivenessDetector ? (
        <button onClick={continueFaceLivenessDetector} className='relative text-white bg-[#036ac4] hover:bg-[#0473ce] flex grow-1 px-2.5 py-1.5 rounded-md text-sm md:text-[1.1rem]'>
          Retry
        </button>
      ) : (
       
          <button onClick={returnHome} className='relative text-white bg-[#036ac4] hover:bg-[#0473ce] flex grow-1 px-2.5 py-1.5 rounded-md text-sm md:text-[1.1rem]'>
            Retry
          </button>
   
      )}
      </div>
    );
  };

  export default RetryView;
