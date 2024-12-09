import { useEffect, useRef, useState } from "react";
import VerificationModal from "../../components/Modal/VerificationModal";
import { InitialViewProps } from "@/Types";
import { useIsAuthenticated } from "@azure/msal-react";
import verify from "@/assets/gif/verify.gif";

const BannerPage = ({
  initFaceLivenessDetector,
  Nin,
  setNin,
  handleFile,
  verifyImage,
  handleRemoveImage,
}: InitialViewProps) => {
  const isAuthenticated = useIsAuthenticated();

  const [popup, setPopup] = useState(false);
  useEffect(() => {
    if (isAuthenticated) {
      setPopup(true);
    }
  }, [isAuthenticated]);

  const showPopup = () => {
    setPopup(true);
  };
  const popupRef = useRef<any>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setPopup(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPopup(false);
      }
    };

    document.addEventListener("click", handleOutsideClick);
    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, []);
  return (
    <div
      // ref={popupRef}
      // bg-[#fbfbfb]  bg-gradient-to-br from-[#fbfbfb] to-[#d8e9fd]
      className="h-[92vh] pt-[8vh] bg-[#fbfbfb] overflow-hidden "
      // style={{
      //   background:
      //     "linear-gradient(to top left,#d8e9fd 20vh,#fff 1%, #fbfbfb 100%)",
      // }}
    >
      <div className=" flex justify-center items-center h-full  gap-[10px] flex-col">
        <img src={verify} alt="person" className="w-[225px] h-[200px] " />
        <p className="text-[24px] font-bold">Verify your identity</p>
        <p className="text-[14px] text-slate-400 text-center">
          Secure and seamless identity verification in just a few steps.
        </p>

        <button
          className="bg-[#4A90E2] rounded-[12px]  text-white w-[80%] lg:w-[320px]  h-[52px] mt-10"
          onClick={showPopup}
        >
          Begin Verification
        </button>
        {popup ? (
          <VerificationModal
            initFaceLivenessDetector={initFaceLivenessDetector}
            setNin={setNin}
            Nin={Nin}
            handleFile={handleFile}
            verifyImage={verifyImage}
            handleRemoveImage={handleRemoveImage}
            setPopup={setPopup}
          />
        ) : null}
      </div>
    </div>
  );
};

export default BannerPage;
