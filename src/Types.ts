import { ChangeEvent } from "react";

export interface DataProps {
  givenName: number;
  surname: string;
  userPrincipalName: string;
  id: string;
  mobilePhone: string;
  jobTitle: string;
}

export interface DataProviderProps {
  children: React.ReactNode;
}

export interface DataContextTypes {
  fetchData: () => void;
  error: string | null;
  graphData: DataProps | null;
  loading: boolean;
  success: boolean;
  setError: (error: string | null) => void;
  accounts: any;
  instance: any;
  token: string | null;
}

export interface LoginRequest {
  scopes: string[];
}

export interface graphConfigProps {
  graphMeEndpoint: string;
}

export interface graphImageProps {
  graphMePhotoEndpoint: string;
}

export interface AuthConfigProps {
  auth: {
    clientId: string;
    authority: string;
    redirectUri: string;
  };
  cache: {
    cacheLocation: string;
    storeAuthStateInCookie: boolean;
  };
  system: {
    loggerOptions: {
      loggerCallback: (level: any, message: any, containsPii: any) => void;
    };
  };
}

export enum ErrorState {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

export interface LogoutPopupProps {
  confirmLogout: () => void;
  cancelLogout: () => void;
}
export interface ProfileDataProps {
  graphData: DataProps;
  token: string | null;
  profileImage: string | null;
  errImage: string | null;
}

export interface CampaignTypes {
  livenessDetectorState: string;
  setLivenessDetectorState: any;
  fetchFailureCallback?: () => void;
}
export interface campaignProviderProps {
  children: React.ReactNode;
}

export interface LiveNess {
  sessionId: string;
  status: string;
  livenessDetection: LivenessDetection;
  createdDateTime: string;
  authTokenTimeToLiveInSeconds: number;
  sessionExpired: boolean;
  deviceCorrelationId: string;
}
export interface LivenessDetection {
  requestId?: null;
  receivedDateTime?: null;
  livenessDecision?: null;
}
export interface LivenessSession {
  authToken: string;
  deviceCorrelationId: string;
  sessionId: string;
}

export interface responseImage {
  livenessDecision: string;
  target: Target;
  modelVersionUsed: string;
  verifyResult: VerifyResult;
}
export interface Target {
  faceRectangle: FaceRectangle;
  fileName: string;
  timeOffsetWithinFile: number;
  imageType: string;
}
export interface FaceRectangle {
  top: number;
  left: number;
  width: number;
  height: number;
}
export interface VerifyResult {
  matchConfidence: number;
  isIdentical: boolean;
}

export interface FetchTokenProps {
  setToken: (token: string) => void;
  setSessionId?: (sessionId: string) => void;
  setError?: (text: string) => void;
}
export interface ApiwithNumberProps {
  setToken: (token: string) => void;
  setSessionId: (sessionId: string) => void;
  Nin: string | undefined;
  file: File | undefined;
  setError?: (text: string) => void;
}

export interface FaceLivenessDetectorProps {
  livenessOperationMode: "Passive" | "PassiveActive";
  file?: File;
  setFile?: (file: File) => void;
  setIsDetectLivenessWithVerify: (res: Boolean) => void;
  fetchFailureCallback?: (error: string) => void;
  setLivenessText?: (text: string) => void;
  setRecognitionText?: (text: string) => void;
  returnHome: () => void;
  setSessionId: (text: string) => void;
  setLivenessStatus?: (text: string) => void;
  setMatchConfidence?: (text: number) => void;
  setNin?: (text: string) => void;
  Nin?: string;
  filePresent?: boolean;
  setFilePresent?: (filePresent: boolean) => void;
  NinErr?: string;
  setNinErr?: (text: string) => void;
  token?: string;
  setToken?: (text: string) => void;
  livenessText?: string;
  recognitionText?: string;
  matchConfidence?: number | null;
  continueFunction?: () => void;
  isDetectLivenessWithVerify?: Boolean;
  sessionId?: string;
  livenessStatus?: string;
  verifyImage?: File;
}

export type LivenessDetectorState =
  | "Initial"
  | "LivenessDetector"
  | "Result"
  | "Retry"
  | "Error"
  | "NIN";

export type LivenessOperationMode = "Passive" | "PassiveActive";

export type ResultViewProps = {
  isDetectLivenessWithVerify: Boolean;
  livenessText: string;
  recognitionText: string;
  continueFunction?: () => void;
  // sessionId: string,
  matchConfidence?: number | null;
  livenessStatus: string;
  verifyImage: File | undefined;
  Nin: string;
};
export type InitialViewProps = {
  verifyImage: File | undefined;
  handleFile: (e: ChangeEvent<HTMLInputElement>) => void;
  initFaceLivenessDetector: (s: LivenessOperationMode) => void;
  setNin: (Nin: string) => void;
  Nin: string;
  // setFilePresent?: (filePresent: boolean) => void;
  handleRemoveImage?: () => void;
  setPopup?: (popup: boolean) => void;
  popupRef?: any;
};
