// // DISCLAIMER: In your production environment, you should fetch the token on your app-backend and pass down the session-authorization-token down to the frontend
// // For more information on how to orchestrate the liveness solution, please refer to https://aka.ms/azure-ai-vision-face-liveness-tutorial
// // Please see `server.js` for an example of the server-side code.
import axios from "axios";

// const {setApiError} = useAlatContext();
export async function fetchTokenFromAPI(
  setToken: (token: string) => void,
  setSessionId?: (sessionId: string) => void,
  setErrors?: (text: string) => void,
  errors?:string,
  setErrorOption?: React.Dispatch<React.SetStateAction<boolean>> 
): Promise<void> {

  let DeviceId = await getDummyDeviceId()

  try {
    const response = await axios.post(
      `https://infinionbackendapps-objectvalidation.azurewebsites.net/FaceAPI/${DeviceId}/session/create`
    );


    setToken(response.data.sessionAuthToken);
    if (setSessionId) {
      setSessionId(response.data.sessionId);
    }
  } catch (error: any) {
    
 
    if (setErrors && setErrorOption) {
      setErrorOption(true)
      setErrors(error.response.data);
    }
  }
}

export async function fetchTokenfromApiWithNumber(
  setToken: (token: string) => void,
  setSessionId: (sessionId: string) => void,
  Nin: string | undefined,
  file: File | undefined,
  setErrors?: (text: string) => void,
  errors?:string,
  setErrorOption?: React.Dispatch<React.SetStateAction<boolean>>,
  setApiError?:React.Dispatch<React.SetStateAction<string>>,
): Promise<void> {
setApiError?.("");
localStorage.removeItem("NINDETAILS");
  if (errors && setErrors) {
    setErrors(errors);
    console.error("Skipping API call due to existing error:", errors);
    return; // Exit function early
  }

  const DeviceId = await getDummyDeviceId();
  const NinNumber = Nin;

  const formData = new FormData();
  const endpoint = file
    ? `https://infinionbackendapps-objectvalidation.azurewebsites.net/FaceAPI/${DeviceId}/session/uploadImage/create`
    : `https://infinionbackendapps-objectvalidation.azurewebsites.net/FaceAPI/${DeviceId}/session/${NinNumber}/create`;
  if (file) {
    try {
      formData.append("photo", file);
      const response = await axios.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setToken(response.data.sessionAuthToken);
      if (setSessionId) {
        setSessionId(response.data.sessionId);
        setApiError?.("")
      }
    } catch (error: any) {
      let errorMessage = error.response?.data?.split(".", 1)[0] + ".";
     
      if (error.response?.data) {
        errorMessage =
          typeof error.response.data === "string"
            ? error.response?.data?.split(".", 1)[0] + "."
            : JSON.stringify(error.response.data);
            setApiError?.(errorMessage)
      } else if (error.message) {
        errorMessage = error.message;
      }
    
      
        setErrorOption?.(true)
        setErrors?.(errorMessage);
      
    
      console.error("Error details:", error);
    }
  } else {
    try {
      const response = await axios.post(endpoint);
      localStorage.removeItem("NINDETAILS");
      setToken(response.data.sessionAuthToken);
      if (setSessionId) {
        setSessionId(response.data.sessionId);
      }
    } catch (error: any) {
      // if (setErrors && setErrorOption) {
        setErrorOption?.(true)
        setErrors?.(error.response.data);
      // }

    }
    console.log('the error is:', errors)
  }
}

export type SessionResponse = {
  token: null;
  message: string;
};

export const getDummyDeviceId = async (): Promise<string> => {
  let deviceId = (await navigator.mediaDevices.enumerateDevices()).find(
    (device) => device.deviceId !== ""
  )?.deviceId;

  if (deviceId) {
    deviceId = deviceId.endsWith("=")
      ? Array.from(atob(deviceId), (char) =>
          ("0" + char.charCodeAt(0).toString(16)).slice(-2)
        )?.join("")
      : deviceId;
  } else {
    deviceId =
      globalThis.crypto?.randomUUID()?.replace(/-/g, "") || "0".repeat(64);
  }

  deviceId = "0".repeat(64 - deviceId.length) + deviceId;
  deviceId = (
    BigInt("0x" + deviceId.substring(0, 32)) ^
    BigInt("0x" + deviceId.substring(32, 64))
  )
    .toString(16)
    .substring(0, 32);
  deviceId =
    ("0".repeat(32 - deviceId.length) + deviceId)
      .match(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/)
      ?.slice(1)
      ?.join("-") || "";

  return deviceId;
};
