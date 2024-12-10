import { useState, useEffect } from "react";
import { InitialViewProps } from "@/Types";
import arrow from "@/assets/svg/arrow.svg";
import SignIn from "@/Authentication/SignIn";
import close from "@/assets/svg/close.svg";
import frame from "@/assets/svg/frame.svg";
import { useIsAuthenticated } from "@azure/msal-react";

const VerificationModal = ({
  initFaceLivenessDetector,
  Nin,
  setNin,
  handleFile,
  verifyImage,
  handleRemoveImage,
  setPopup,
  popupRef,
}: InitialViewProps) => {
  const NINDetails = localStorage.getItem("NINDETAILS");
  const isAuthenticated = useIsAuthenticated();
  const [livenessAndVerify, setLivenessAndVerify] = useState<boolean>(false);
  const [showNinDetails, setShowNinDetails] = useState<boolean>(false);
  const [showImageUpload, setShowImageUpload] = useState<boolean>(false);
  const [livenessType, setLivenessType] = useState<
    "liveness" | "livenessAndVerify" | ""
  >("");
  const [uploadType, setUploadType] = useState<"Nin" | "Upload" | "">("");
  const [error, setError] = useState<string>("");
  const getNin = (e: any) => {
    setNin(e.target.value);
    if (e.target.value == "") {
      setError("");
    } else if (e.target.value.length === 11) {
      setError("");
    } else if (e.target.value.length < 11) {
      setError("NIN must be 11 digits");
    } else if (e.target.value.length > 11) {
      setError("NIN must not be more than 11 digits");
    }
  };
  const handleFiles = () => {
    const fileInput = document.getElementById("useVerifyImageFileInput");
    fileInput?.click();
  };

  const disabled = () =>
    livenessType === "" && !showNinDetails && !showImageUpload;
  useEffect(() => {
    if (NINDetails && isAuthenticated) {
      setLivenessAndVerify(true);
      setShowNinDetails(true);
      setShowImageUpload(false);
      setLivenessType("livenessAndVerify");
    }
  }, []);

  return (
    <div className="z-[1050] fixed inset-0 bg-opacity-[50%] bg-black backdrop-blur-sm flex gap-[35px] justify-center items-end md:items-center">
      <div
        className={`bg-[#FFFFFF] rounded-t-[20px] lg:rounded-[20px] relative flex flex-col gap-[15px] justify-center w-full md:w-[40%]  ${
          showImageUpload ? "h-auto" : "h-auto "
        } p-[20px] `}
      >
        <div className="flex justify-between items-center">
          <p className="font-bold text-[20px] ">Verification Method</p>

          <img
            src={close}
            alt="close"
            className="cursor-pointer "
            onClick={() => {
              setPopup?.(false);
              localStorage.removeItem("NINDETAILS");
            }}
          />
        </div>

        <div className="text-[#8A8A8A]  text-[14px]">
          {livenessAndVerify && !showNinDetails && !showImageUpload && (
            <p>Select your preffered method to continue</p>
          )}
          {!livenessAndVerify && (
            <p>Select your preffered method to continue</p>
          )}
          {showNinDetails && <p>Please enter your NIN to continue</p>}
          {showImageUpload && <p>Please upload your image to continue</p>}
        </div>
        <div className="flex flex-col gap-[20px]">
          {!livenessAndVerify ? (
            <div>
              <div className="flex flex-col gap-[20px]">
                <label className="flex gap-[5px] cursor-pointer items-center">
                  <input
                    type="radio"
                    id="liveness"
                    name="livenessType"
                    value={livenessType}
                    checked={livenessType === "liveness"}
                    onChange={() => setLivenessType("liveness")}
                  />
                  <p>Liveness</p>
                </label>
                <label className="flex gap-[5px] items-center cursor-pointer">
                  <input
                    type="radio"
                    id="livenessAndVerify"
                    name="livenessType"
                    value=""
                    checked={livenessType === "livenessAndVerify"}
                    onChange={() => setLivenessType("livenessAndVerify")}
                  />
                  <p>Liveness and Verify</p>
                </label>
              </div>
            </div>
          ) : livenessAndVerify && !showNinDetails && !showImageUpload ? (
            <div className="flex flex-col gap-[20px]">
              <label className="flex gap-[5px] items-center cursor-pointer">
                <input
                  type="radio"
                  id="Nin"
                  name="Nin"
                  value={uploadType}
                  checked={uploadType === "Nin"}
                  onChange={() => setUploadType("Nin")}
                />
                <p>NIN</p>
              </label>
              <label className="flex gap-[5px] items-center cursor-pointer">
                <input
                  type="radio"
                  id="Upload"
                  name="Upload"
                  value={uploadType}
                  checked={uploadType === "Upload"}
                  onChange={() => setUploadType("Upload")}
                />
                <p>Upload Image</p>
              </label>
            </div>
          ) : livenessAndVerify && showNinDetails && !showImageUpload ? (
            <div>
              {NINDetails && isAuthenticated ? (
                <div className="flex flex-col gap-[10px]">
                  <p>NIN</p>
                  <input
                    type="number"
                    placeholder="Enter NIN"
                    className="rounded-[12px] p-[10px] w-full border-[#DEDEDE]  border-[0.5px] text-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    onChange={getNin}
                  />
                  <p className="text-red-500 text-xs">{error}</p>
                </div>
              ) : (
                <SignIn setShowNinDetails={setShowNinDetails} />
              )}
            </div>
          ) : (
            (showImageUpload || uploadType === "Upload") && (
              <div className="flex flex-col gap-[10px]">
                <p>Upload Image</p>
                <div className="flex flex-col bg-[#FBFBFB] w-full h-[135px] gap-[10px] justify-center items-center border-dashed border-[1px] rounded-[8px] ">
                  <input
                    onChange={handleFile}
                    type="file"
                    accept="image/*"
                    id="useVerifyImageFileInput"
                    className="hidden"
                  />
                  {!verifyImage && (
                    <div className="flex flex-col gap-[10px]">
                      <div
                        onClick={handleFiles}
                        className="w-[118px] h-[34px] cursor-pointer  border-[#F4F4F4] border-[1.5px] rounded-[8px] flex flex-row gap-[10px] justify-center items-center"
                      >
                        <img
                          src={arrow}
                          alt="arrow"
                          className="w-[20px] h-[20px]"
                        />
                        <button className="text-[14px]">Upload</button>{" "}
                      </div>

                      <p className="text-[#8A8A8A] text-[10px] text-center">
                        JPG, JPEG and PNG. Max 20MB.
                      </p>
                    </div>
                  )}

                  {verifyImage && (
                    <div className=" flex flex-col gap-[10px] ">
                      <div className="w-[118px] h-[34px] border-[#F4F4F4] border-[1.5px] rounded-[8px] flex flex-row gap-[10px] justify-center items-center">
                        <img
                          src={arrow}
                          alt="arrow"
                          className="w-[20px] h-[20px]"
                        />
                        <button onClick={handleFiles} className="text-[14px]">
                          Upload
                        </button>{" "}
                      </div>

                      <p className="text-[#8A8A8A] text-[10px] text-center">
                        JPG, JPEG and PNG. Max 20MB.
                      </p>
                      <div className="flex gap-[10px] items-center  justify-between bg-[#EBF0F6] rounded-[10px] py-[7px] px-[12px] w-[100%]">
                        <p className="text-[9px] text-[#4A4A4A] truncate ">
                          {verifyImage.name}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveImage && handleRemoveImage()
                          }
                          className=""
                        >
                          <img
                            src={frame}
                            alt="arrow"
                            className="w-[6px] h-[6px]"
                          />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>

        {Nin === "" ? (
          <button
            disabled={disabled()}
            className="bg-primary text-white w-full rounded-[16px] p-[14px] h-[52px] mt-5"
            onClick={() => {
              if (livenessType === "liveness") {
                initFaceLivenessDetector("Passive");
              } else if (verifyImage !== undefined) {
                initFaceLivenessDetector("Passive");
              } else if (
                livenessType === "livenessAndVerify" &&
                uploadType === "Upload"
              ) {
                setShowImageUpload(true);
              } else if (
                livenessType === "livenessAndVerify" &&
                uploadType !== "Nin"
              ) {
                setLivenessAndVerify(true);
              } else if (
                livenessType === "livenessAndVerify" &&
                uploadType === "Nin"
              ) {
                setShowNinDetails(true);
                localStorage.setItem("NINDETAILS", showNinDetails.toString());
              }
            }}
          >
            Continue
          </button>
        ) : (
          <button
            disabled={livenessType === ""}
            className="bg-primary text-white w-full rounded-[16px] p-[14px] h-[52px] mt-5"
            onClick={() => {
              initFaceLivenessDetector("Passive");
            }}
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
};

export default VerificationModal;
